from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

class MessageResponse(BaseModel):
    id: UUID
    role: str = Field(..., description="'user' or 'assistant'")
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    subject_id: UUID

class ConversationSummary(BaseModel):
    id: UUID
    user_id: UUID
    subject_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(ConversationSummary):
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class ConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
