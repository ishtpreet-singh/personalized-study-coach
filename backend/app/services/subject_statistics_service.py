import uuid
from typing import Dict, Any, List

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subject import Subject
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.learning_profile import AILearningProfile
from app.models.topic import Topic

class SubjectStatisticsService:
    async def get_subject_stats(self, db: AsyncSession, subject_id: uuid.UUID) -> Dict[str, Any]:
        """Fetch statistics for a single subject."""
        # Document Count
        doc_stmt = select(func.count()).select_from(Document).where(Document.subject_id == subject_id)
        doc_count = await db.scalar(doc_stmt) or 0
        
        # Quiz Count
        quiz_stmt = select(func.count()).select_from(Quiz).where(Quiz.subject_id == subject_id)
        quiz_count = await db.scalar(quiz_stmt) or 0
        
        weak_stmt = select(func.count()).select_from(AILearningProfile).where(
            and_(
                AILearningProfile.subject_id == subject_id,
                AILearningProfile.topic_id.is_not(None),
                AILearningProfile.mastery_score < 60.0
            )
        )
        weak_count = await db.scalar(weak_stmt) or 0
        
        # Mastery (Stored as 0-100 in newer updates, but might be legacy decimal)
        profile_stmt = select(func.avg(AILearningProfile.mastery_score)).where(AILearningProfile.subject_id == subject_id)
        mastery = await db.scalar(profile_stmt) or 0
        mastery_val = float(mastery) if mastery else 0.0
        
        # Legacy decimal support: If mastery is exactly between 0 and 1, it's a legacy decimal.
        # (A real score of exactly 1% is stored as 1.0, which this gracefully handles as well by making it 100% if it was legacy, 
        # but realistically no one gets exactly 1.0 on a 100-point scale quizzes normally)
        if 0 < mastery_val <= 1.0:
            mastery_val = mastery_val * 100
            
        # Last Studied
        subject_stmt = select(Subject.last_studied_at).where(Subject.id == subject_id)
        last_studied = await db.scalar(subject_stmt)
        
        return {
            "document_count": doc_count,
            "quiz_count": quiz_count,
            "weak_topic_count": weak_count,
            "mastery": max(0, min(100, int(mastery_val))),
            "last_studied_at": last_studied.isoformat() if last_studied else None
        }

    async def get_multiple_subjects_stats(self, db: AsyncSession, subject_ids: List[uuid.UUID]) -> Dict[uuid.UUID, Dict[str, Any]]:
        """Fetch statistics for multiple subjects."""
        stats_map = {}
        for sid in subject_ids:
            stats_map[sid] = await self.get_subject_stats(db, sid)
        return stats_map

subject_statistics_service = SubjectStatisticsService()
