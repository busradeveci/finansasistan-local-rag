from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncIterator

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.config import TOP_K
from backend.services.foundry_client import get_chat_client
from backend.services.generation import generate, stream_generate
from backend.services.retrieval import retrieve

router = APIRouter(prefix="/query", tags=["query"])
logger = logging.getLogger(__name__)

_NO_RESULT_ANSWER = "Bilgi tabanında ilgili doküman bulunamadı."
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
    """Return unique document names for the UI (no chunk IDs)."""
    best_by_file: dict[str, dict] = {}
    for c in chunks:
        filename = c["filename"]
        entry = {
            "filename": filename,
            "score": c["score"],
            "preview": c["content"][:300],
        }
        existing = best_by_file.get(filename)
        if existing is None or c["score"] > existing["score"]:
            best_by_file[filename] = entry
    return sorted(best_by_file.values(), key=lambda s: s["score"], reverse=True)


@router.post("")
async def query(body: QueryRequest):
    """Answer a question from the knowledge base (blocking)."""
    chunks = await retrieve(body.question, body.top_k)

    if not chunks:
        return {"answer": _NO_RESULT_ANSWER, "sources": []}

    answer = await generate(chunks, body.question, body.history)
    return {"answer": answer, "sources": _build_sources(chunks)}


@router.get("/stream")
async def query_stream(
    question: str = Query(..., description="Kullanıcı sorusu"),
    top_k: int = Query(TOP_K, description="Döndürülecek maksimum chunk sayısı"),
):
    """Answer a question as a Server-Sent Events stream."""

    async def _event_generator() -> AsyncIterator[bytes]:
        yield _format_sse_data(f"{_STATUS_PREFIX}Kaynaklar taranıyor…")
        chunks = await retrieve(question, top_k)

        if not chunks:
            yield _format_sse_data(_NO_RESULT_ANSWER)
            yield _format_sse_data(f"[SOURCES]{json.dumps([])}")
            return

        # Load chat model with keepalive — first query may download phi-3.5-mini (~8 min)
        load_task = asyncio.create_task(get_chat_client())
        while not load_task.done():
            yield b": keepalive\n\n"
            try:
                await asyncio.wait_for(asyncio.shield(load_task), timeout=3.0)
            except asyncio.TimeoutError:
                yield _format_sse_data(
                    f"{_STATUS_PREFIX}Dil modeli (phi-3.5-mini) yükleniyor… Lütfen bekleyin."
                )

        try:
            chat_client = load_task.result()
        except Exception as exc:
            logger.exception("Chat model load failed")
            yield _format_sse_data(f"Model yüklenemedi: {exc}")
            yield _format_sse_data(f"[SOURCES]{json.dumps(_build_sources(chunks))}")
            return

        yield _format_sse_data(f"{_STATUS_PREFIX}Yanıt üretiliyor…")

        try:
            async for token in stream_generate(
                chunks, question, history=None, chat_client=chat_client
            ):
                yield _format_sse_data(token)
        except Exception as exc:
            logger.exception("Stream generation failed")
            yield _format_sse_data(f"Yanıt üretilemedi: {exc}")

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
