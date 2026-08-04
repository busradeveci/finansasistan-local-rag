import hashlib
import logging
import re
import struct
import time
from pathlib import Path

import numpy as np

from backend.config import DB_PATH, TOP_K
from backend.db.database import get_connection

logger = logging.getLogger(__name__)
_FLOAT_SIZE = struct.calcsize("f")

def chunk_content_hash(filename: str, content: str) -> str:
    payload = f"{filename}\0{content}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()

def _embedding_to_blob(embedding: list[float]) -> bytes:
    return struct.pack(f"{len(embedding)}f", *embedding)

def insert_chunks(chunks: list[dict], db_path: Path = DB_PATH) -> int:
    """Insert *chunks* into the vector store in a single atomic transaction.

    Uses BEGIN IMMEDIATE to acquire a write lock upfront, preventing
    lock-upgrade contention mid-transaction.  A single COMMIT flushes the
    WAL file once, eliminating per-operation fsync overhead.
    """
    if not chunks:
        return 0

    filename = chunks[0]["filename"]
    t0 = time.perf_counter()

    conn = get_connection(db_path)
    try:
        # Reduce fsync frequency during the bulk write (safe under WAL mode).
        conn.execute("PRAGMA synchronous = NORMAL")

        # Single write-lock transaction — one WAL flush at COMMIT.
        conn.execute("BEGIN IMMEDIATE")

        # Get or create document record
        cursor = conn.execute("SELECT id FROM documents WHERE filename = ?", (filename,))
        doc_row = cursor.fetchone()

        if not doc_row:
            ext = Path(filename).suffix.lower()
            conn.execute(
                "INSERT INTO documents (filename, file_size, mime_type, status, chunk_count)"
                " VALUES (?, ?, ?, ?, ?)",
                (filename, 0, ext, "INDEXED", len(chunks)),
            )
            doc_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        else:
            doc_id = doc_row["id"]
            # Clear existing chunks for re-index
            conn.execute("DELETE FROM vector_chunks WHERE document_id = ?", (doc_id,))
            conn.execute(
                "UPDATE documents SET chunk_count = ?, status = 'INDEXED' WHERE id = ?",
                (len(chunks), doc_id),
            )

        rows: list[tuple] = [
            (
                doc_id,
                chunk["chunk_index"],
                chunk["content"],
                0,  # token count — reserved for future use
                _embedding_to_blob(chunk["embedding"]),
            )
            for chunk in chunks
        ]

        conn.executemany(
            "INSERT INTO vector_chunks"
            " (document_id, chunk_index, content_text, token_count, vector_blob)"
            " VALUES (?, ?, ?, ?, ?)",
            rows,
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.debug(
        "insert_chunks: %d rows for '%s' written in %.1f ms (single WAL transaction).",
        len(rows), filename, elapsed_ms,
    )
    return len(rows)

def delete_document(filename: str, db_path: Path = DB_PATH) -> None:
    conn = get_connection(db_path)
    try:
        conn.execute("DELETE FROM documents WHERE filename = ?", (filename,))
        conn.commit()
    finally:
        conn.close()

def list_documents(db_path: Path = DB_PATH) -> list[dict]:
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT filename, chunk_count as chunks, status FROM documents ORDER BY filename"
        ).fetchall()
        return [{"filename": row["filename"], "chunks": row["chunks"], "status": row["status"]} for row in rows]
    finally:
        conn.close()

def list_chunks(filename: str, db_path: Path = DB_PATH) -> list[dict]:
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            '''SELECT c.chunk_index, c.content_text 
               FROM vector_chunks c 
               JOIN documents d ON c.document_id = d.id 
               WHERE d.filename = ? ORDER BY c.chunk_index''',
            (filename,),
        ).fetchall()
        return [
            {
                "chunk_index": row["chunk_index"],
                "chars": len(row["content_text"]),
                "preview": row["content_text"][:240],
            }
            for row in rows
        ]
    finally:
        conn.close()

def vector_index_stats(db_path: Path = DB_PATH) -> dict:
    conn = get_connection(db_path)
    try:
        count = conn.execute("SELECT COUNT(*) AS n FROM vector_chunks").fetchone()["n"]
        dimensions = 0
        if count:
            row = conn.execute(
                "SELECT vector_blob FROM vector_chunks WHERE vector_blob IS NOT NULL LIMIT 1"
            ).fetchone()
            if row and row["vector_blob"]:
                dimensions = len(row["vector_blob"]) // _FLOAT_SIZE
    finally:
        conn.close()
    return {"vectors": count, "dimensions": dimensions}

def list_metadata_facets(db_path: Path = DB_PATH) -> dict[str, list[str]]:
    # Returning empty lists for now to support UI
    return {"years": [], "quarters": [], "file_types": []}

def search(
    query_embedding: list[float],
    query_text: str = "",
    top_k: int = TOP_K,
    db_path: Path = DB_PATH,
    score_threshold: float = 0.0,
    metadata_filters: dict[str, str] | None = None,
) -> list[dict]:
    query_vec = np.array(query_embedding, dtype=np.float32)
    query_norm = np.linalg.norm(query_vec)
    if query_norm == 0:
        return []

    query_dim = query_vec.shape[0]

    conn = get_connection(db_path)
    try:
        where_clauses: list[str] = []
        params: list[str] = []
        if metadata_filters:
            filename = (metadata_filters.get("filename") or "").strip()
            if filename:
                where_clauses.append("d.filename = ?")
                params.append(filename)
        where_sql = f" WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        rows = conn.execute(
            f"SELECT d.filename, c.chunk_index, c.content_text as content, c.vector_blob as embedding "
            f"FROM vector_chunks c JOIN documents d ON c.document_id = d.id{where_sql}",
            params,
        ).fetchall()
    finally:
        conn.close()

    if not rows:
        return []

    valid_rows: list = []
    vectors: list[np.ndarray] = []

    for row in rows:
        blob: bytes = row["embedding"]
        if not blob:
            continue
        n_floats = len(blob) // _FLOAT_SIZE
        if n_floats == 0 or n_floats != query_dim:
            continue
        try:
            vec = np.array(struct.unpack(f"{n_floats}f", blob), dtype=np.float32)
        except struct.error:
            continue
        if not np.isfinite(vec).all():
            continue
        valid_rows.append(row)
        vectors.append(vec)

    if not vectors:
        return []

    t0 = time.perf_counter()
    matrix = np.stack(vectors)
    norms = np.linalg.norm(matrix, axis=1)
    norms = np.where(norms == 0, 1e-9, norms)
    scores = matrix.dot(query_vec) / (norms * query_norm)

    if query_text:
        keywords = []
        for m in re.finditer(r"\b[A-Z0-9][A-Z0-9\-]{2,}\b", query_text):
            if re.search(r"[A-Z]", m.group(0)):
                keywords.append(m.group(0))
        for m in re.finditer(r"\b(?:section|phase)\s+\d+(?:\.\d+)*\b", query_text, flags=re.IGNORECASE):
            keywords.append(m.group(0))
            
        if keywords:
            for i in range(len(valid_rows)):
                content_lower = valid_rows[i]["content"].lower()
                for kw in keywords:
                    if kw.lower() in content_lower:
                        scores[i] += 0.3
                        break

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
                "year": "",
                "quarter": "",
                "file_type": "",
            }
        )

    return results
