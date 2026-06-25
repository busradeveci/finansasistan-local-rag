"""Shared Microsoft Foundry Local SDK initialisation for all backend services."""
from __future__ import annotations

import asyncio
import logging
import threading
import time

from backend.config import (
    CHAT_MODEL,
    EMBED_BATCH_SIZE,
    EMBED_MAX_RETRIES,
    EMBED_MODEL,
)

logger = logging.getLogger(__name__)

_sdk_lock = threading.Lock()
_manager = None
_embed_client = None
_chat_client = None
_embed_init_lock = asyncio.Lock()
_chat_init_lock = asyncio.Lock()


def ensure_sdk():
    """Return the FoundryLocalManager singleton (thread-safe, initialise once)."""
    global _manager

    if _manager is not None:
        return _manager

    with _sdk_lock:
        if _manager is not None:
            return _manager

        from foundry_local_sdk import Configuration, FoundryLocalManager  # type: ignore[import]

        try:
            existing = FoundryLocalManager.instance
            if existing is not None:
                _manager = existing
                logger.info("Foundry Local SDK reusing existing manager instance.")
                return _manager
        except Exception:
            pass

        config = Configuration(app_name="FinansAsistan")
        FoundryLocalManager.initialize(config)

        _manager = FoundryLocalManager.instance
        if _manager is None:
            raise RuntimeError(
                "FoundryLocalManager.initialize() succeeded but instance is None. "
                "Is the Foundry Local service running? Run: foundry service start"
            )

        logger.info("Foundry Local SDK connected to local service.")
        return _manager


def _download_if_needed(model, alias: str) -> None:
    if model.is_cached:
        logger.info("Model '%s' found in local cache — skipping download.", alias)
        return

    logger.info("Model '%s' not cached — starting download (one-time).", alias)
    last_logged = [0.0]

    def _progress(pct: float) -> None:
        if pct - last_logged[0] >= 10.0 or pct >= 99.9:
            logger.info("Downloading '%s': %.1f%%", alias, pct)
            last_logged[0] = pct

    model.download(_progress)
    logger.info("Download complete for '%s'.", alias)


def _load_embedding_client_blocking():
    manager = ensure_sdk()
    model = manager.catalog.get_model(EMBED_MODEL)
    _download_if_needed(model, EMBED_MODEL)
    logger.info("Loading embedding model '%s'…", EMBED_MODEL)
    model.load()
    client = model.get_embedding_client()
    logger.info("Embedding model '%s' ready.", EMBED_MODEL)
    return client


def _load_chat_client_blocking():
    manager = ensure_sdk()
    model = manager.catalog.get_model(CHAT_MODEL)
    _download_if_needed(model, CHAT_MODEL)
    logger.info("Loading chat model '%s'…", CHAT_MODEL)
    model.load()
    client = model.get_chat_client()
    logger.info("Chat model '%s' ready.", CHAT_MODEL)
    return client


def _generate_embeddings_sync(client, batch: list[str]):
    """Call Foundry embed API for one batch (runs in thread pool)."""
    return client.generate_embeddings(batch)


async def get_embedding_client():
    """Lazy-load and return the shared EmbeddingClient (async-safe)."""
    global _embed_client
    if _embed_client is not None:
        return _embed_client

    async with _embed_init_lock:
        if _embed_client is not None:
            return _embed_client
        logger.info("Initialising embedding model '%s' via Foundry Local SDK…", EMBED_MODEL)
        t0 = time.perf_counter()
        _embed_client = await asyncio.to_thread(_load_embedding_client_blocking)
        logger.info("Embedding client ready in %.1f s.", time.perf_counter() - t0)
        return _embed_client


async def get_chat_client():
    """Lazy-load and return the shared ChatClient (async-safe)."""
    global _chat_client
    if _chat_client is not None:
        return _chat_client

    async with _chat_init_lock:
        if _chat_client is not None:
            return _chat_client
        logger.info("Initialising chat model '%s' via Foundry Local SDK…", CHAT_MODEL)
        t0 = time.perf_counter()
        _chat_client = await asyncio.to_thread(_load_chat_client_blocking)
        logger.info("Chat client ready in %.1f s.", time.perf_counter() - t0)
        return _chat_client


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch-embed strings in small groups with retry.

    Sending dozens of chunks in one Foundry call causes
    'Operation was cancelled' on CPU — process in batches of EMBED_BATCH_SIZE.
    """
    if not texts:
        return []

    client = await get_embedding_client()
    total = len(texts)
    total_batches = (total + EMBED_BATCH_SIZE - 1) // EMBED_BATCH_SIZE
    all_vectors: list[list[float]] = []
    t0 = time.perf_counter()

    for start in range(0, total, EMBED_BATCH_SIZE):
        batch = texts[start : start + EMBED_BATCH_SIZE]
        batch_no = start // EMBED_BATCH_SIZE + 1
        logger.info(
            "Embedding batch %d/%d (%d chunk(s), total progress %d/%d)…",
            batch_no, total_batches, len(batch), min(start + len(batch), total), total,
        )

        last_exc: Exception | None = None
        for attempt in range(1, EMBED_MAX_RETRIES + 1):
            try:
                response = await asyncio.to_thread(
                    _generate_embeddings_sync, client, batch
                )
                all_vectors.extend(item.embedding for item in response.data)
                last_exc = None
                break
            except Exception as exc:
                last_exc = exc
                logger.warning(
                    "Embedding batch %d/%d attempt %d/%d failed: %s",
                    batch_no, total_batches, attempt, EMBED_MAX_RETRIES, exc,
                )
                if attempt < EMBED_MAX_RETRIES:
                    await asyncio.sleep(2 * attempt)

        if last_exc is not None:
            raise RuntimeError(
                f"Embedding generation failed for model '{EMBED_MODEL}' "
                f"(batch {batch_no}/{total_batches}): {last_exc}"
            ) from last_exc

        # Brief pause so Foundry CPU inference can breathe between batches
        if batch_no < total_batches:
            await asyncio.sleep(0.5)

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "Embedded %d chunk(s) in %.1f ms (model=%s, batches=%d).",
        total, elapsed_ms, EMBED_MODEL, total_batches,
    )
    return all_vectors


async def embed_query(text: str) -> list[float]:
    """Embed a single query string."""
    vectors = await embed_texts([text])
    return vectors[0]
