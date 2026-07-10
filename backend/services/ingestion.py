"""Document ingestion service — Microsoft Foundry Local SDK (foundry-local-sdk).

HOW MODEL LOADING WORKS (bypasses broken CLI catalog):
  `manager.catalog.get_model(alias)` queries the LOCAL Foundry service registry,
  not the remote Azure catalog. So programmatic model loading works even when
  `foundry model list` returns "No models were returned from Azure Foundry catalog".

Loading sequence (lazy — triggered on first document upload):
  1. FoundryLocalManager.initialize(config)      — connect to local service
  2. catalog.get_model("qwen3-embedding-0.6b")   — local registry lookup
  3. model.download(progress_cb)                 — download if not cached
  4. model.load()                                — load into inference engine
  5. model.get_embedding_client()                — get EmbeddingClient
  6. embed_client.generate_embeddings(texts)     — batch embed all chunks
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
from pathlib import Path
from typing import Callable

import docx
import pandas as pd
import PyPDF2

from backend.config import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    DB_PATH,
    DOCS_DIR,
)
from backend.db.vector_store import (
    chunk_content_hash,
    delete_document,
    init_db,
    insert_chunks,
    list_documents,
)
from backend.services.foundry_client import embed_texts

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Text extraction — encoding-resilient
# ---------------------------------------------------------------------------

_TEXT_ENCODINGS = ["utf-8", "utf-8-sig", "cp1254", "latin-1"]


def _extract_txt(path: Path) -> str:
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

_TABULAR_EXTENSIONS = {".xlsx", ".csv"}


def _format_cell_value(value: object) -> str:
    if pd.isna(value):
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def _dataframe_to_row_strings(df: pd.DataFrame, filename: str) -> list[str]:
    """Convert each spreadsheet row into a structured, query-friendly string."""
    if df.empty:
        return []

    df = df.copy()
    df.columns = [str(col).strip() for col in df.columns]

    rows: list[str] = []
    for row_number, (_, series) in enumerate(df.iterrows(), start=1):
        parts: list[str] = []
        for column_name, raw_value in series.items():
            value = _format_cell_value(raw_value)
            if value:
                parts.append(f"Column [{column_name}]: {value}")
        if not parts:
            continue
        rows.append(
            f"Source: {filename} | Row [{row_number}] - " + ", ".join(parts)
        )
    return rows


def _extract_xlsx(path: Path) -> list[str]:
    df = pd.read_excel(path, engine="openpyxl")
    return _dataframe_to_row_strings(df, path.name)


def _extract_csv(path: Path) -> list[str]:
    last_exc: Exception | None = None
    for encoding in _TEXT_ENCODINGS:
        try:
            df = pd.read_csv(path, encoding=encoding)
            return _dataframe_to_row_strings(df, path.name)
        except (UnicodeDecodeError, LookupError) as exc:
            last_exc = exc
    raise RuntimeError(f"Cannot decode CSV '{path}': {last_exc}") from last_exc


_TABULAR_EXTRACTORS: dict[str, Callable[[Path], list[str]]] = {
    ".xlsx": _extract_xlsx,
    ".csv":  _extract_csv,
}


def extract_tabular_rows(path: Path) -> list[str]:
    extractor = _TABULAR_EXTRACTORS.get(path.suffix.lower())
    if extractor is None:
        raise ValueError(
            f"Unsupported tabular file type '{path.suffix}'. "
            f"Supported: {', '.join(sorted(_TABULAR_EXTRACTORS))}"
        )
    return extractor(path)


def extract_text(path: Path) -> str:
    extractor = _EXTRACTORS.get(path.suffix.lower())
    if extractor is None:
        raise ValueError(
            f"Unsupported file type '{path.suffix}'. "
            f"Supported: {', '.join(_EXTRACTORS)}"
        )
    return _clean_text(extractor(path))


# ---------------------------------------------------------------------------
# Text cleaning
# ---------------------------------------------------------------------------

def _clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = "\n".join(line.strip() for line in text.splitlines())
    return text.strip()


# ---------------------------------------------------------------------------
# Chunking — sentence-boundary-aware sliding window
# ---------------------------------------------------------------------------

_MIN_CHUNK_LEN  = 60
_SENTENCE_SPLIT = re.compile(r'(?<=[.!?…])\s+|(?<=\n)\s*\n+')


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
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
# Ingest helpers
# ---------------------------------------------------------------------------

def _dedupe_row_strings(filename: str, row_strings: list[str]) -> list[tuple[str, str]]:
    """Return unique (content, content_hash) pairs, preserving first occurrence."""
    unique: list[tuple[str, str]] = []
    seen: set[str] = set()
    for content in row_strings:
        content_hash = chunk_content_hash(filename, content)
        if content_hash in seen:
            continue
        seen.add(content_hash)
        unique.append((content, content_hash))
    return unique


async def _ingest_tabular_file(
    path: Path,
    filename: str,
    db_path: Path,
) -> dict:
    t0 = time.perf_counter()
    row_strings = await asyncio.to_thread(extract_tabular_rows, path)

    if not row_strings:
        logger.warning("'%s' produced no indexable spreadsheet rows — skipping.", filename)
        return {"filename": filename, "chunks": 0, "skipped": False}

    unique_rows = _dedupe_row_strings(filename, row_strings)
    duplicates_in_file = len(row_strings) - len(unique_rows)
    if duplicates_in_file:
        logger.info(
            "'%s' — skipped %d duplicate row(s) within the file before embedding.",
            filename, duplicates_in_file,
        )

    contents = [content for content, _ in unique_rows]
    embeddings = await embed_texts(contents)

    rows = [
        {
            "filename":    filename,
            "chunk_index": i,
            "content":     content,
            "embedding":   embedding,
            "content_hash": content_hash,
        }
        for i, ((content, content_hash), embedding) in enumerate(zip(unique_rows, embeddings))
    ]
    inserted = insert_chunks(rows, db_path)

    logger.info(
        "Ingested tabular '%s': %d row vector(s) in %.1f ms.",
        filename, inserted, (time.perf_counter() - t0) * 1000,
    )
    return {"filename": filename, "chunks": inserted, "skipped": False}


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
            logger.info("Skipping '%s' — already ingested (force=True to re-ingest).", filename)
            return {"filename": filename, "chunks": 0, "skipped": True}
        logger.info("Re-ingesting '%s' — deleting existing chunks first.", filename)
        delete_document(filename, db_path)

    suffix = path.suffix.lower()
    if suffix in _TABULAR_EXTENSIONS:
        return await _ingest_tabular_file(path, filename, db_path)

    t0   = time.perf_counter()
    text = await asyncio.to_thread(extract_text, path)

    if not text:
        logger.warning("'%s' produced no extractable text — skipping.", filename)
        return {"filename": filename, "chunks": 0, "skipped": False}

    text_chunks = chunk_text(text)
    logger.info("'%s' → %d chunk(s) (chunk_size=%d, overlap=%d).",
                filename, len(text_chunks), CHUNK_SIZE, CHUNK_OVERLAP)

    if not text_chunks:
        return {"filename": filename, "chunks": 0, "skipped": False}

    embeddings = await embed_texts(text_chunks)

    rows = [
        {
            "filename":    filename,
            "chunk_index": i,
            "content":     chunk,
            "embedding":   embedding,
            "content_hash": chunk_content_hash(filename, chunk),
        }
        for i, (chunk, embedding) in enumerate(zip(text_chunks, embeddings))
    ]
    inserted = insert_chunks(rows, db_path)

    logger.info("Ingested '%s': %d chunks in %.1f ms.",
                filename, inserted, (time.perf_counter() - t0) * 1000)
    return {"filename": filename, "chunks": inserted, "skipped": False}


async def ingest_directory(
    docs_dir: Path = DOCS_DIR,
    force: bool = False,
    db_path: Path = DB_PATH,
) -> list[dict]:
    """Ingest all supported files in *docs_dir* into the vector store."""
    init_db(db_path)
    supported_files = [
        f for f in docs_dir.iterdir()
        if f.is_file() and f.suffix.lower() in {*_EXTRACTORS, *_TABULAR_EXTENSIONS}
    ]
    if not supported_files:
        logger.warning("No supported files found in '%s'.", docs_dir)
        return []

    logger.info("Directory ingest: %d file(s) in '%s'.", len(supported_files), docs_dir)
    results: list[dict] = []
    for file_path in sorted(supported_files):
        results.append(await ingest_file(file_path, force=force, db_path=db_path))

    ingested = sum(1 for r in results if not r["skipped"] and r["chunks"] > 0)
    skipped  = sum(1 for r in results if r["skipped"])
    logger.info("Ingest complete: %d ingested, %d skipped.", ingested, skipped)
    return results
