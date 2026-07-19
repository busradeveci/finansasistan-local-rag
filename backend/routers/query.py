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
from backend.sanitize import sanitize_filename
from backend.services import metrics
from backend.services.chat_handler import generate_chat, stream_chat
from backend.services.foundry_client import get_chat_client
from backend.services.generation import build_citation_map, generate, stream_generate
from backend.services.intent import Intent, classify_intent, smalltalk_response
from backend.services.math_handler import try_math_answer
from backend.services.retrieval import retrieve
from backend.services.semantic_router import (
    TRACK_BADGE,
    ExecutionTrack,
    classify_track,
)

router = APIRouter(prefix="/query", tags=["query"])
logger = logging.getLogger(__name__)

_NO_RESULT_ANSWER = NO_CONTEXT_ANSWER
_STATUS_PREFIX = "[STATUS]"
_AGENT_PREFIX = "[AGENT]"


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
    filename: str | None = None


def _search_filters_from_request(
    filename: str | None = None,
) -> dict[str, str] | None:
    filters: dict[str, str] = {}
    if filename and filename.strip():
        filters["filename"] = sanitize_filename(filename.strip())
    return filters or None


def _build_sources(chunks: list[dict]) -> list[dict]:
    """Return every retrieved chunk for the Evidence panel."""
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


async def _resolve_track(question: str) -> ExecutionTrack:
    """Fast-path small talk, then phi-4-mini semantic classification."""
    if classify_intent(question) is Intent.SMALLTALK:
        return ExecutionTrack.LOCAL_CHAT
    return await classify_track(question)


@router.post("")
async def query(body: QueryRequest):
    """Answer a question via the offline semantic router (blocking)."""
    t0 = time.perf_counter()
    track = await _resolve_track(body.question)

    if track is ExecutionTrack.LOCAL_CHAT:
        logger.info("Router: LOCAL_CHAT — phi-3.5 straight-through.")
        answer = await generate_chat(body.question, body.history)
        metrics.record_query((time.perf_counter() - t0) * 1000)
        return {
            "answer": answer,
            "sources": [],
            "track": track.value,
            "agent_badge": TRACK_BADGE[track],
        }

    if track is ExecutionTrack.LOCAL_MATH:
        logger.info("Router: LOCAL_MATH — internal computation.")
        answer = try_math_answer(body.question)
        if answer is None:
            answer = (
                "I could not parse a computable expression from that query. "
                "Please rephrase with explicit numbers and an operation "
                "(e.g. 'What is 15% of 200?' or 'Calculate 1250 * 1.08')."
            )
        metrics.record_query((time.perf_counter() - t0) * 1000)
        return {
            "answer": answer,
            "sources": [],
            "track": track.value,
            "agent_badge": TRACK_BADGE[track],
        }

    # LOCAL_RAG
    metadata_filters = _search_filters_from_request(body.filename)
    chunks = await retrieve(body.question, body.top_k, metadata_filters=metadata_filters)
    if not chunks:
        metrics.record_query((time.perf_counter() - t0) * 1000)
        return {
            "answer": _NO_RESULT_ANSWER,
            "sources": [],
            "track": track.value,
            "agent_badge": TRACK_BADGE[track],
        }

    answer = await generate(chunks, body.question, body.history)
    metrics.record_query((time.perf_counter() - t0) * 1000)
    return {
        "answer": answer,
        "sources": _build_sources(chunks),
        "track": track.value,
        "agent_badge": TRACK_BADGE[track],
    }


@router.get("/stream")
async def query_stream(
    request: Request,
    question: str = Query(..., description="User question"),
    top_k: int = Query(TOP_K, description="Maximum number of chunks to return"),
    filename: str | None = Query(None, description="Restrict search to a single indexed document"),
):
    """Answer a question as a Server-Sent Events stream."""

    async def _event_generator() -> AsyncIterator[bytes]:
        if await request.is_disconnected():
            return

        t0 = time.perf_counter()

        yield _format_sse_data(
            f"{_STATUS_PREFIX}Step 0: Phi-4-mini semantic router classifying intent…"
        )
        track = await _resolve_track(question)
        badge = TRACK_BADGE[track]
        yield _format_sse_data(f"{_AGENT_PREFIX}{badge}")

        if track is ExecutionTrack.LOCAL_CHAT:
            logger.info("Router stream: LOCAL_CHAT — phi-3.5 straight-through.")
            yield _format_sse_data(
                f"{_STATUS_PREFIX}Routing to Standard Chat (phi-3.5-mini)…"
            )
            load_task = asyncio.create_task(get_chat_client())
            while not load_task.done():
                if await request.is_disconnected():
                    load_task.cancel()
                    return
                yield b": keepalive\n\n"
                try:
                    await asyncio.wait_for(asyncio.shield(load_task), timeout=3.0)
                except asyncio.TimeoutError:
                    yield _format_sse_data(
                        f"{_STATUS_PREFIX}Loading chat model (phi-3.5-mini)…"
                    )
            try:
                chat_client = load_task.result()
            except Exception as exc:
                yield _format_sse_data(f"Model failed to load: {exc}")
                yield _format_sse_data(f"[SOURCES]{json.dumps([])}")
                return

            async for token in stream_chat(question, history=None, chat_client=chat_client):
                if await request.is_disconnected():
                    return
                yield _format_sse_data(token)
            metrics.record_query((time.perf_counter() - t0) * 1000)
            yield _format_sse_data(f"[SOURCES]{json.dumps([])}")
            return

        if track is ExecutionTrack.LOCAL_MATH:
            logger.info("Router stream: LOCAL_MATH — internal computation.")
            yield _format_sse_data(
                f"{_STATUS_PREFIX}Local Agent computing metrics (Phi-4 Reasoning track)…"
            )
            answer = try_math_answer(question)
            if answer is None:
                answer = (
                    "I could not parse a computable expression from that query. "
                    "Please rephrase with explicit numbers and an operation."
                )
            metrics.record_query((time.perf_counter() - t0) * 1000)
            yield _format_sse_data(answer)
            yield _format_sse_data(f"[SOURCES]{json.dumps([])}")
            return

        # LOCAL_RAG
        yield _format_sse_data(
            f"{_STATUS_PREFIX}Step 1: Normalizing and sanitizing query vectors…"
        )
        yield _format_sse_data(
            f"{_STATUS_PREFIX}Step 2: Scanning Document Vault (Qwen embedded index)…"
        )
        metadata_filters = _search_filters_from_request(filename)
        if metadata_filters:
            active = ", ".join(f"{k}={v}" for k, v in metadata_filters.items())
            yield _format_sse_data(
                f"{_STATUS_PREFIX}Target source active — {active}"
            )
        chunks = await retrieve(question, top_k, metadata_filters=metadata_filters)
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
