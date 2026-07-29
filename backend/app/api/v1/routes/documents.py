import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
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
        title=file.filename or "Untitled",
        file_type=file.content_type,
        file_path=file_path,
        file_size=file_size
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)

    # 3. Trigger background processing
    background_tasks.add_task(document_service.process_document_background, document.id)

    return document


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: CurrentUser,
    db: DBSession,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve user's uploaded documents.
    """
    stmt = (
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    documents = result.scalars().all()

    # Get total count (not super optimal but good enough for now)
    count_stmt = select(Document).where(Document.user_id == current_user.id)
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
