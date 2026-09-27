import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

class SubjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    semester: Optional[str] = Field(None, max_length=100)
    color: str = Field("#4F46E5", max_length=50)
    icon: Optional[str] = Field(None, max_length=50)
    exam_date: Optional[datetime] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    semester: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=50)
    icon: Optional[str] = Field(None, max_length=50)
    exam_date: Optional[datetime] = None

class SubjectResponse(SubjectBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubjectListResponse(BaseModel):
    items: List[SubjectResponse]
    total: int
