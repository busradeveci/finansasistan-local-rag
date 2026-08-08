"""Shared Microsoft Foundry Local SDK initialisation for all backend services."""
from __future__ import annotations

import asyncio
import logging
import os
import threading
import time

from backend.config import (
    CHAT_MODEL,
    EMBED_BATCH_SIZE,
    EMBED_INTER_BATCH_SLEEP_S,
    EMBED_MAX_RETRIES,
    EMBED_MODEL,
    ROUTER_MODEL,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# CPU-thread-adaptive batch size
# ---------------------------------------------------------------------------
# Tries torch for precise thread awareness; falls back to os.cpu_count().
# All tiers are capped at 4 to prevent FoundryLocalException: Operation was
# cancelled on CPU-only machines with CHUNK_SIZE=3000 (≈800 tokens/chunk).
# EMBED_BATCH_SIZE in config.py acts as a hard upper bound.
try:
    import torch as _torch
    _torch.set_num_threads(max(1, _torch.get_num_threads() - 1))
    _cpu_threads: int = _torch.get_num_threads()
    logger.debug("PyTorch detected: %d thread(s) allocated for inference.", _cpu_threads)
except ImportError:
    _cpu_threads = max(1, (os.cpu_count() or 2) - 1)
    logger.debug("torch not found — using os.cpu_count() fallback: %d thread(s).", _cpu_threads)

# Hard cap of 4 for every CPU tier — prevents SDK operation-cancelled timeouts.
_TIER_BATCH_SIZE: int = 4
_EFFECTIVE_BATCH_SIZE: int = min(EMBED_BATCH_SIZE, _TIER_BATCH_SIZE)
logger.debug(
    "Embedding batch size: config=%d, tier=%d, effective=%d (threads=%d).",
    EMBED_BATCH_SIZE, _TIER_BATCH_SIZE, _EFFECTIVE_BATCH_SIZE, _cpu_threads,
)

# ---------------------------------------------------------------------------
_sdk_lock = threading.Lock()
_manager = None
_embed_client = None
_chat_client = None
_router_client = None
_embed_init_lock = asyncio.Lock()
_chat_init_lock = asyncio.Lock()
_router_init_lock = asyncio.Lock()


def runtime_state() -> dict:
    """Report the real, in-process Foundry Local runtime state.

    Reflects which model clients have actually been loaded into memory and
    whether the SDK manager has been initialised — never fabricated. Reading
    module globals is side-effect free and never triggers a model load.
    """
    endpoint = None
    if _manager is not None:
        endpoint = getattr(_manager, "endpoint", None)
    return {
        "provider": "Foundry Local",
        "sdk_initialized": _manager is not None,
        "endpoint": endpoint,
        "models": {
            "chat": {"alias": CHAT_MODEL, "loaded": _chat_client is not None},
            "embed": {"alias": EMBED_MODEL, "loaded": _embed_client is not None},
            "router": {"alias": ROUTER_MODEL, "loaded": _router_client is not None},
        },
    }


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
    # execution_timeout=300 s gives CPU inference up to 5 minutes per batch,
    # preventing FoundryLocalException: Operation was cancelled on heavy payloads.
    try:
        client = model.get_embedding_client(execution_timeout=300.0)
    except TypeError:
        # Older SDK versions do not accept execution_timeout — fall back gracefully.
        logger.warning(
            "foundry_local_sdk does not support execution_timeout — "
            "using default timeout. Upgrade the SDK to suppress this warning."
        )
        client = model.get_embedding_client()
    logger.info("Embedding model '%s' ready.", EMBED_MODEL)
    return client


def _load_chat_client_blocking(model_alias: str = CHAT_MODEL):
    manager = ensure_sdk()
    model = manager.catalog.get_model(model_alias)
    _download_if_needed(model, model_alias)
    logger.info("Loading chat model '%s'…", model_alias)
    model.load()
    # execution_timeout=600 s gives heavy token generation up to 10 minutes,
    # preventing FoundryLocalException: Operation was cancelled on long prompts.
    # None would disable the SDK timeout entirely; 600 s is the safe maximum.
    try:
        client = model.get_chat_client(execution_timeout=600.0)
    except TypeError:
        # Older SDK versions do not accept execution_timeout — fall back gracefully.
        logger.warning(
            "foundry_local_sdk does not support execution_timeout on chat client — "
            "using default timeout. Upgrade the SDK to suppress this warning."
        )
        client = model.get_chat_client()
    logger.info("Chat model '%s' ready.", model_alias)
    return client


def _load_router_client_blocking():
    return _load_chat_client_blocking(ROUTER_MODEL)


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
        _chat_client = await asyncio.to_thread(_load_chat_client_blocking, CHAT_MODEL)
        logger.info("Chat client ready in %.1f s.", time.perf_counter() - t0)
        return _chat_client


async def get_router_client():
    """Lazy-load phi-4-mini as the semantic routing agent (async-safe)."""
    global _router_client
    if _router_client is not None:
        return _router_client

    async with _router_init_lock:
        if _router_client is not None:
            return _router_client
        logger.info("Initialising router model '%s' via Foundry Local SDK…", ROUTER_MODEL)
        t0 = time.perf_counter()
        _router_client = await asyncio.to_thread(_load_router_client_blocking)
        logger.info("Router client ready in %.1f s.", time.perf_counter() - t0)
        return _router_client


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch-embed strings using the CPU-thread-adaptive batch size with retry.

    Batch size is determined at startup by thread count (see _EFFECTIVE_BATCH_SIZE).
    A brief inter-batch pause (EMBED_INTER_BATCH_SLEEP_S, default 100 ms) prevents
    Foundry CPU inference from saturating between bursts without adding significant
    wall-clock latency.
    """
    if not texts:
        return []

    client = await get_embedding_client()
    total = len(texts)
    total_batches = (total + _EFFECTIVE_BATCH_SIZE - 1) // _EFFECTIVE_BATCH_SIZE
    all_vectors: list[list[float]] = []
    t0 = time.perf_counter()

    for start in range(0, total, _EFFECTIVE_BATCH_SIZE):
        batch = texts[start : start + _EFFECTIVE_BATCH_SIZE]
        batch_no = start // _EFFECTIVE_BATCH_SIZE + 1
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
            # Only this batch failed after all retries.  Batches that already
            # succeeded have their vectors in all_vectors and are not re-run.
            raise RuntimeError(
                f"Embedding generation failed for model '{EMBED_MODEL}' "
                f"(batch {batch_no}/{total_batches}): {last_exc}"
            ) from last_exc

        # Brief pause so Foundry CPU inference can breathe between batches
        if batch_no < total_batches:
            await asyncio.sleep(EMBED_INTER_BATCH_SLEEP_S)

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
