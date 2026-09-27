import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DBSession
from app.models.quiz import Quiz, QuizAttempt, QuizAnswer
from app.schemas.quiz import (
    QuizCreate, QuizResponse, QuizListResponse, 
    QuizAttemptStart, QuizAttemptResponse, QuizAttemptWithQuizResponse, QuizSubmit, QuizAttemptListResponse
)
from app.services.quiz_management_service import quiz_management_service

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# IMPORTANT: Static/specific routes MUST come before wildcard routes ({id}).
# FastAPI matches routes in registration order. If GET /{id} is registered
# first, it will intercept GET /attempts, GET /create, etc.
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/attempts", response_model=QuizAttemptListResponse)
async def list_quiz_attempts(
    current_user: CurrentUser,
    db: DBSession,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve user's past quiz attempts.
    """
    stmt = (
        select(QuizAttempt)
        .where(QuizAttempt.user_id == current_user.id)
        .options(
            selectinload(QuizAttempt.quiz),
            selectinload(QuizAttempt.answers).selectinload(QuizAnswer.question)
        )
        .order_by(QuizAttempt.started_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    attempts = result.scalars().all()

    count_stmt = select(QuizAttempt).where(QuizAttempt.user_id == current_user.id)
    count_result = await db.execute(count_stmt)
    total = len(count_result.scalars().all())

    return {"items": attempts, "total": total}


@router.get("/attempts/{id}", response_model=QuizAttemptWithQuizResponse)
async def get_quiz_attempt(
    id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """
    Get an active or completed quiz attempt.
    """
    stmt = (
        select(QuizAttempt)
        .options(
            selectinload(QuizAttempt.answers).selectinload(QuizAnswer.question),
            selectinload(QuizAttempt.quiz)
        )
        .where(QuizAttempt.id == id, QuizAttempt.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    return attempt


@router.post("/attempts/{id}/submit", response_model=QuizAttemptResponse)
async def submit_quiz_attempt(
    id: uuid.UUID,
    submit_in: QuizSubmit,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """
    Submit answers for grading.
    """
    try:
        attempt = await quiz_management_service.submit_attempt(
            db=db,
            attempt_id=id,
            user_id=current_user.id,
            answers_data=submit_in.answers
        )
        
        # Reload with relationships
        stmt = (
            select(QuizAttempt)
            .options(selectinload(QuizAttempt.answers).selectinload(QuizAnswer.question))
            .where(QuizAttempt.id == attempt.id)
        )
        result = await db.execute(stmt)
        return result.scalar_one()
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to grade submission: {str(e)}")


# ── Quiz Routes (STATIC — must be before /{id}) ───────────────────────────

@router.post("/create", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_in: QuizCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """
    Create a new quiz configuration template.
    """
    try:
        quiz = await quiz_management_service.create_quiz(
            db=db,
            user_id=current_user.id,
            subject_id=quiz_in.subject_id,
            title=quiz_in.title,
            total_questions=quiz_in.total_questions,
            document_id=quiz_in.document_id,
            config=quiz_in.config
        )
        return quiz
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=QuizListResponse)
async def list_quizzes(
    current_user: CurrentUser,
    db: DBSession,
    subject_id: Optional[uuid.UUID] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve user's quizzes.
    """
    stmt = select(Quiz).where(Quiz.user_id == current_user.id)
    if subject_id:
        stmt = stmt.where(Quiz.subject_id == subject_id)
        
    stmt = stmt.order_by(Quiz.created_at.desc()) \
        .offset(skip) \
        .limit(limit)
    result = await db.execute(stmt)
    quizzes = result.scalars().all()

    count_stmt = select(Quiz).where(Quiz.user_id == current_user.id)
    if subject_id:
        count_stmt = count_stmt.where(Quiz.subject_id == subject_id)
        
    count_result = await db.execute(count_stmt)
    total = len(count_result.scalars().all())

    return {"items": quizzes, "total": total}


# ── Wildcard Routes (must come LAST) ─────────────────────────────────────

@router.get("/{id}", response_model=QuizResponse)
async def get_quiz(
    id: uuid.UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """
    Get quiz details.
    """
    quiz = await db.get(Quiz, id)
    if not quiz or quiz.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.post("/{id}/attempts", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
async def start_quiz_attempt(
    id: uuid.UUID,
    attempt_in: QuizAttemptStart,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """
    Start a new attempt for a quiz. Assembles questions from the Question Bank.
    """
    try:
        attempt = await quiz_management_service.assemble_attempt(
            db=db,
            quiz_id=id,
            user_id=current_user.id,
            mode=attempt_in.mode
        )
        
        # Reload with relationships
        stmt = (
            select(QuizAttempt)
            .options(selectinload(QuizAttempt.answers).selectinload(QuizAnswer.question))
            .where(QuizAttempt.id == attempt.id)
        )
        result = await db.execute(stmt)
        return result.scalar_one()
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
