from pathlib import Path

from backend.config import DB_PATH, EMBED_MODEL, TOP_K
from backend.db.vector_store import search

_embed_client = None


async def embed_query(text: str) -> list[float]:
    """Embed a single query string using Foundry Local."""
    global _embed_client

    if _embed_client is None:
        from foundry_local import FoundryLocalManager  # type: ignore[import]

        print(f"[retrieval] Loading embedding model '{EMBED_MODEL}' …")
        manager = FoundryLocalManager(alias=EMBED_MODEL)
        _embed_client = manager.get_client()
        print(f"[retrieval] Embedding model ready.")

    response = _embed_client.embeddings.create(model=EMBED_MODEL, input=[text])
    return response.data[0].embedding


async def retrieve(
    query: str,
    top_k: int = TOP_K,
    db_path: Path = DB_PATH,
) -> list[dict]:
    """Return the top_k most relevant chunks for *query*.

    Each result: {filename, chunk_index, content, score}.
    """
    query_embedding = await embed_query(query)
    return search(query_embedding, top_k, db_path)
