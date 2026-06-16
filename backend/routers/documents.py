from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from backend.config import DB_PATH, DOCS_DIR
from backend.db.vector_store import delete_document, list_documents
from backend.sanitize import sanitize_filename
from backend.services.ingestion import ingest_file

router = APIRouter(prefix="/documents", tags=["documents"])

_ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf", ".docx"}


@router.get("")
async def get_documents():
    """Return all ingested documents with their chunk counts."""
    docs = list_documents(DB_PATH)
    return {"documents": docs}


@router.post("/upload")
async def upload_document(file: UploadFile):
    """Upload and ingest a document into the vector store."""
    suffix = Path(file.filename).suffix.lower()
    if suffix not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"'{suffix}' desteklenmiyor. "
                f"İzin verilen türler: {', '.join(sorted(_ALLOWED_EXTENSIONS))}"
            ),
        )

    safe_name = sanitize_filename(file.filename)
    dest = DOCS_DIR / safe_name
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(await file.read())

    result = await ingest_file(dest, force=True)

    return {
        "filename": result["filename"],
        "chunks": result["chunks"],
        "message": "Başarıyla yüklendi.",
    }


@router.delete("/{filename}")
async def delete_document_endpoint(filename: str):
    """Remove a document from the vector store and disk."""
    safe_name = sanitize_filename(filename)
    delete_document(safe_name, DB_PATH)

    file_path = DOCS_DIR / safe_name
    if file_path.exists():
        file_path.unlink()

    return {"message": f"{safe_name} silindi."}
