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
    RECURSIVE_CHUNK_SEPARATORS,
)
from backend.db.vector_store import (
    chunk_content_hash,
    delete_document,
    insert_chunks,
    list_documents,
)
from backend.db.schema import init_db
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
from backend.sanitize import sanitize_math_latex

def _clean_text(text: str) -> str:
    text = sanitize_math_latex(text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = "\n".join(line.strip() for line in text.splitlines())
    return text.strip()


# ---------------------------------------------------------------------------
# Chunking — High-Speed Recursive Character Chunker
# ---------------------------------------------------------------------------
# Replaces the dual-pass semantic chunking approach.  The old method embedded
# every paragraph unit *before* producing final chunks (two embedding passes).
# This recursive splitter is pure string operations: zero embedding pre-pass,
# <50 ms for a 30-page PDF, and markdown structure-aware via ordered separators.

_MIN_CHUNK_LEN = 60


def _recursive_split(
    text: str,
    separators: list[str],
    chunk_size: int,
) -> list[str]:
    """Recursively split *text* using *separators* until all pieces fit *chunk_size*."""
    if not text:
        return []

    # Find the first separator that actually appears in the text
    separator = ""
    remaining_separators: list[str] = []
    for i, sep in enumerate(separators):
        if sep == "" or sep in text:
            separator = sep
            remaining_separators = separators[i + 1 :]
            break

    if separator == "":
        # No separator found — return the whole text as one piece
        return [text]

    pieces = text.split(separator) if separator else list(text)
    good: list[str] = []
    for piece in pieces:
        if not piece:
            continue
        # Re-attach the separator so downstream merging sees proper boundaries
        chunk = piece if separator == "" else piece + separator
        if len(chunk) <= chunk_size:
            good.append(chunk)
        elif remaining_separators:
            good.extend(_recursive_split(chunk, remaining_separators, chunk_size))
        else:
            # Absolute last resort — hard-split at chunk_size
            for start in range(0, len(chunk), chunk_size):
                good.append(chunk[start : start + chunk_size])
    return good


def recursive_chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
    separators: list[str] | None = None,
) -> list[str]:
    """Split *text* into overlapping chunks using Recursive Character Chunking.

    Algorithm:
      1. Recursively split with separator priority (section → heading → paragraph
         → sentence → word → character) so markdown structure is preserved.
      2. Greedily merge small pieces into chunks ≤ *chunk_size* chars.
      3. Each new chunk begins *overlap* chars before the previous chunk ended,
         preserving semantic continuity across boundaries.
    """
    if not text:
        return []

    seps = separators if separators is not None else RECURSIVE_CHUNK_SEPARATORS
    pieces = _recursive_split(text, seps, chunk_size)

    if not pieces:
        return []

    chunks: list[str] = []
    current = ""

    for piece in pieces:
        candidate = current + piece
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            stripped = current.strip()
            if len(stripped) >= _MIN_CHUNK_LEN:
                chunks.append(stripped)
            # Start next chunk with overlap from the tail of the current chunk
            if overlap > 0 and len(current) > overlap:
                current = current[-overlap:] + piece
            else:
                current = piece

    # Flush remainder
    stripped = current.strip()
    if len(stripped) >= _MIN_CHUNK_LEN:
        chunks.append(stripped)

    return chunks


def _group_tabular_rows(
    row_strings: list[str],
    chunk_size: int = CHUNK_SIZE,
) -> list[str]:
    """Group tabular row strings into size-bounded chunks (no embedding pre-pass).

    Rows are joined with newlines until the combined length would exceed
    *chunk_size*, at which point a new group starts.  This is O(n) and
    completes in microseconds regardless of row count.
    """
    if not row_strings:
        return []
    groups: list[str] = []
    current_rows: list[str] = []
    current_len = 0
    for row in row_strings:
        # +1 for the joining newline
        if current_len + len(row) + 1 > chunk_size and current_rows:
            groups.append("\n".join(current_rows))
            current_rows = []
            current_len = 0
        current_rows.append(row)
        current_len += len(row) + 1
    if current_rows:
        groups.append("\n".join(current_rows))
    return groups


from backend.services.document_metadata import extract_document_metadata

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
    grouped_rows = _group_tabular_rows(contents)
    embeddings = await embed_texts(grouped_rows)
    metadata = extract_document_metadata(filename)

    rows = [
        {
            "filename":    filename,
            "chunk_index": i,
            "content":     content,
            "embedding":   embedding,
            "content_hash": chunk_content_hash(filename, content),
            **metadata,
        }
        for i, (content, embedding) in enumerate(zip(grouped_rows, embeddings))
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

    text_chunks = recursive_chunk_text(text)
    logger.info("'%s' → %d chunk(s) via recursive chunker (chunk_size=%d, overlap=%d).",
                filename, len(text_chunks), CHUNK_SIZE, CHUNK_OVERLAP)

    if not text_chunks:
        return {"filename": filename, "chunks": 0, "skipped": False}

    embeddings = await embed_texts(text_chunks)
    metadata = extract_document_metadata(filename)

    rows = [
        {
            "filename":    filename,
            "chunk_index": i,
            "content":     chunk,
            "embedding":   embedding,
            "content_hash": chunk_content_hash(filename, chunk),
            **metadata,
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
