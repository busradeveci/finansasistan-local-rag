from __future__ import annotations

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

# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

def _extract_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def _extract_pdf(path: Path) -> str:
    reader = PyPDF2.PdfReader(str(path))
    return "\n".join(
        page.extract_text() or "" for page in reader.pages
    )


def _extract_docx(path: Path) -> str:
    doc = docx.Document(str(path))
    return "\n".join(para.text for para in doc.paragraphs)


_EXTRACTORS: dict[str, Callable[[Path], str]] = {
    ".txt":  _extract_txt,
    ".md":   _extract_txt,
    ".pdf":  _extract_pdf,
    ".docx": _extract_docx,
}


def extract_text(path: Path) -> str:
    """Return the full text of *path*, raising ValueError for unsupported types."""
    extractor = _EXTRACTORS.get(path.suffix.lower())
    if extractor is None:
        raise ValueError(
            f"Unsupported file type '{path.suffix}'. "
            f"Supported: {', '.join(_EXTRACTORS)}"
        )
    return extractor(path)


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

_MIN_CHUNK_LEN = 30


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Character-level sliding window chunking with minimum length filter."""
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if len(chunk) >= _MIN_CHUNK_LEN:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


# ---------------------------------------------------------------------------
# Embedding — lazy-loaded Foundry Local client
# ---------------------------------------------------------------------------

_embed_client = None


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed *texts* using Foundry Local; downloads the model on first call."""
    global _embed_client

    if _embed_client is None:
        from foundry_local import FoundryLocalManager  # type: ignore[import]

        print(f"[ingestion] Loading embedding model '{EMBED_MODEL}' …")
        manager = FoundryLocalManager(alias=EMBED_MODEL)
        _embed_client = manager.get_client()
        print(f"[ingestion] Embedding model ready.")

    response = _embed_client.embeddings.create(model=EMBED_MODEL, input=texts)
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
            return {"filename": filename, "chunks": 0, "skipped": True}
        delete_document(filename, db_path)

    text = extract_text(path)
    text_chunks = chunk_text(text)

    if not text_chunks:
        return {"filename": filename, "chunks": 0, "skipped": False}

    embeddings = await embed_texts(text_chunks)

    rows = [
        {
            "filename": filename,
            "chunk_index": i,
            "content": chunk,
            "embedding": embedding,
        }
        for i, (chunk, embedding) in enumerate(zip(text_chunks, embeddings))
    ]
    insert_chunks(rows, db_path)

    return {"filename": filename, "chunks": len(rows), "skipped": False}


async def ingest_directory(
    docs_dir: Path = DOCS_DIR,
    force: bool = False,
    db_path: Path = DB_PATH,
) -> list[dict]:
    """Ingest all supported files in *docs_dir* into the vector store.

    Returns a list of per-file result dicts from ingest_file.
    """
    init_db(db_path)

    supported_files = [
        f for f in docs_dir.iterdir()
        if f.is_file() and f.suffix.lower() in _EXTRACTORS
    ]

    results: list[dict] = []
    for file_path in sorted(supported_files):
        result = await ingest_file(file_path, force=force, db_path=db_path)
        status = "skipped" if result["skipped"] else f"{result['chunks']} chunks"
        print(f"[ingestion] {result['filename']}: {status}")
        results.append(result)

    return results
