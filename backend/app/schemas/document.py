from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel

from app.models.document import DocumentStatus


class DocumentBase(BaseModel):
    title: str
    file_type: str
    file_size: int


class DocumentCreate(DocumentBase):
    file_path: str


class DocumentResponse(DocumentBase):
    id: UUID
    user_id: UUID
    status: DocumentStatus
    error_message: Optional[str] = None
    failed_stage: Optional[str] = None
    failed_at: Optional[datetime] = None
    retry_count: int
    quiz_ready: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int


class DocumentChunkResponse(BaseModel):
    id: UUID
    document_id: UUID
    chunk_index: int
    content: str
    embedding_id: str
    created_at: datetime

    class Config:
        from_attributes = True
