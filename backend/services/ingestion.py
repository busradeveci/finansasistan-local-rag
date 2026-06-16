"""Document ingestion service using Microsoft Foundry Local SDK (foundry-local-sdk).

Embedding model : qwen3-embedding-0.6b  (alias defined in backend.config)
SDK package     : foundry-local-sdk  (import: foundry_local_sdk)
Pattern         :
    1.  FoundryLocalManager singleton — initialised once per process
    2.  manager.catalog.get_model(alias)
    3.  model.download() + model.load()              — no-op if cached/loaded
    4.  embed_client = model.get_embedding_client()
    5.  embed_client.generate_embeddings(texts)      — batch embed, fully local

No OpenAI cloud, no HuggingFace, no external network calls.
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
from pathlib import Path
from typing import Callable

import PyPDF2
import docx

from backend.config import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    DB_PATH,
    DOCS_DIR,
    EMBED_MODEL,
)
from backend.db.vector_store import (
    delete_document,
    init_db,
    insert_chunks,
    list_documents,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Text extraction — encoding-resilient
# ---------------------------------------------------------------------------

# Ordered list of encodings tried for plain-text files.
# cp1254 is the Turkish Windows code page; latin-1 never raises on any byte.
_TEXT_ENCODINGS = ["utf-8", "utf-8-sig", "cp1254", "latin-1"]


def _extract_txt(path: Path) -> str:
    """Read a text file trying multiple encodings before giving up."""
    last_exc: Exception | None = None
    for enc in _TEXT_ENCODINGS:
        try:
            text = path.read_text(encoding=enc)
            logger.debug("Read '%s' with encoding %s", path.name, enc)
            return text
        except (UnicodeDecodeError, LookupError) as exc:
            last_exc = exc
    raise RuntimeError(f"Cannot decode '{path}': {last_exc}") from last_exc


def _extract_pdf(path: Path) -> str:
    reader = PyPDF2.PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            pages.append(text)
        else:
            logger.debug("PDF '%s' page %d yielded no text — skipping", path.name, i)
    return "\n".join(pages)


def _extract_docx(path: Path) -> str:
    doc = docx.Document(str(path))
    return "\n".join(para.text for para in doc.paragraphs if para.text.strip())


_EXTRACTORS: dict[str, Callable[[Path], str]] = {
    ".txt":  _extract_txt,
    ".md":   _extract_txt,
    ".pdf":  _extract_pdf,
    ".docx": _extract_docx,
}


def extract_text(path: Path) -> str:
    """Return the cleaned full text of *path*, raising ValueError for unsupported types."""
    extractor = _EXTRACTORS.get(path.suffix.lower())
    if extractor is None:
        raise ValueError(
            f"Unsupported file type '{path.suffix}'. "
            f"Supported: {', '.join(_EXTRACTORS)}"
        )
    raw = extractor(path)
    return _clean_text(raw)


# ---------------------------------------------------------------------------
# Text cleaning
# ---------------------------------------------------------------------------

def _clean_text(text: str) -> str:
    """Normalise whitespace to minimise token waste in the context window."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = "\n".join(line.strip() for line in text.splitlines())
    return text.strip()


# ---------------------------------------------------------------------------
# Chunking — sentence-boundary-aware sliding window
# ---------------------------------------------------------------------------

_MIN_CHUNK_LEN = 60

# Split at sentence endings followed by whitespace, or at paragraph breaks.
_SENTENCE_SPLIT = re.compile(r'(?<=[.!?…])\s+|(?<=\n)\s*\n+')


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Sentence-boundary-aware sliding window chunker.

    1. Splits the document at sentence / paragraph boundaries.
    2. Accumulates segments into a chunk up to `chunk_size` characters.
    3. On chunk seal, carries the last `overlap` characters forward so no
       semantic context is lost across boundaries.
    4. Drops chunks shorter than `_MIN_CHUNK_LEN` (whitespace artefacts).
    """
    if not text:
        return []

    segments = [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]
    if not segments:
        return []

    chunks: list[str] = []
    current = ""

    for segment in segments:
        candidate = (current + " " + segment).strip() if current else segment

        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if len(current) >= _MIN_CHUNK_LEN:
                chunks.append(current)
            overlap_text = current[-overlap:].strip() if len(current) > overlap else current
            current = (overlap_text + " " + segment).strip()

    if len(current) >= _MIN_CHUNK_LEN:
        chunks.append(current)

    return chunks


# ---------------------------------------------------------------------------
# Embedding — Foundry Local SDK, lazy-loaded
# ---------------------------------------------------------------------------

_embed_client = None      # foundry_local_sdk EmbeddingClient
_sdk_initialized = False  # FoundryLocalManager singleton guard


def _ensure_sdk() -> None:
    """Initialise the Foundry Local SDK singleton (safe to call multiple times)."""
    global _sdk_initialized
    if _sdk_initialized:
        return
    from foundry_local_sdk import Configuration, FoundryLocalManager  # type: ignore[import]
    config = Configuration(app_name="FinansAsistan")
    FoundryLocalManager.initialize(config)
    _sdk_initialized = True
    logger.info("Foundry Local SDK singleton initialised (ingestion module).")


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
    logger.info("Embedding model '%s' ready (ingestion module).", EMBED_MODEL)
    return client


async def _init_embed_client() -> None:
    global _embed_client
    if _embed_client is not None:
        return
    logger.info("Initialising embedding model '%s' via Foundry Local SDK…", EMBED_MODEL)
    _embed_client = await asyncio.to_thread(_load_embed_model_blocking)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed *texts* using Foundry Local SDK; downloads the model on first call.

    Uses EmbeddingClient.generate_embeddings(texts) — fully offline, batch call.
    Returns one embedding vector (list[float]) per input string.
    """
    await _init_embed_client()

    t0 = time.perf_counter()
    # EmbeddingClient.generate_embeddings(input: list[str]) → EmbeddingResponse
    response = await asyncio.to_thread(_embed_client.generate_embeddings, texts)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "Embedded %d chunk(s) in %.1f ms (model=%s)",
        len(texts), elapsed_ms, EMBED_MODEL,
    )
    return [item.embedding for item in response.data]


# ---------------------------------------------------------------------------
# Ingest helpers
# ---------------------------------------------------------------------------

async def ingest_file(
    path: Path,
    force: bool = False,
    db_path: Path = DB_PATH,
) -> dict:
    """Ingest a single file into the vector store.

    Returns {"filename": str, "chunks": int, "skipped": bool}.
    """
    filename = path.name
    existing = {doc["filename"] for doc in list_documents(db_path)}

    if filename in existing:
        if not force:
            logger.info("Skipping '%s' — already ingested (use force=True to re-ingest).", filename)
            return {"filename": filename, "chunks": 0, "skipped": True}
        logger.info("Re-ingesting '%s' — deleting existing chunks first.", filename)
        delete_document(filename, db_path)

    t0 = time.perf_counter()

    text = extract_text(path)
    if not text:
        logger.warning("'%s' produced no extractable text — skipping.", filename)
        return {"filename": filename, "chunks": 0, "skipped": False}

    text_chunks = chunk_text(text)
    logger.info(
        "'%s' → %d chunk(s) after splitting (chunk_size=%d, overlap=%d).",
        filename, len(text_chunks), CHUNK_SIZE, CHUNK_OVERLAP,
    )

    if not text_chunks:
        return {"filename": filename, "chunks": 0, "skipped": False}

    embeddings = await embed_texts(text_chunks)

    rows = [
        {
            "filename":    filename,
            "chunk_index": i,
            "content":     chunk,
            "embedding":   embedding,
        }
        for i, (chunk, embedding) in enumerate(zip(text_chunks, embeddings))
    ]
    insert_chunks(rows, db_path)

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "Ingested '%s': %d chunks stored in %.1f ms total.",
        filename, len(rows), elapsed_ms,
    )
    return {"filename": filename, "chunks": len(rows), "skipped": False}


async def ingest_directory(
    docs_dir: Path = DOCS_DIR,
    force: bool = False,
    db_path: Path = DB_PATH,
) -> list[dict]:
    """Ingest all supported files in *docs_dir* into the vector store."""
    init_db(db_path)

    supported_files = [
        f for f in docs_dir.iterdir()
        if f.is_file() and f.suffix.lower() in _EXTRACTORS
    ]

    if not supported_files:
        logger.warning("No supported files found in '%s'.", docs_dir)
        return []

    logger.info(
        "Starting directory ingest: %d file(s) in '%s'.", len(supported_files), docs_dir
    )
    results: list[dict] = []
    for file_path in sorted(supported_files):
        result = await ingest_file(file_path, force=force, db_path=db_path)
        results.append(result)

    ingested = sum(1 for r in results if not r["skipped"] and r["chunks"] > 0)
    skipped  = sum(1 for r in results if r["skipped"])
    logger.info("Directory ingest complete: %d ingested, %d skipped.", ingested, skipped)
    return results
