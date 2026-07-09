from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import AsyncIterator

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.config import (
    MAX_CONTEXT_CHUNKS,
    NO_CONTEXT_ANSWER,
    SCORE_THRESHOLD,
    TOP_K,
)
from backend.services import metrics
from backend.services.foundry_client import get_chat_client
from backend.services.generation import build_citation_map, generate, stream_generate
from backend.services.intent import Intent, classify_intent, smalltalk_response
from backend.services.retrieval import retrieve

router = APIRouter(prefix="/query", tags=["query"])
logger = logging.getLogger(__name__)

_NO_RESULT_ANSWER = NO_CONTEXT_ANSWER
_STATUS_PREFIX = "[STATUS]"


def _format_sse_data(text: str) -> bytes:
    """Encode one SSE event; split embedded newlines per the SSE spec."""
    if not text:
        return b"data: \n\n"
    lines = "".join(f"data: {line}\n" for line in text.split("\n"))
    return f"{lines}\n".encode()


class QueryRequest(BaseModel):
    question: str
    top_k: int = TOP_K
    history: list[dict] | None = None


def _build_sources(chunks: list[dict]) -> list[dict]:
    """Return every retrieved chunk for the Evidence panel.

    Each entry carries the `ref` number used for in-text [n] citations so the
    frontend can map brackets to the exact chunk row that produced the fact.
    """
    ref_map = build_citation_map(chunks)
    return [
        {
            "ref": ref_map.get(c["filename"]),
            "filename": c["filename"],
            "chunk_index": c.get("chunk_index"),
            "score": c["score"],
            "confidence": round(c["score"] * 100, 1),
            "preview": c["content"][:300],
            "content": c["content"][:1200],
            "file_type": c["filename"].rsplit(".", 1)[-1].lower()
            if "." in c["filename"]
            else "file",
        }
        for c in chunks
    ]


@router.post("")
async def query(body: QueryRequest):
    """Answer a question from the knowledge base (blocking)."""
    # Small talk / status checks bypass the RAG pipeline entirely — no
    # embedding call, no vector search, no context tokens spent.
    if classify_intent(body.question) is Intent.SMALLTALK:
        logger.info("Intent gate: smalltalk detected — bypassing RAG pipeline.")
        return {"answer": smalltalk_response(body.question), "sources": []}

    t0 = time.perf_counter()
    chunks = await retrieve(body.question, body.top_k)

    if not chunks:
        metrics.record_query((time.perf_counter() - t0) * 1000)
        return {"answer": _NO_RESULT_ANSWER, "sources": []}

    answer = await generate(chunks, body.question, body.history)
    metrics.record_query((time.perf_counter() - t0) * 1000)
    return {"answer": answer, "sources": _build_sources(chunks)}


@router.get("/stream")
async def query_stream(
    request: Request,
    question: str = Query(..., description="User question"),
    top_k: int = Query(TOP_K, description="Maximum number of chunks to return"),
):
    """Answer a question as a Server-Sent Events stream."""

    async def _event_generator() -> AsyncIterator[bytes]:
        if await request.is_disconnected():
            return

        if classify_intent(question) is Intent.SMALLTALK:
            logger.info("Intent gate: smalltalk detected — bypassing RAG pipeline.")
            yield _format_sse_data(smalltalk_response(question))
            yield _format_sse_data(f"[SOURCES]{json.dumps([])}")
            return

        t0 = time.perf_counter()
        yield _format_sse_data(
            f"{_STATUS_PREFIX}Step 1: Normalizing and sanitizing query vectors…"
        )
        yield _format_sse_data(
            f"{_STATUS_PREFIX}Step 2: Scanning Document Vault (vector index)…"
        )
        chunks = await retrieve(question, top_k)
        if await request.is_disconnected():
            logger.info("SSE client disconnected during retrieval")
            return
        yield _format_sse_data(
            f"{_STATUS_PREFIX}Step 3: Applied {SCORE_THRESHOLD:.2f} similarity "
            f"score threshold and relative cutoff filtering…"
        )
        yield _format_sse_data(
            f"{_STATUS_PREFIX}Step 4: Deduplicated chunk fingerprints and enforced "
            f"context cap (max {MAX_CONTEXT_CHUNKS}) — {len(chunks)} chunk(s) retained."
        )

        if not chunks:
            metrics.record_query((time.perf_counter() - t0) * 1000)
            yield _format_sse_data(_NO_RESULT_ANSWER)
            yield _format_sse_data(f"[SOURCES]{json.dumps([])}")
            return

        # Load chat model with keepalive — first query may download phi-3.5-mini (~8 min)
        load_task = asyncio.create_task(get_chat_client())
        while not load_task.done():
            if await request.is_disconnected():
                logger.info("SSE client disconnected during model load")
                load_task.cancel()
                return
            yield b": keepalive\n\n"
            try:
                await asyncio.wait_for(asyncio.shield(load_task), timeout=3.0)
            except asyncio.TimeoutError:
                yield _format_sse_data(
                    f"{_STATUS_PREFIX}Loading language model (phi-3.5-mini)… Please wait."
                )

        try:
            chat_client = load_task.result()
        except Exception as exc:
            logger.exception("Chat model load failed")
            yield _format_sse_data(f"Model failed to load: {exc}")
            yield _format_sse_data(f"[SOURCES]{json.dumps(_build_sources(chunks))}")
            return

        yield _format_sse_data(
            f"{_STATUS_PREFIX}Step 5: Generating long-form cited response…"
        )

        try:
            async for token in stream_generate(
                chunks, question, history=None, chat_client=chat_client
            ):
                if await request.is_disconnected():
                    logger.info("SSE client disconnected during generation")
                    return
                yield _format_sse_data(token)
        except Exception as exc:
            logger.exception("Stream generation failed")
            yield _format_sse_data(f"Response generation failed: {exc}")

        metrics.record_query((time.perf_counter() - t0) * 1000)
        sources_payload = json.dumps(_build_sources(chunks), ensure_ascii=False)
        yield _format_sse_data(f"[SOURCES]{sources_payload}")

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
