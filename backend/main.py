import asyncio
import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CHAT_MODEL, DB_PATH, DOCS_DIR, EMBED_MODEL
from backend.db.vector_store import init_db, list_documents
from backend.logging_config import configure_logging
from backend.routers import documents, query

# Logging must be configured before any other backend module emits a record.
configure_logging()
logger = logging.getLogger(__name__)

# Track server start time for uptime reporting in /api/status.
_START_TIME = time.time()

app = FastAPI(
    title="FinansAsistan API",
    description="Kurumsal ve Güvenli Lokal RAG Platformu",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    init_db(DB_PATH)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    doc_count = len(list_documents(DB_PATH))
    logger.info(
        "FinansAsistan API ready. Vector store: %d document(s) indexed. "
        "Chat model: %s | Embed model: %s",
        doc_count, CHAT_MODEL, EMBED_MODEL,
    )
    # Pre-load models in background so the first chat query is not blocked
    # by an ~8-minute phi-3.5-mini download over SSE.
    asyncio.create_task(_warm_models())


async def _warm_models() -> None:
    try:
        from backend.services.foundry_client import get_chat_client, get_embedding_client

        logger.info("Background model warm-up started…")
        await get_embedding_client()
        await get_chat_client()
        logger.info("Background model warm-up complete — chat ready.")
    except Exception as exc:
        logger.warning("Background model warm-up failed (will retry on first query): %s", exc)


app.include_router(documents.router)
app.include_router(query.router)


# ---------------------------------------------------------------------------
# Health / diagnostics
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "message": "FinansAsistan çalışıyor."}


@app.get("/api/status", tags=["health"])
async def api_status():
    """Diagnostic endpoint: live document count, active models, and uptime.

    Useful for pre-demo verification and jury observability.
    """
    docs = list_documents(DB_PATH)
    total_chunks = sum(d["chunks"] for d in docs)
    uptime_s = time.time() - _START_TIME

    return {
        "status": "ok",
        "uptime_seconds": round(uptime_s, 1),
        "vector_store": {
            "document_count": len(docs),
            "total_chunks": total_chunks,
            "documents": [
                {"filename": d["filename"], "chunks": d["chunks"]} for d in docs
            ],
        },
        "models": {
            "chat_model": CHAT_MODEL,
            "embed_model": EMBED_MODEL,
        },
        "runtime": "local — no cloud dependency",
    }
