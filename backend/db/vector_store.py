import struct
from pathlib import Path

import numpy as np

from backend.config import DB_PATH, TOP_K
from backend.db.database import get_connection

# Number of float32 values per embedding vector — determined at insert time
# from the actual embedding size; stored here for unpack reuse.
_FLOAT_SIZE = struct.calcsize("f")


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

def init_db(db_path: Path = DB_PATH) -> None:
    """Create the documents table and filename index if they don't exist."""
    conn = get_connection(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                filename    TEXT    NOT NULL,
                chunk_index INTEGER NOT NULL,
                content     TEXT    NOT NULL,
                embedding   BLOB    NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename)"
        )
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Write operations
# ---------------------------------------------------------------------------

def _embedding_to_blob(embedding: list[float]) -> bytes:
    return struct.pack(f"{len(embedding)}f", *embedding)


def insert_chunks(chunks: list[dict], db_path: Path = DB_PATH) -> None:
    """Batch-insert pre-computed chunks into the documents table.

    Each dict must contain: filename, chunk_index, content, embedding.
    """
    rows = [
        (
            chunk["filename"],
            chunk["chunk_index"],
            chunk["content"],
            _embedding_to_blob(chunk["embedding"]),
        )
        for chunk in chunks
    ]
    conn = get_connection(db_path)
    try:
        conn.executemany(
            "INSERT INTO documents (filename, chunk_index, content, embedding) VALUES (?, ?, ?, ?)",
            rows,
        )
        conn.commit()
    finally:
        conn.close()


def delete_document(filename: str, db_path: Path = DB_PATH) -> None:
    """Remove all chunks belonging to *filename*."""
    conn = get_connection(db_path)
    try:
        conn.execute("DELETE FROM documents WHERE filename = ?", (filename,))
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Read operations
# ---------------------------------------------------------------------------

def list_documents(db_path: Path = DB_PATH) -> list[dict]:
    """Return [{filename, chunks}] sorted alphabetically, one entry per file."""
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT filename, COUNT(*) AS chunks FROM documents GROUP BY filename ORDER BY filename"
        ).fetchall()
        return [{"filename": row["filename"], "chunks": row["chunks"]} for row in rows]
    finally:
        conn.close()


def search(
    query_embedding: list[float],
    top_k: int = TOP_K,
    db_path: Path = DB_PATH,
) -> list[dict]:
    """Return the *top_k* most similar chunks using cosine similarity.

    Returns a list of dicts: [{filename, chunk_index, content, score}]
    sorted by score descending.
    """
    query_vec = np.array(query_embedding, dtype=np.float32)
    query_norm = np.linalg.norm(query_vec)
    if query_norm == 0:
        return []

    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT filename, chunk_index, content, embedding FROM documents"
        ).fetchall()
    finally:
        conn.close()

    if not rows:
        return []

    results: list[dict] = []
    for row in rows:
        blob: bytes = row["embedding"]
        n_floats = len(blob) // _FLOAT_SIZE
        vec = np.array(struct.unpack(f"{n_floats}f", blob), dtype=np.float32)

        norm = np.linalg.norm(vec)
        if norm == 0:
            score = 0.0
        else:
            score = float(np.dot(query_vec, vec) / (query_norm * norm))

        results.append(
            {
                "filename": row["filename"],
                "chunk_index": row["chunk_index"],
                "content": row["content"],
                "score": score,
            }
        )

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
