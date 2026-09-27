import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

from app.models.quiz import QuizMode, DifficultyLevel, QuestionType

class QuizCreate(BaseModel):
    title: str = Field(..., max_length=255)
    total_questions: int = Field(..., ge=1, le=100)
    subject_id: uuid.UUID
    document_id: Optional[uuid.UUID] = None
    config: Optional[Dict[str, Any]] = None

class QuizResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    subject_id: uuid.UUID
    document_id: Optional[uuid.UUID]
    title: str
    total_questions: int
    config: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuizListResponse(BaseModel):
    items: List[QuizResponse]
    total: int

class QuizAttemptStart(BaseModel):
    mode: QuizMode = QuizMode.PRACTICE

class QuizQuestionResponse(BaseModel):
    id: uuid.UUID
    question_type: QuestionType
    difficulty: DifficultyLevel
    question_text: str
    options: Optional[Any]
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    
    class Config:
        from_attributes = True

class QuizAnswerResponse(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    user_answer: Optional[str]
    is_correct: Optional[bool]
    awarded_marks: Optional[float]
    question: QuizQuestionResponse
    
    class Config:
        from_attributes = True

class QuizAttemptResponse(BaseModel):
    id: uuid.UUID
    quiz_id: uuid.UUID
    user_id: uuid.UUID
    mode: QuizMode
    score: Optional[int]
    accuracy: Optional[float]
    time_taken: Optional[int]
    started_at: datetime
    completed_at: Optional[datetime]
    answers: List[QuizAnswerResponse] = []
    class Config:
        from_attributes = True

class QuizAttemptWithQuizResponse(QuizAttemptResponse):
    quiz: Optional[QuizResponse] = None

class QuizSubmit(BaseModel):
    # Mapping of QuizAnswer ID (UUID string) to user's text answer
    answers: Dict[str, str]

class QuizAttemptListResponse(BaseModel):
    items: List[QuizAttemptWithQuizResponse]
    total: int
