#!/usr/bin/env python3
"""
Re-indexing Utility: ChromaDB / PostgreSQL Chunks -> pgvector (document_chunk_vectors)

Usage:
  python reindex_to_pgvector.py [--dry-run] [--force] [--document-id UUID] [--subject-id UUID]

This script is idempotent and safe:
  - Scans documents in COMPLETED or TUTOR_READY status with chunks
  - Re-generates 3072-dimensional Gemini embeddings if not already present
  - Inserts DocumentChunkVector records with strict foreign keys
  - Preserves existing ChromaDB and PostgreSQL data
"""

import argparse
import asyncio
import logging
import sys
import uuid
import time
from typing import Optional

from sqlalchemy import select, delete, func

from app.db.session import AsyncSessionLocal
from app.models.document import Document, DocumentChunk, DocumentStatus
from app.models.document_vector import DocumentChunkVector
from app.services.document_service import document_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("reindexer")


async def reindex(
    dry_run: bool = False,
    force: bool = False,
    document_id: Optional[uuid.UUID] = None,
    subject_id: Optional[uuid.UUID] = None,
):
    logger.info(f"Starting pgvector re-indexing (dry_run={dry_run}, force={force})...")

    if not document_service.embeddings:
        logger.error("Gemini embeddings client is not configured. Check GEMINI_API_KEY and GEMINI_EMBEDDING_MODEL.")
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        # Build query for eligible documents
        stmt = select(Document).where(
            Document.status.in_([DocumentStatus.COMPLETED, DocumentStatus.TUTOR_READY])
        )
        if document_id:
            stmt = stmt.where(Document.id == document_id)
        if subject_id:
            stmt = stmt.where(Document.subject_id == subject_id)

        result = await session.execute(stmt)
        documents = result.scalars().all()

        logger.info(f"Found {len(documents)} eligible document(s).")

        total_vectors_created = 0
        total_documents_processed = 0

        for doc in documents:
            logger.info(f"--- Document: {doc.title} (ID: {doc.id}, Subject: {doc.subject_id}) ---")

            # Check existing vectors count
            vec_count_stmt = select(func.count(DocumentChunkVector.id)).where(
                DocumentChunkVector.document_id == doc.id
            )
            existing_vectors = (await session.execute(vec_count_stmt)).scalar() or 0

            # Check chunk count
            chunk_stmt = (
                select(DocumentChunk)
                .where(DocumentChunk.document_id == doc.id)
                .order_by(DocumentChunk.chunk_index)
            )
            chunks = (await session.execute(chunk_stmt)).scalars().all()

            if not chunks:
                logger.warning(f"  No chunks found for document {doc.id}. Skipping.")
                continue

            if existing_vectors > 0 and not force:
                logger.info(f"  Document already has {existing_vectors} vectors indexed. Skipping (use --force to re-embed).")
                continue

            if existing_vectors > 0 and force:
                if not dry_run:
                    await session.execute(
                        delete(DocumentChunkVector).where(DocumentChunkVector.document_id == doc.id)
                    )
                    await session.commit()
                logger.info(f"  Cleared {existing_vectors} existing vectors for re-indexing (--force).")

            logger.info(f"  Processing {len(chunks)} chunk(s)...")

            if dry_run:
                logger.info(f"  [DRY RUN] Would generate Gemini embeddings for {len(chunks)} chunks.")
                total_vectors_created += len(chunks)
                total_documents_processed += 1
                continue

            # Batch embed chunks with Gemini
            texts = [c.content for c in chunks]
            t0 = time.perf_counter()

            try:
                if hasattr(document_service.embeddings, "aembed_documents"):
                    vectors = await document_service.embeddings.aembed_documents(texts)
                else:
                    from fastapi.concurrency import run_in_threadpool
                    vectors = await run_in_threadpool(document_service.embeddings.embed_documents, texts)
            except Exception as e:
                logger.error(f"  Embedding generation failed for document {doc.id}: {e}")
                continue

            embed_time = time.perf_counter() - t0
            logger.info(f"  Generated {len(vectors)} embeddings in {embed_time:.2f}s.")

            # Insert into document_chunk_vectors
            for idx, chunk in enumerate(chunks):
                vec_record = DocumentChunkVector(
                    chunk_id=chunk.id,
                    document_id=doc.id,
                    subject_id=doc.subject_id,
                    user_id=doc.user_id,
                    embedding=vectors[idx]
                )
                session.add(vec_record)

            await session.commit()
            logger.info(f"  Saved {len(vectors)} vector records to document_chunk_vectors.")
            total_vectors_created += len(vectors)
            total_documents_processed += 1

        logger.info(f"=== Re-indexing Complete: {total_documents_processed} document(s), {total_vectors_created} vector(s) ===")


def main():
    parser = argparse.ArgumentParser(description="Re-index documents to pgvector")
    parser.add_argument("--dry-run", action="store_true", help="Inspect without modifying database")
    parser.add_argument("--force", action="store_true", help="Re-embed even if vectors already exist")
    parser.add_argument("--document-id", type=uuid.UUID, help="Specific document UUID to re-index")
    parser.add_argument("--subject-id", type=uuid.UUID, help="Specific subject UUID to re-index")
    args = parser.parse_args()

    asyncio.run(reindex(
        dry_run=args.dry_run,
        force=args.force,
        document_id=args.document_id,
        subject_id=args.subject_id
    ))


if __name__ == "__main__":
    main()
