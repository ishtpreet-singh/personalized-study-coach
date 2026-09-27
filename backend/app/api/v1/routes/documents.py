import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DBSession
from app.models.document import Document
from app.schemas.document import DocumentListResponse, DocumentResponse
from app.services.storage_service import storage_service
from app.services.document_service import document_service

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "image/jpeg",
    "image/png"
}

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    current_user: CurrentUser,
    db: DBSession,
    background_tasks: BackgroundTasks,
    subject_id: uuid.UUID = Form(...),
    file: UploadFile = File(...)
) -> Any:
    """
    Upload a document, save it locally, and start background processing for RAG.
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed types are: PDF, DOCX, PPTX, TXT, XLSX, JPG, PNG."
        )

    # 1. Save file to storage
    try:
        file_path = await storage_service.save_file(file, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )

    # 2. Create DB record
    file.file.seek(0, 2)
    file_size = file.file.tell()
    
    document = Document(
        user_id=current_user.id,
        subject_id=subject_id,
        title=file.filename or "Untitled",
        file_type=file.content_type,
        file_path=file_path,
        file_size=file_size
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)

    # 3. Trigger background processing
    from app.services.learning_pipeline_service import learning_pipeline_service
    background_tasks.add_task(learning_pipeline_service.process_document_background, document.id)

    return document


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: CurrentUser,
    db: DBSession,
    skip: int = 0,
    limit: int = 100,
    subject_id: uuid.UUID | None = None,
) -> Any:
    """
    Retrieve user's uploaded documents.
    """
    stmt = select(Document).where(Document.user_id == current_user.id)
    count_stmt = select(Document).where(Document.user_id == current_user.id)

    if subject_id:
        stmt = stmt.where(Document.subject_id == subject_id)
        count_stmt = count_stmt.where(Document.subject_id == subject_id)

    stmt = stmt.order_by(Document.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    documents = result.scalars().all()

    # Get total count (not super optimal but good enough for now)
    count_result = await db.execute(count_stmt)
    total = len(count_result.scalars().all())

    return {"items": documents, "total": total}


@router.get("/{id}", response_model=DocumentResponse)
async def get_document(
    id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """
    Get document status by ID.
    """
    document = await db.get(Document, id)
    if not document or document.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    """
    Delete a document (removes from Postgres, ChromaDB, and Local Storage).
    """
    document = await db.get(Document, id)
    if not document or document.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    # Cleanup from storage and Chroma
    await document_service.delete_document(db, document)

    # Cleanup from DB
    await db.delete(document)
    await db.commit()


@router.post("/{id}/retry", response_model=DocumentResponse)
async def retry_document_processing(
    id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """
    Re-queue a failed or pending document for full pipeline processing.
    Clears stale chunk/vector data and restarts: extraction → chunking → embedding → topics → questions.
    """
    from app.models.document import DocumentStatus, DocumentChunk
    from app.services.learning_pipeline_service import learning_pipeline_service
    from datetime import datetime, timezone

    document = await db.get(Document, id)
    if not document or document.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.status == DocumentStatus.PROCESSING:
        raise HTTPException(status_code=409, detail="Document is already being processed.")

    # Clear stale chunks from PostgreSQL (ChromaDB delete is best-effort)
    try:
        chunk_stmt = select(DocumentChunk).where(DocumentChunk.document_id == id)
        chunk_result = await db.execute(chunk_stmt)
        stale_chunks = chunk_result.scalars().all()
        for chunk in stale_chunks:
            await db.delete(chunk)
        await db.flush()
    except Exception:
        pass

    # Clear stale vectors from ChromaDB (best-effort, don't fail retry if Chroma is empty)
    try:
        await document_service.delete_document_vectors(document)
    except Exception:
        pass

    # Reset document state for a clean retry
    document.status = DocumentStatus.PENDING
    document.processing_stage = None
    document.error_message = None
    document.failed_stage = None
    document.failed_at = None
    document.quiz_ready = 0
    document.retry_count = (document.retry_count or 0) + 1
    await db.commit()
    await db.refresh(document)

    # Kick off the pipeline in the background
    background_tasks.add_task(learning_pipeline_service.process_document_background, document.id)

    return document
