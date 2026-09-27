import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subject import Subject
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.learning_profile import AILearningProfile
from app.models.topic import Topic
from app.models.activity import StudyActivity
from app.services.subject_statistics_service import subject_statistics_service

class DashboardService:
    async def get_dashboard_metrics(self, db: AsyncSession, user_id: uuid.UUID) -> Dict[str, Any]:
        """Aggregate data for the Dashboard."""
        
        # 1. Calculate Study Streak
        streak_stmt = (
            select(func.date(StudyActivity.created_at).label('activity_date'))
            .where(StudyActivity.user_id == user_id)
            .group_by('activity_date')
            .order_by(desc('activity_date'))
        )
        streak_result = await db.execute(streak_stmt)
        dates = streak_result.scalars().all()
        
        study_streak = 0
        if dates:
            today = datetime.now(timezone.utc).date()
            if dates[0] == today or dates[0] == (today - timedelta(days=1)):
                current = dates[0]
                study_streak = 1
                for d in dates[1:]:
                    if d == current - timedelta(days=1):
                        study_streak += 1
                        current = d
                    else:
                        break

        # Get all user subjects
        subjects_stmt = select(Subject).where(Subject.user_id == user_id)
        subjects_result = await db.execute(subjects_stmt)
        subjects = subjects_result.scalars().all()
        
        subject_ids = [s.id for s in subjects]
        
        # If no subjects, return empty dashboard with streak
        if not subject_ids:
            return {
                "study_streak": study_streak,
                "todayGoal": "Create your first subject!",
                "estimatedStudyTimeMins": 0,
                "nextRevision": "None",
                "overallMastery": 0,
                "plan": [],
                "recentActivity": [],
                "subjects": []
            }
            
        # Get subject stats
        stats_map = await subject_statistics_service.get_multiple_subjects_stats(db, subject_ids)
        
        # Calculate overall mastery
        total_mastery = sum(stat["mastery"] for stat in stats_map.values())
        overall_mastery = int(total_mastery / len(subjects)) if subjects else 0
        
        # Get weakest topic for today's goal and plan
        weakest_topic_stmt = select(AILearningProfile).where(AILearningProfile.subject_id.in_(subject_ids), AILearningProfile.topic_id.is_not(None)).order_by(AILearningProfile.mastery_score.asc()).limit(1)
        weakest_topic = await db.scalar(weakest_topic_stmt)
        
        topic_name = "Review"
        if weakest_topic and weakest_topic.topic_id:
            topic_stmt = select(Topic.name).where(Topic.id == weakest_topic.topic_id)
            topic_name = await db.scalar(topic_stmt) or "Review"
            
        # Determine today's goal
        if weakest_topic and weakest_topic.mastery_score < 70:
            today_goal = f"Review {topic_name}"
        elif overall_mastery < 50:
            today_goal = "Practice weak topics"
        else:
            today_goal = "Complete a new quiz"
        
        plan = []
        if weakest_topic:
            subj = next((s for s in subjects if s.id == weakest_topic.subject_id), None)
            plan.append({
                "id": str(weakest_topic.topic_id),
                "label": f"Review {topic_name}",
                "subject": subj.name if subj else "",
                "tag": "Review"
            })
            
        plan.append({
            "id": "study-1",
            "label": "Read latest document",
            "subject": subjects[0].name,
            "tag": "Study"
        })
        
        # Next Revision and Estimated Time
        next_revision_str = "None"
        estimated_time = 30 # base time
        
        profiles_stmt = select(AILearningProfile).where(AILearningProfile.subject_id.in_(subject_ids), AILearningProfile.next_revision.is_not(None)).order_by(AILearningProfile.next_revision.asc())
        profiles_result = await db.execute(profiles_stmt)
        profiles = profiles_result.scalars().all()
        
        if profiles:
            next_date = profiles[0].next_revision.date()
            today = datetime.now(timezone.utc).date()
            if next_date <= today:
                next_revision_str = "Today"
            elif next_date == today + timedelta(days=1):
                next_revision_str = "Tomorrow"
            else:
                next_revision_str = next_date.strftime("%b %d")
                
            # Add estimated time based on weak topics / profiles
            estimated_time += len([p for p in profiles if p.mastery_score < 70]) * 15
        elif weakest_topic:
            next_revision_str = "Today"
            estimated_time += 15

        # Recent Activity (Quizzes)
        recent_quizzes_stmt = select(Quiz).where(Quiz.subject_id.in_(subject_ids)).order_by(desc(Quiz.created_at)).limit(3)
        recent_quizzes_result = await db.execute(recent_quizzes_stmt)
        recent_quizzes = recent_quizzes_result.scalars().all()
        
        recent_activity = []
        for q in recent_quizzes:
            subj = next((s for s in subjects if s.id == q.subject_id), None)
            recent_activity.append({
                "id": str(q.id),
                "title": f"Quiz: {q.title}",
                "context": subj.name if subj else "",
                "timestamp": q.created_at.isoformat(),
                "type": "quiz"
            })
            
        # Format subjects for frontend
        formatted_subjects = []
        for s in subjects:
            formatted_subjects.append({
                "id": str(s.id),
                "name": s.name,
                "color": s.color,
                "icon": s.icon,
                "stats": stats_map[s.id]
            })
            
        return {
            "study_streak": study_streak,
            "todayGoal": today_goal,
            "estimatedStudyTimeMins": estimated_time,
            "nextRevision": next_revision_str,
            "overallMastery": overall_mastery,
            "plan": plan,
            "recentActivity": recent_activity,
            "subjects": formatted_subjects
        }

dashboard_service = DashboardService()
