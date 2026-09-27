import logging
import json
import asyncio
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.document import Document, DocumentChunk
from app.models.topic import Topic
from app.models.quiz import Question, DifficultyLevel, QuestionType
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

class QuestionGenerationService:
    """
    Generates questions for all topics in a single LLM call.
    Uses the document's stored chunks directly to avoid extra ChromaDB calls.
    This minimises NVIDIA NIM API usage and avoids rate limit (429) errors.
    """

    async def generate_questions_for_topics(self, db: AsyncSession, document: Document, topics: List[Topic]) -> None:
        logger.info("Quiz generation request received")
        logger.info(f"Generating quiz for document {document.id}")

        # 1. Pull text directly from stored DB chunks — no extra LLM/ChromaDB call needed
        chunk_stmt = select(DocumentChunk).where(
            DocumentChunk.document_id == document.id
        ).order_by(DocumentChunk.chunk_index).limit(20)  # Use first 20 chunks for context
        result = await db.execute(chunk_stmt)
        chunks = result.scalars().all()

        # Truncate combined context to ~6000 chars to stay within token limits
        combined_text = "\n\n".join([c.content for c in chunks])
        if len(combined_text) > 6000:
            combined_text = combined_text[:6000] + "\n...[truncated]"

        logger.info(f"Document/chunks fetched — using {len(chunks)} chunks, {len(combined_text)} chars")

        # 2. Build a single prompt for ALL topics
        topic_names = [t.name for t in topics]
        topic_names_str = "\n".join(f"- {name}" for name in topic_names)

        logger.info("Context created for LLM")

        prompt = f"""You are an expert AI tutor and exam creator.
Generate a question bank from the study material below.

Topics to cover:
{topic_names_str}

Rules:
- Generate 2 questions per topic (1 MCQ and 1 TF).
- For MCQ: provide 4 answer options and mark the correct one.
- For TF: options must be ["True", "False"].
- Vary difficulty: EASY, MEDIUM, or HARD.
- Return ONLY a valid JSON array. No markdown, no extra text.

JSON format for each question:
{{
  "topic_name": "<exact topic name from the list>",
  "question_type": "MCQ" or "TF",
  "difficulty": "EASY" or "MEDIUM" or "HARD",
  "question_text": "<the question>",
  "options": ["<opt1>", "<opt2>", "<opt3>", "<opt4>"],
  "correct_answer": "<correct option text>",
  "explanation": "<brief explanation>"
}}

Study material:
{combined_text}
"""

        # 3. Single LLM call for everything
        logger.info("LLM generation started")
        response = await llm_service.generate_response(prompt)
        logger.info("LLM response received")

        # 4. Parse response
        response_clean = response.strip()
        for prefix in ["```json", "```"]:
            if response_clean.startswith(prefix):
                response_clean = response_clean[len(prefix):]
        if response_clean.endswith("```"):
            response_clean = response_clean[:-3]

        try:
            questions_data = json.loads(response_clean.strip())
            logger.info("JSON parsing completed")
            # Normalise to list
            if isinstance(questions_data, dict):
                for val in questions_data.values():
                    if isinstance(val, list):
                        questions_data = val
                        break
                else:
                    questions_data = [questions_data]
            elif not isinstance(questions_data, list):
                questions_data = []
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON from LLM: {e}\nResponse: {response_clean[:500]}")
            raise Exception(f"LLM returned invalid JSON: {e}")

        # 5. Map to Question objects
        topic_map = {t.name.lower(): t for t in topics}
        new_questions: List[Question] = []

        for q_data in questions_data:
            if not isinstance(q_data, dict):
                continue

            topic_name = q_data.get("topic_name", "").lower().strip()
            topic = topic_map.get(topic_name)

            # Fuzzy fallback
            if not topic:
                for t_name, t_obj in topic_map.items():
                    if t_name in topic_name or topic_name in t_name:
                        topic = t_obj
                        break

            # Ultimate fallback
            if not topic and topics:
                topic = topics[0]

            if not topic:
                continue

            try:
                q_type = QuestionType(q_data.get("question_type", "MCQ").upper())
                diff = DifficultyLevel(q_data.get("difficulty", "MEDIUM").upper())
            except ValueError:
                continue

            q = Question(
                document_id=document.id,
                topic_id=topic.id,
                difficulty=diff,
                question_type=q_type,
                question_text=q_data.get("question_text", ""),
                options=q_data.get("options", None),
                correct_answer=str(q_data.get("correct_answer", "")),
                explanation=q_data.get("explanation", "")
            )
            new_questions.append(q)

        logger.info(f"Parsed {len(new_questions)} questions from LLM response")

        if not new_questions:
            raise Exception("LLM returned no valid questions. Check the LLM response format.")

        db.add_all(new_questions)
        await db.commit()
        logger.info("Quiz stored")
        logger.info(f"Completed question generation. Generated {len(new_questions)} questions for document {document.id}")


question_generation_service = QuestionGenerationService()
