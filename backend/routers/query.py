from __future__ import annotations

import json
from typing import AsyncIterator

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.config import TOP_K
from backend.services.generation import generate, stream_generate
from backend.services.retrieval import retrieve

router = APIRouter(prefix="/query", tags=["query"])

_NO_RESULT_ANSWER = "Bilgi tabanında ilgili doküman bulunamadı."


class QueryRequest(BaseModel):
    question: str
    top_k: int = TOP_K
    history: list[dict] | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_sources(chunks: list[dict]) -> list[dict]:
    return [
        {
            "filename": c["filename"],
            "score": c["score"],
            "preview": c["content"][:150],
        }
        for c in chunks
    ]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

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
        chunks = await retrieve(question, top_k)

        if not chunks:
            yield f"data: {_NO_RESULT_ANSWER}\n\n".encode()
            yield f"data: [SOURCES]{json.dumps([])}\n\n".encode()
            return

        async for token in stream_generate(chunks, question, history=None):
            yield f"data: {token}\n\n".encode()

        sources_payload = json.dumps(_build_sources(chunks), ensure_ascii=False)
        yield f"data: [SOURCES]{sources_payload}\n\n".encode()

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
