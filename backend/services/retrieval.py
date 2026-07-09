"""Retrieval service — embeds queries and searches the local vector store.

Token-efficiency contract: only the densest, highest-relevance chunks may
reach the prompt template.  Four filters run in order:

1. Absolute threshold  — drop chunks below SCORE_THRESHOLD (semantic noise).
2. Relative cutoff     — drop chunks scoring far below the best hit, so one
                         strong match is not padded with loosely related tails.
3. Deduplication       — drop repeated (filename, chunk_index) rows and
                         near-identical content produced by chunk overlap.
4. Hard cap            — never return more than MAX_CONTEXT_CHUNKS, regardless
                         of what the caller requests.
"""
from __future__ import annotations

import logging
import re
import time
from pathlib import Path

from backend.config import (
    DB_PATH,
    MAX_CONTEXT_CHUNKS,
    RELATIVE_SCORE_CUTOFF,
    SCORE_THRESHOLD,
    TOP_K,
)
from backend.db.vector_store import search
from backend.services import metrics
from backend.services.foundry_client import embed_query

logger = logging.getLogger(__name__)

_CHUNK_SUFFIX_RE = re.compile(r"\s*\(chunk\s*#\d+\)\s*", re.IGNORECASE)
_WS_RE = re.compile(r"\s+")


def _clean_document_name(filename: str) -> str:
    """Return bare document name without embedded chunk references."""
    return _CHUNK_SUFFIX_RE.sub("", filename).strip()


def _content_fingerprint(content: str) -> str:
    """Whitespace-insensitive key for detecting duplicate chunk payloads."""
    return _WS_RE.sub(" ", content).strip().lower()


def _filter_and_dedupe(results: list[dict], score_threshold: float) -> list[dict]:
    passing = [c for c in results if c["score"] >= score_threshold]
    if not passing:
        return []

    passing.sort(key=lambda c: c["score"], reverse=True)
    relative_floor = passing[0]["score"] * RELATIVE_SCORE_CUTOFF

    seen_ids: set[tuple[str, int | None]] = set()
    seen_content: set[str] = set()
    kept: list[dict] = []
    for chunk in passing:
        if chunk["score"] < relative_floor:
            break  # sorted descending — everything after is weaker still
        identity = (chunk["filename"], chunk.get("chunk_index"))
        fingerprint = _content_fingerprint(chunk["content"])
        if identity in seen_ids or fingerprint in seen_content:
            continue
        seen_ids.add(identity)
        seen_content.add(fingerprint)
        kept.append(chunk)
        if len(kept) >= MAX_CONTEXT_CHUNKS:
            break
    return kept


async def retrieve(
    query: str,
    top_k: int = TOP_K,
    db_path: Path = DB_PATH,
    score_threshold: float = SCORE_THRESHOLD,
) -> list[dict]:
    """Return the most relevant chunks for *query*, capped at MAX_CONTEXT_CHUNKS.

    Each result: {filename, chunk_index, content, score}.
    """
    effective_top_k = max(1, min(top_k, MAX_CONTEXT_CHUNKS))
    t0 = time.perf_counter()
    query_embedding = await embed_query(query)
    metrics.record_embedding((time.perf_counter() - t0) * 1000)
    # Over-fetch slightly so dedupe/relative filtering still fills the cap.
    results = search(query_embedding, effective_top_k * 2, db_path, score_threshold=0.0)
    metrics.record_retrieval((time.perf_counter() - t0) * 1000)

    kept = _filter_and_dedupe(results, score_threshold)[:effective_top_k]
    if not kept:
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
        for chunk in kept
    ]

    logger.info(
        "Retrieve returned %d chunk(s) for query (threshold=%.2f, top score=%.2f).",
        len(cleaned), score_threshold, cleaned[0]["score"],
    )
    return cleaned
