import hashlib
import logging
import struct
import time
from pathlib import Path

import numpy as np

from backend.config import DB_PATH, TOP_K
from backend.db.database import get_connection

logger = logging.getLogger(__name__)

# Number of float32 values per embedding vector — determined at insert time
# from the actual embedding size; stored here for unpack reuse.
_FLOAT_SIZE = struct.calcsize("f")


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

def chunk_content_hash(filename: str, content: str) -> str:
    """Stable hash for deduplicating indexed rows within a source document."""
    payload = f"{filename}\0{content}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _ensure_content_hash_column(conn) -> None:
    columns = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(documents)").fetchall()
    }
    if "content_hash" not in columns:
        conn.execute("ALTER TABLE documents ADD COLUMN content_hash TEXT")
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_documents_content_hash "
        "ON documents(filename, content_hash)"
    )


def init_db(db_path: Path = DB_PATH) -> None:
    """Create the documents table and filename index if they don't exist."""
    logger.info("Initialising vector store at '%s'.", db_path)
    conn = get_connection(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                filename    TEXT    NOT NULL,
                chunk_index INTEGER NOT NULL,
                content     TEXT    NOT NULL,
                embedding   BLOB    NOT NULL,
                content_hash TEXT
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename)"
        )
        _ensure_content_hash_column(conn)
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Write operations
# ---------------------------------------------------------------------------

def _embedding_to_blob(embedding: list[float]) -> bytes:
    return struct.pack(f"{len(embedding)}f", *embedding)


def existing_content_hashes(filename: str, db_path: Path = DB_PATH) -> set[str]:
    """Return content hashes already indexed for *filename*."""
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT content_hash FROM documents WHERE filename = ? AND content_hash IS NOT NULL",
            (filename,),
        ).fetchall()
        return {row["content_hash"] for row in rows}
    finally:
        conn.close()


def insert_chunks(chunks: list[dict], db_path: Path = DB_PATH) -> int:
    """Batch-insert pre-computed chunks into the documents table.

    Each dict must contain: filename, chunk_index, content, embedding.
    Optional ``content_hash`` enables duplicate-row skipping per filename.
    Returns the number of rows actually inserted.
    """
    if not chunks:
        return 0

    filename = chunks[0]["filename"]
    known_hashes = existing_content_hashes(filename, db_path)
    seen_hashes: set[str] = set()

    rows: list[tuple] = []
    for chunk in chunks:
        content = chunk["content"]
        content_hash = chunk.get("content_hash") or chunk_content_hash(filename, content)
        if content_hash in known_hashes or content_hash in seen_hashes:
            continue
        seen_hashes.add(content_hash)
        rows.append(
            (
                chunk["filename"],
                chunk["chunk_index"],
                content,
                _embedding_to_blob(chunk["embedding"]),
                content_hash,
            )
        )

    if not rows:
        logger.info("All %d chunk(s) for '%s' were duplicates — nothing inserted.", len(chunks), filename)
        return 0

    conn = get_connection(db_path)
    try:
        conn.executemany(
            "INSERT INTO documents (filename, chunk_index, content, embedding, content_hash) "
            "VALUES (?, ?, ?, ?, ?)",
            rows,
        )
        conn.commit()
    finally:
        conn.close()

    skipped = len(chunks) - len(rows)
    if skipped:
        logger.info(
            "Inserted %d chunk(s) for '%s'; skipped %d duplicate row(s).",
            len(rows), filename, skipped,
        )
    else:
        logger.debug("Inserted %d chunk(s) for '%s'.", len(rows), filename)
    return len(rows)


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


def list_chunks(filename: str, db_path: Path = DB_PATH) -> list[dict]:
    """Return chunk-level index records for one document (Knowledge Base view)."""
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT chunk_index, content FROM documents WHERE filename = ? ORDER BY chunk_index",
            (filename,),
        ).fetchall()
        return [
            {
                "chunk_index": row["chunk_index"],
                "chars": len(row["content"]),
                "preview": row["content"][:240],
            }
            for row in rows
        ]
    finally:
        conn.close()


def vector_index_stats(db_path: Path = DB_PATH) -> dict:
    """Return live index metrics: {vectors, dimensions}.

    *vectors* is the true row count of the embedding index; *dimensions* is
    read from an actual stored blob (bytes / float32 size), not hardcoded.
    """
    conn = get_connection(db_path)
    try:
        count = conn.execute("SELECT COUNT(*) AS n FROM documents").fetchone()["n"]
        dimensions = 0
        if count:
            row = conn.execute(
                "SELECT embedding FROM documents WHERE embedding IS NOT NULL LIMIT 1"
            ).fetchone()
            if row and row["embedding"]:
                dimensions = len(row["embedding"]) // _FLOAT_SIZE
    finally:
        conn.close()
    return {"vectors": count, "dimensions": dimensions}


def search(
    query_embedding: list[float],
    top_k: int = TOP_K,
    db_path: Path = DB_PATH,
    score_threshold: float = 0.0,
) -> list[dict]:
    """Return the *top_k* most similar chunks using vectorised cosine similarity.

    Returns a list of dicts: [{filename, chunk_index, content, score}]
    sorted by score descending.

    Safeguards:
    - Skips rows with null/empty blobs.
    - Skips rows whose embedding dimension does not match the query vector.
    - Catches struct.error for corrupted blobs without aborting the whole search.
    - Drops results below `score_threshold` before returning.
    """
    query_vec = np.array(query_embedding, dtype=np.float32)
    query_norm = np.linalg.norm(query_vec)
    if query_norm == 0:
        return []

    query_dim = query_vec.shape[0]

    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT filename, chunk_index, content, embedding FROM documents"
        ).fetchall()
    finally:
        conn.close()

    if not rows:
        return []

    # ── Parse blobs into a matrix, skipping malformed rows ──────────────────
    valid_rows: list = []
    vectors: list[np.ndarray] = []

    for row in rows:
        blob: bytes = row["embedding"]
        if not blob:
            continue
        n_floats = len(blob) // _FLOAT_SIZE
        if n_floats == 0 or n_floats != query_dim:
            # Dimension mismatch (e.g. model was swapped) — silently skip
            continue
        try:
            vec = np.array(struct.unpack(f"{n_floats}f", blob), dtype=np.float32)
        except struct.error:
            # Corrupted blob — skip without crashing
            continue
        if not np.isfinite(vec).all():
            continue
        valid_rows.append(row)
        vectors.append(vec)

    if not vectors:
        logger.warning("No valid embeddings found in store — returning empty results.")
        return []

    # ── Vectorised cosine similarity ─────────────────────────────────────────
    t0 = time.perf_counter()

    matrix = np.stack(vectors)                            # (N, D)
    norms = np.linalg.norm(matrix, axis=1)                # (N,)
    norms = np.where(norms == 0, 1e-9, norms)             # guard zero-norm stored vecs
    scores = matrix.dot(query_vec) / (norms * query_norm) # (N,)

    order = np.argsort(scores)[::-1]

    results: list[dict] = []
    for i in order[:top_k]:
        score = float(scores[i])
        if score < score_threshold:
            break
        results.append(
            {
                "filename": valid_rows[i]["filename"],
                "chunk_index": int(valid_rows[i]["chunk_index"]),
                "content": valid_rows[i]["content"],
                "score": score,
            }
        )

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "Retrieved %d chunk(s) above threshold %.2f in %.1f ms "
        "(searched %d vectors, dim=%d) for prompt evaluation.",
        len(results), score_threshold, elapsed_ms, len(vectors), query_dim,
    )
    return results
