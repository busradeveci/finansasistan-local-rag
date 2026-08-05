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
from backend.db.vector_store import search, get_chunk_by_index
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


def _needs_continuation(content: str) -> bool:
    content = content.strip()
    if not content:
        return False
    # If it ends mid-sentence (doesn't end with sentence-ending punctuation)
    if not re.search(r'[.!?…]$', content) and not content.endswith('”') and not content.endswith('"'):
        return True
    # If it ends with a structural header (e.g., Section 5.3)
    if re.search(r'\b(?:Section|Part|Article)\s+\d+(?:\.\d+)*\s*$', content, re.IGNORECASE):
        return True
    return False


def _merge_overlapping_chunks(chunk_a: str, chunk_b: str) -> str:
    # Find the maximum overlap (suffix of A == prefix of B)
    max_overlap = min(len(chunk_a), len(chunk_b), 1000)
    for i in range(max_overlap, 0, -1):
        if chunk_a.endswith(chunk_b[:i]):
            return chunk_a + chunk_b[i:]
    # Fallback if no overlap is found
    return chunk_a + " " + chunk_b


async def retrieve(
    query: str,
    top_k: int = TOP_K,
    db_path: Path = DB_PATH,
    score_threshold: float = SCORE_THRESHOLD,
    metadata_filters: dict[str, str] | None = None,
) -> list[dict]:
    """Return the most relevant chunks for *query*, capped at MAX_CONTEXT_CHUNKS.

    Each result: {filename, chunk_index, content, score}.
    """
    top_k = max(10, top_k)
    effective_top_k = max(1, min(top_k, MAX_CONTEXT_CHUNKS))
    t0 = time.perf_counter()
    query_embedding = await embed_query(query)
    metrics.record_embedding((time.perf_counter() - t0) * 1000)
    # Over-fetch slightly so dedupe/relative filtering still fills the cap.
    results = search(
        query_embedding,
        query_text=query,
        top_k=effective_top_k * 2,
        db_path=db_path,
        score_threshold=0.0,
        metadata_filters=metadata_filters,
    )
    metrics.record_retrieval((time.perf_counter() - t0) * 1000)

    kept = _filter_and_dedupe(results, score_threshold)[:effective_top_k]
    if not kept:
        logger.info(
            "Retrieve returned 0 chunk(s) — all candidates below threshold %.2f.",
            score_threshold,
        )
        return []

    cleaned = []
    for chunk in kept:
        filename = chunk["filename"]
        chunk_idx = chunk.get("chunk_index")
        content = chunk["content"]
        
        # Continuity Check
        if chunk_idx is not None and _needs_continuation(content):
            next_chunk_text = get_chunk_by_index(filename, chunk_idx + 1, db_path=db_path)
            if next_chunk_text:
                content = _merge_overlapping_chunks(content, next_chunk_text)
                logger.debug("Appended chunk #%d to chunk #%d for continuity", chunk_idx + 1, chunk_idx)
                
        cleaned.append({
            "filename": _clean_document_name(filename),
            "chunk_index": chunk_idx,
            "content": content,
            "score": chunk["score"],
        })

    logger.info(
        "Retrieve returned %d chunk(s) for query (threshold=%.2f, top score=%.2f).",
        len(cleaned), score_threshold, cleaned[0]["score"],
    )
    return cleaned
