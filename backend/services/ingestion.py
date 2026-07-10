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
    SEMANTIC_CHUNK_SIMILARITY,
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


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _split_semantic_units(text: str) -> list[str]:
    """Split text into paragraph/sentence units for embedding-distance analysis."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", text) if p.strip()]
    units: list[str] = []
    for para in paragraphs:
        if len(para) <= CHUNK_SIZE:
            units.append(para)
            continue
        for sentence in _SENTENCE_SPLIT.split(para):
            sentence = sentence.strip()
            if len(sentence) >= _MIN_CHUNK_LEN // 2:
                units.append(sentence)
    return units or ([text.strip()] if text.strip() else [])


def _merge_units_with_overlap(units: list[str], overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Pack semantic units into size-bounded chunks with character overlap."""
    if not units:
        return []
    chunks: list[str] = []
    current = units[0]
    for unit in units[1:]:
        candidate = (current + "\n\n" + unit).strip()
        if len(candidate) <= CHUNK_SIZE:
            current = candidate
        else:
            if len(current) >= _MIN_CHUNK_LEN:
                chunks.append(current)
            overlap_text = current[-overlap:].strip() if len(current) > overlap else current
            current = (overlap_text + "\n\n" + unit).strip() if overlap_text else unit
    if len(current) >= _MIN_CHUNK_LEN:
        chunks.append(current)
    return chunks


async def semantic_chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
    similarity_threshold: float = SEMANTIC_CHUNK_SIMILARITY,
) -> list[str]:
    """Split *text* on coherent contextual shifts using qwen3-embedding distances.

    Adjacent units whose cosine similarity falls below *similarity_threshold*
    start a new semantic segment; segments are then packed to *chunk_size*.
    Falls back to sentence-boundary chunking when embedding is unavailable.
    """
    units = _split_semantic_units(text)
    if len(units) <= 1:
        return chunk_text(text, chunk_size, overlap)

    try:
        embeddings = await embed_texts(units)
    except Exception as exc:
        logger.warning("Semantic chunking embed failed (%s) — using character chunking.", exc)
        return chunk_text(text, chunk_size, overlap)

    if len(embeddings) != len(units):
        return chunk_text(text, chunk_size, overlap)

    segments: list[list[str]] = [[units[0]]]
    for i in range(1, len(units)):
        sim = _cosine_similarity(embeddings[i - 1], embeddings[i])
        if sim < similarity_threshold:
            segments.append([units[i]])
        else:
            segments[-1].append(units[i])

    merged_units: list[str] = ["\n\n".join(seg) for seg in segments]
    chunks = _merge_units_with_overlap(merged_units, overlap)
    if not chunks:
        return chunk_text(text, chunk_size, overlap)

    logger.info(
        "Semantic chunking: %d unit(s) → %d segment(s) → %d chunk(s) (threshold=%.2f).",
        len(units), len(segments), len(chunks), similarity_threshold,
    )
    return chunks


async def semantic_chunk_rows(row_strings: list[str]) -> list[str]:
    """Group tabular row strings by embedding similarity for coherent index chunks."""
    if len(row_strings) <= 1:
        return row_strings

    try:
        embeddings = await embed_texts(row_strings)
    except Exception as exc:
        logger.warning("Semantic row chunking failed (%s) — keeping row-per-chunk.", exc)
        return row_strings

    groups: list[list[str]] = [[row_strings[0]]]
    for i in range(1, len(row_strings)):
        sim = _cosine_similarity(embeddings[i - 1], embeddings[i])
        candidate = groups[-1] + [row_strings[i]]
        joined = "\n".join(candidate)
        if sim >= SEMANTIC_CHUNK_SIMILARITY and len(joined) <= CHUNK_SIZE:
            groups[-1].append(row_strings[i])
        else:
            groups.append([row_strings[i]])

    return ["\n".join(g) for g in groups if g]


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
    grouped_rows = await semantic_chunk_rows(contents)
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

    text_chunks = await semantic_chunk_text(text)
    logger.info("'%s' → %d semantic chunk(s) (chunk_size=%d, overlap=%d).",
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
