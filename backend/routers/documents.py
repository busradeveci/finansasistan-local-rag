from datetime import datetime, timezone
import asyncio
import logging
import traceback
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from backend.config import DB_PATH, DOCS_DIR, EMBED_MODEL
from backend.db.vector_store import (
    delete_document,
    list_chunks,
    list_documents,
    list_metadata_facets,
    vector_index_stats,
)
from backend.services.document_metadata import extract_document_metadata
from backend.sanitize import sanitize_filename
from backend.services import metrics
from backend.services.ingestion import ingest_file
from backend.services.pdf_export import generate_executive_pdf

router = APIRouter(prefix="/documents", tags=["documents"])
logger = logging.getLogger(__name__)

_ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf", ".docx", ".xlsx", ".csv"}


class ExportPdfSource(BaseModel):
    filename: str
    ref: int | None = None
    confidence: float | None = None
    chunk_index: int | None = None
    score: float | None = None
    preview: str | None = None
    content: str | None = None
    file_type: str | None = None


class ExportPdfRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    analysis: str = Field(..., min_length=1)
    sources: list[ExportPdfSource] = Field(default_factory=list)


_ALLOWED_MIME_TYPES = {
    "text/plain",
    "text/markdown",
    "text/x-markdown",
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def _build_inventory() -> dict:
    docs = list_documents(DB_PATH)
    index = vector_index_stats(DB_PATH)
    inventory = []
    for doc in docs:
        filename = doc["filename"]
        path = DOCS_DIR / filename
        ext = Path(filename).suffix.lower().lstrip(".") or "file"
        meta = extract_document_metadata(filename)
        mtime = path.stat().st_mtime if path.exists() else None
        inventory.append(
            {
                "filename": filename,
                "type": ext.upper(),
                "chunks": doc["chunks"],
                "embedding_dimensions": index["dimensions"],
                "embedding_model": EMBED_MODEL,
                "indexation_state": "Indexed" if doc["chunks"] > 0 else "Empty",
                "last_updated": (
                    datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()
                    if mtime
                    else None
                ),
                "path": str(path),
                "year": meta["year"] or None,
                "quarter": meta["quarter"] or None,
                "file_type": meta["file_type"],
            }
        )
    return {"documents": inventory, "index": index}


@router.get("")
async def get_documents():
    """Return all ingested documents with their chunk counts."""
    docs = await asyncio.to_thread(list_documents, DB_PATH)
    return {"documents": docs}


@router.get("/inventory")
async def get_document_inventory():
    """Extended metadata for the Documents workstation table."""
    return await asyncio.to_thread(_build_inventory)


@router.get("/metadata/filters")
async def get_metadata_filters():
    """Distinct metadata facets available for RAG vault scoping."""
    return await asyncio.to_thread(list_metadata_facets, DB_PATH)


@router.get("/chunks")
async def get_document_chunks(
    filename: str = Query(..., description="Document filename"),
):
    """Chunk-level index for the Knowledge Base explorer."""
    safe = sanitize_filename(filename)
    chunks = await asyncio.to_thread(list_chunks, safe, DB_PATH)
    if not chunks:
        raise HTTPException(status_code=404, detail=f"No chunks found for '{safe}'.")
    return {"filename": safe, "chunks": chunks}


@router.post("/upload")
async def upload_document(file: UploadFile):
    """Upload and ingest a document into the vector store."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is missing.")

    filename = file.filename.strip()
    suffix = Path(filename).suffix.lower()
    content_type = (file.content_type or "").strip().lower()
    is_extension_allowed = suffix in _ALLOWED_EXTENSIONS
    is_mime_allowed = content_type in _ALLOWED_MIME_TYPES

    if not is_extension_allowed and not is_mime_allowed:
        metrics.record_upload_rejected()
        raise HTTPException(
            status_code=400,
            detail=(
                f"'{suffix or content_type or 'unknown'}' is not supported. "
                f"Allowed types: {', '.join(sorted(_ALLOWED_EXTENSIONS))}"
            ),
        )

    safe_name = sanitize_filename(filename)
    dest = DOCS_DIR / safe_name
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    try:
        content = await file.read()
        await asyncio.to_thread(dest.write_bytes, content)
        result = await ingest_file(dest, force=True)
    except ValueError as exc:
        logger.warning("Upload rejected for '%s': %s", safe_name, exc)
        if dest.exists():
            dest.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Upload processing failed for '%s'", safe_name)
        if dest.exists():
            dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail=f"Document could not be processed: {exc}",
        ) from exc

    if result.get("chunks", 0) == 0 and not result.get("skipped"):
        if dest.exists():
            dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail="No text could be extracted from the document, or no chunks were produced.",
        )

    return {
        "filename": result["filename"],
        "chunks": result["chunks"],
        "message": "Upload successful.",
    }


@router.post("/export-pdf")
async def export_executive_pdf(body: ExportPdfRequest):
    """Render an executive credit analysis report as a downloadable PDF."""
    try:
        pdf_bytes, system_id = await asyncio.to_thread(
            generate_executive_pdf,
            title=body.title.strip(),
            analysis=body.analysis,
            sources=[s.model_dump() for s in body.sources],
        )
    except Exception as exc:
        logger.error("PDF export failed:\n%s", traceback.format_exc())
        detail = str(exc) if str(exc) else "PDF export failed unexpectedly."
        raise HTTPException(status_code=500, detail=detail) from exc

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"Foundry_Local_Executive_Report_{timestamp}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-System-Id": system_id,
        },
    )


@router.delete("/{filename}")
async def delete_document_endpoint(filename: str):
    """Remove a document from the vector store and disk."""
    safe_name = sanitize_filename(filename)

    def _delete() -> None:
        delete_document(safe_name, DB_PATH)
        file_path = DOCS_DIR / safe_name
        if file_path.exists():
            file_path.unlink()

    await asyncio.to_thread(_delete)
    return {"message": f"{safe_name} deleted."}
