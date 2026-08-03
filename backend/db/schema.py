import logging
from pathlib import Path
from backend.config import DB_PATH
from backend.db.database import get_connection

logger = logging.getLogger(__name__)

def init_db(db_path: Path = DB_PATH) -> None:
    logger.info("Initializing VectorVault SQLite Database at '%s'.", db_path)
    conn = get_connection(db_path)
    try:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            event_type TEXT NOT NULL,
            operator_email TEXT NOT NULL,
            status TEXT NOT NULL,
            message_details TEXT NOT NULL,
            latency_ms INTEGER
        );

        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            file_size INTEGER,
            mime_type TEXT,
            status TEXT NOT NULL,
            chunk_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vector_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            chunk_index INTEGER NOT NULL,
            content_text TEXT NOT NULL,
            token_count INTEGER,
            vector_blob BLOB,
            FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_vector_chunks_doc_id ON vector_chunks(document_id);
        """)
        
        # Insert a default admin user if none exists
        cursor = conn.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            import hashlib
            default_pwd = hashlib.sha256(b"admin").hexdigest()
            conn.execute(
                "INSERT INTO users (email, display_name, role, hashed_password) VALUES (?, ?, ?, ?)",
                ("busra.deveci@vectorvault.local", "Büşra Deveci", "Lead Systems Architect", default_pwd)
            )
            
        conn.commit()
    finally:
        conn.close()
