import logging
import uuid
import traceback
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.document import Document, DocumentStatus, DocumentChunk
from app.models.topic import Topic
from app.services.document_service import document_service

logger = logging.getLogger(__name__)


class LearningPipelineService:
    """
    Orchestrates the entire learning content pipeline.
    Single responsibility: Workflow coordination and state management.
    """

    async def _process_pipeline(self, db: AsyncSession, document: Document) -> None:
        import time
        t_pipeline_start = time.perf_counter()
        timings = {}
        
        doc_id = document.id
        try:
            # ──────────────────────────────────────────────────────────────
            # Stage 1: Text extraction → Chunking → Embeddings → ChromaDB
            # Pure deterministic processing. No LLM required.
            # ──────────────────────────────────────────────────────────────
            chunk_stmt = select(DocumentChunk).where(DocumentChunk.document_id == doc_id).limit(1)
            chunk_result = await db.execute(chunk_stmt)
            has_chunks = chunk_result.scalar_one_or_none() is not None

            if not has_chunks:
                logger.info(f"[DOC PERF] Pipeline Stage 1/2: Processing Document {doc_id}")
                doc_timings = await document_service.process_document(db, document)
                timings.update(doc_timings)
                await db.refresh(document)
                if document.status == DocumentStatus.FAILED:
                    raise Exception(document.error_message or "Document processing failed")

            # ──────────────────────────────────────────────────────────────
            # Stage 2: Topic Extraction (LLM call — 1 call, ~2-5s)
            # Extracts topic names for the UI and quiz targeting.
            # NOTE: If this LLM call times out or fails, the document is
            #       still usable by the AI Tutor (ChromaDB embeddings done).
            # ──────────────────────────────────────────────────────────────
            topic_stmt = select(Topic).where(Topic.document_id == doc_id)
            topic_result = await db.execute(topic_stmt)
            topics = topic_result.scalars().all()

            if not topics:
                document.processing_stage = "Topic Extraction"
                await db.commit()
                logger.info(f"[DOC PERF] Pipeline Stage 2/2: Extracting Topics for Document {doc_id}")
                
                t_topic_start = time.perf_counter()
                from app.services.concept_extraction_service import concept_extraction_service
                topics = await concept_extraction_service.extract_topics(db, document)
                timings["topic_extraction"] = time.perf_counter() - t_topic_start
                
                if not topics or len(topics) == 0:
                    raise Exception("No topics were extracted from the document.")

            # ──────────────────────────────────────────────────────────────
            # NOTE: Question generation is NOT part of ingestion.
            # Questions are generated on-demand when the student clicks
            # "Generate Quiz" on the subject quiz page.
            # This avoids a 60s+ LLM timeout during document upload.
            # ──────────────────────────────────────────────────────────────

            # Finalize — document is COMPLETED once embeddings + topics are done
            t_total = time.perf_counter() - t_pipeline_start
            timings["total_pipeline"] = t_total
            
            document.status = DocumentStatus.COMPLETED
            document.processing_stage = "Completed"
            document.quiz_ready = 1  # Topics extracted — quiz can be generated on demand
            document.failed_stage = None
            document.error_message = None
            await db.commit()
            
            # Print timing report
            report = f"\n{'-'*50}\n"
            report += f" PIPELINE TIMING REPORT for Doc {str(doc_id)[:8]}...\n"
            report += f"{'-'*50}\n"
            report += f" [DOC PERF] File Extraction .. {timings.get('pdf_parsing', 0)*1000:7.1f} ms\n"
            report += f" [DOC PERF] Chunking ......... {timings.get('chunking', 0)*1000:7.1f} ms\n"
            report += f" [DOC PERF] Embeddings ....... {timings.get('embeddings', 0):7.2f} s\n"
            report += f" [DOC PERF] Topic Extraction . {timings.get('topic_extraction', 0):7.2f} s\n"
            report += f" [DOC PERF] Question Gen ..... DEFERRED (on-demand)\n"
            report += f"{'-'*50}\n"
            report += f" [DOC PERF] TOTAL ............ {timings.get('total_pipeline', 0):7.2f} s\n"
            report += f"{'-'*50}\n"
            
            logger.info(report)
            print(report)

        except Exception as e:
            # Build a safe, non-empty error message for the UI
            error_detail = str(e).strip()
            if not error_detail:
                error_detail = f"Unexpected {type(e).__name__} during pipeline execution. Check backend logs."
            full_error = f"Learning Pipeline Error: {error_detail}"

            logger.error(f"Pipeline failed for document {doc_id}: {full_error}\n{traceback.format_exc()}")
            await db.rollback()
            try:
                document = await db.get(Document, doc_id)
                if document:
                    document.status = DocumentStatus.FAILED
                    document.error_message = full_error
                    document.failed_stage = document.processing_stage or "Unknown"
                    document.failed_at = datetime.now(timezone.utc)
                    document.retry_count = (document.retry_count or 0) + 1
                    await db.commit()
            except Exception as inner_e:
                logger.error(f"Could not update document status to FAILED: {str(inner_e)}")

    async def process_document_background(self, document_id: uuid.UUID) -> None:
        """
        Background entry point for the pipeline.
        Provides a fresh database session for the async task.
        """
        async with AsyncSessionLocal() as session:
            document = await session.get(Document, document_id)
            if not document:
                logger.error(f"Pipeline aborted: Document {document_id} not found in DB.")
                return
            
            await self._process_pipeline(session, document)

learning_pipeline_service = LearningPipelineService()
