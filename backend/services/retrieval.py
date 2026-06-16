"""Retrieval service using Microsoft Foundry Local SDK (foundry-local-sdk).

Embedding model : qwen3-embedding-0.6b  (alias defined in backend.config)
SDK package     : foundry-local-sdk  (import: foundry_local_sdk)
Pattern         :
    1.  FoundryLocalManager singleton — initialised once per process
    2.  manager.catalog.get_model(alias)
    3.  model.download() + model.load()       — no-op if already cached/loaded
    4.  embed_client = model.get_embedding_client()
    5.  embed_client.generate_embeddings([text])   — returns EmbeddingResponse

No OpenAI cloud, no HuggingFace, no external network calls.
"""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from backend.config import DB_PATH, EMBED_MODEL, SCORE_THRESHOLD, TOP_K
from backend.db.vector_store import search

logger = logging.getLogger(__name__)

# Module-level lazy state
_embed_client = None      # foundry_local_sdk EmbeddingClient
_sdk_initialized = False  # FoundryLocalManager singleton guard


# ---------------------------------------------------------------------------
# SDK initialisation helpers
# ---------------------------------------------------------------------------

def _ensure_sdk() -> None:
    """Initialise the Foundry Local SDK singleton (safe to call multiple times)."""
    global _sdk_initialized
    if _sdk_initialized:
        return
    from foundry_local_sdk import Configuration, FoundryLocalManager  # type: ignore[import]
    config = Configuration(app_name="FinansAsistan")
    FoundryLocalManager.initialize(config)
    _sdk_initialized = True
    logger.info("Foundry Local SDK singleton initialised (retrieval module).")


def _load_embed_model_blocking() -> object:
    """Download, load, and return the EmbeddingClient — runs in a thread pool."""
    _ensure_sdk()
    from foundry_local_sdk import FoundryLocalManager  # type: ignore[import]

    manager = FoundryLocalManager.instance
    model = manager.catalog.get_model(EMBED_MODEL)

    logger.info("Downloading embedding model '%s' (skipped if cached)…", EMBED_MODEL)
    model.download()

    logger.info("Loading embedding model '%s' into inference engine…", EMBED_MODEL)
    model.load()

    client = model.get_embedding_client()
    logger.info("Embedding model '%s' ready.", EMBED_MODEL)
    return client


async def _init_embed_client() -> None:
    """Lazy-load the Foundry Local embedding model on first use (async-safe)."""
    global _embed_client
    if _embed_client is not None:
        return

    logger.info("Initialising embedding model '%s' via Foundry Local SDK…", EMBED_MODEL)
    _embed_client = await asyncio.to_thread(_load_embed_model_blocking)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def embed_query(text: str) -> list[float]:
    """Embed a single query string using Foundry Local.

    Uses EmbeddingClient.generate_embeddings([text]) from the
    foundry-local-sdk package — fully offline, no external API calls.

    Returns:
        A list of float values representing the query embedding.
    """
    await _init_embed_client()

    # EmbeddingClient.generate_embeddings(input: list[str]) → EmbeddingResponse
    # response.data[i].embedding → list[float]
    response = await asyncio.to_thread(
        _embed_client.generate_embeddings, [text]
    )
    return response.data[0].embedding


async def retrieve(
    query: str,
    top_k: int = TOP_K,
    db_path: Path = DB_PATH,
) -> list[dict]:
    """Return the top_k most relevant chunks for *query*.

    Chunks with cosine similarity below SCORE_THRESHOLD are excluded so that
    semantically unrelated documents are never injected into the prompt.

    Each result: {filename, chunk_index, content, score}.
    """
    query_embedding = await embed_query(query)
    return search(query_embedding, top_k, db_path, score_threshold=SCORE_THRESHOLD)
