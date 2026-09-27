import logging
import json
from typing import Dict, Any

from app.models.quiz import Question, QuestionType
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

class AssessmentEvaluationService:
    """
    Grades user answers.
    Direct comparison for objective types (MCQ, TF, FIB).
    Semantic LLM evaluation for Short Answer (SA).
    """
    
    async def evaluate_answer(self, question: Question, user_answer: str) -> Dict[str, Any]:
        """
        Returns a dict with 'is_correct' (bool) and 'marks' (float 0.0 - 1.0)
        """
        user_ans = str(user_answer).strip().lower()
        correct_ans = str(question.correct_answer).strip().lower()
        
        if question.question_type in (QuestionType.MCQ, QuestionType.TF):
            is_correct = (user_ans == correct_ans)
            return {
                "is_correct": is_correct,
                "marks": 1.0 if is_correct else 0.0,
                "feedback": ""
            }
            
        elif question.question_type == QuestionType.FIB:
            # Simple string matching, could be improved with basic synonyms
            is_correct = (user_ans == correct_ans)
            return {
                "is_correct": is_correct,
                "marks": 1.0 if is_correct else 0.0,
                "feedback": ""
            }
            
        elif question.question_type == QuestionType.SA:
            return await self._evaluate_semantic_answer(question, user_answer)
            
        return {"is_correct": False, "marks": 0.0, "feedback": ""}

    async def _evaluate_semantic_answer(self, question: Question, user_answer: str) -> Dict[str, Any]:
        """
        Use Llama 3.1 to semantically evaluate the short answer.
        """
        prompt = f"""
You are an expert AI grader evaluating a student's Short Answer.

Question: "{question.question_text}"
Ideal Answer: "{question.correct_answer}"
Student's Answer: "{user_answer}"

Evaluate if the student's answer correctly captures the core concepts of the ideal answer.
Assign a score from 0.0 (completely wrong) to 1.0 (perfect). Partial credit (e.g., 0.5) is allowed.

Return ONLY a valid JSON object. Do not wrap in markdown tags like ```json.
Format:
{{
  "is_correct": true/false (true if score >= 0.5),
  "marks": <float between 0.0 and 1.0>,
  "feedback": "<brief explanation of why this grade was given>"
}}
"""
        try:
            response = await llm_service.generate_response(prompt)
            
            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean[7:]
            if response_clean.startswith("```"):
                response_clean = response_clean[3:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]
                
            grade_data = json.loads(response_clean.strip())
            
            # fallback defaults
            is_correct = bool(grade_data.get("is_correct", False))
            marks = float(grade_data.get("marks", 0.0))
            feedback = grade_data.get("feedback", "")
            
            return {
                "is_correct": is_correct,
                "marks": marks,
                "feedback": feedback
            }
        except Exception as e:
            logger.error(f"Semantic grading failed: {str(e)}")
            # Fallback to basic string comparison if AI fails
            user_ans = str(user_answer).strip().lower()
            correct_ans = str(question.correct_answer).strip().lower()
            is_correct = (user_ans == correct_ans)
            return {
                "is_correct": is_correct,
                "marks": 1.0 if is_correct else 0.0,
                "feedback": "AI grading failed. Fallback string match used."
            }

assessment_evaluation_service = AssessmentEvaluationService()
