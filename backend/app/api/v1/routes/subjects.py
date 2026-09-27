import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DBSession
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse, SubjectListResponse
from app.services.subject_service import subject_service

router = APIRouter()

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    *,
    db: DBSession,
    current_user: CurrentUser,
    subject_in: SubjectCreate,
) -> Any:
    """
    Create new subject.
    """
    return await subject_service.create_subject(db=db, user_id=current_user.id, subject_in=subject_in)

@router.get("", response_model=SubjectListResponse)
async def list_subjects(
    db: DBSession,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve subjects.
    """
    subjects, total = await subject_service.get_subjects(db=db, user_id=current_user.id, skip=skip, limit=limit)
    return {"items": subjects, "total": total}

@router.get("/{id}", response_model=SubjectResponse)
async def get_subject(
    *,
    db: DBSession,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Any:
    """
    Get subject by ID.
    """
    subject = await subject_service.get_subject(db=db, subject_id=id, user_id=current_user.id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.patch("/{id}", response_model=SubjectResponse)
async def update_subject(
    *,
    db: DBSession,
    current_user: CurrentUser,
    id: uuid.UUID,
    subject_in: SubjectUpdate,
) -> Any:
    """
    Update a subject.
    """
    subject = await subject_service.update_subject(db=db, subject_id=id, user_id=current_user.id, subject_in=subject_in)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    *,
    db: DBSession,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> None:
    """
    Delete a subject.
    """
    success = await subject_service.delete_subject(db=db, subject_id=id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Subject not found")
