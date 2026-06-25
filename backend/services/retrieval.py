"""Retrieval service — embeds queries and searches the local vector store."""
from __future__ import annotations

import logging
import re
from pathlib import Path

from backend.config import DB_PATH, TOP_K
from backend.db.vector_store import search
from backend.services.foundry_client import embed_query

logger = logging.getLogger(__name__)

# Minimum cosine similarity — chunks below this are semantically unrelated.
SCORE_THRESHOLD = 0.25

_CHUNK_SUFFIX_RE = re.compile(r"\s*\(chunk\s*#\d+\)\s*", re.IGNORECASE)


def _clean_document_name(filename: str) -> str:
    """Return bare document name without embedded chunk references."""
    return _CHUNK_SUFFIX_RE.sub("", filename).strip()


async def retrieve(
    query: str,
    top_k: int = TOP_K,
    db_path: Path = DB_PATH,
    score_threshold: float = SCORE_THRESHOLD,
) -> list[dict]:
    """Return the top_k most relevant chunks for *query*.

    Chunks with cosine similarity below *score_threshold* are excluded.
    Each result: {filename, chunk_index, content, score}.
    """
    query_embedding = await embed_query(query)
    results = search(query_embedding, top_k, db_path, score_threshold=0.0)

    filtered = [chunk for chunk in results if chunk["score"] >= score_threshold]
    if not filtered:
        logger.info(
            "Retrieve returned 0 chunk(s) — all candidates below threshold %.2f.",
            score_threshold,
        )
        return []

    cleaned = [
        {
            "filename": _clean_document_name(chunk["filename"]),
            "chunk_index": chunk.get("chunk_index"),
            "content": chunk["content"],
            "score": chunk["score"],
        }
        for chunk in filtered
    ]

    logger.info(
        "Retrieve returned %d chunk(s) for query (threshold=%.2f).",
        len(cleaned), score_threshold,
    )
    return cleaned