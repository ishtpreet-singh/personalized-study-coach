import asyncio
import time
import sys
import logging
import uuid
import os
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.document import Document, DocumentStatus, DocumentChunk
from app.models.topic import Topic
from app.models.quiz import Question
from app.models.user import User

logging.basicConfig(level=logging.INFO)

async def run_profile():
    async with AsyncSessionLocal() as db:
        # Get a user
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            print("No users found.")
            return

        # Create a test document
        test_file_path = "/tmp/test_profile.txt"
        with open(test_file_path, "w") as f:
            for i in range(100):
                f.write(f"Chapter {i+1}\nThis is a sample text for topic {i+1}. It covers important concepts like memory management and CPU scheduling in Operating Systems. A process is an instance of a program in execution.\n\n")
        
        doc = Document(
            user_id=user.id,
            title="Profile Test Document",
            file_type="text/plain",
            file_path=test_file_path,
            file_size=os.path.getsize(test_file_path),
            status=DocumentStatus.PROCESSING
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        print(f"Created document {doc.id}")

        start_total = time.time()

        # Step 1: Document Processing (Parsing, Chunking, Embedding)
        from app.services.document_service import document_service
        t0 = time.time()
        await document_service.process_document(db, doc)
        t1 = time.time()
        print(f"[PROFILE] Document Processing (Parsing, Chunking, Embedding) took: {t1 - t0:.2f} seconds")

        # Reload chunks to see how many were created
        res = await db.execute(select(DocumentChunk).where(DocumentChunk.document_id == doc.id))
        chunks = res.scalars().all()
        print(f"[PROFILE] Created {len(chunks)} chunks.")

        # Step 2: Topic Extraction
        from app.services.concept_extraction_service import concept_extraction_service
        doc.status = DocumentStatus.EXTRACTING_TOPICS
        await db.commit()
        t2 = time.time()
        topics = await concept_extraction_service.extract_topics(db, doc)
        t3 = time.time()
        print(f"[PROFILE] Topic Extraction took: {t3 - t2:.2f} seconds")
        print(f"[PROFILE] Extracted {len(topics)} topics.")

        # Step 3: Question Generation
        from app.services.question_generation_service import question_generation_service
        doc.status = DocumentStatus.GENERATING_QUESTIONS
        await db.commit()
        t4 = time.time()
        await question_generation_service.generate_questions_for_topics(db, doc, topics)
        t5 = time.time()
        print(f"[PROFILE] Question Generation took: {t5 - t4:.2f} seconds")

        # Count questions
        res = await db.execute(select(Question).where(Question.document_id == doc.id))
        questions = res.scalars().all()
        print(f"[PROFILE] Generated {len(questions)} questions.")

        end_total = time.time()
        print(f"[PROFILE] TOTAL PIPELINE TIME: {end_total - start_total:.2f} seconds")

        # Cleanup
        await db.delete(doc)
        await db.commit()
        os.remove(test_file_path)

if __name__ == "__main__":
    asyncio.run(run_profile())
