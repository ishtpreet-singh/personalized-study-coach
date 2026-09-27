import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subject import Subject
from app.models.learning_profile import AILearningProfile
from app.schemas.subject import SubjectCreate, SubjectUpdate

class SubjectService:
    async def create_subject(self, db: AsyncSession, user_id: uuid.UUID, subject_in: SubjectCreate) -> Subject:
        # Create Subject
        db_subject = Subject(
            user_id=user_id,
            name=subject_in.name,
            semester=subject_in.semester,
            color=subject_in.color,
            icon=subject_in.icon,
            exam_date=subject_in.exam_date
        )
        db.add(db_subject)
        await db.flush()
        
        # Initialize an empty Learning Profile for the new subject
        profile = AILearningProfile(
            user_id=user_id,
            subject_id=db_subject.id
        )
        db.add(profile)
        
        await db.commit()
        await db.refresh(db_subject)
        return db_subject

    async def get_subjects(self, db: AsyncSession, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[List[Subject], int]:
        stmt = select(Subject).where(Subject.user_id == user_id).order_by(Subject.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        subjects = result.scalars().all()
        
        count_stmt = select(Subject).where(Subject.user_id == user_id)
        count_result = await db.execute(count_stmt)
        total = len(count_result.scalars().all())
        
        return subjects, total

    async def get_subject(self, db: AsyncSession, subject_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Subject]:
        subject = await db.get(Subject, subject_id)
        if subject and subject.user_id == user_id:
            return subject
        return None

    async def update_subject(self, db: AsyncSession, subject_id: uuid.UUID, user_id: uuid.UUID, subject_in: SubjectUpdate) -> Optional[Subject]:
        subject = await self.get_subject(db, subject_id, user_id)
        if not subject:
            return None
            
        update_data = subject_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(subject, field, value)
            
        await db.commit()
        await db.refresh(subject)
        return subject

    async def delete_subject(self, db: AsyncSession, subject_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        subject = await self.get_subject(db, subject_id, user_id)
        if not subject:
            return False
            
        await db.delete(subject)
        await db.commit()
        return True

subject_service = SubjectService()
