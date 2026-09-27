import logging
import json
import asyncio
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.models.document import Document, DocumentChunk
from app.models.topic import Topic
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

class ConceptExtractionService:
    """
    Responsible for reading document chunks and extracting subjects, chapters, topics, and keywords.
    Prevents duplicate topics and saves them. Never generates questions.
    Processes batches SEQUENTIALLY to avoid NVIDIA NIM 429 rate limits.
    """

    async def _process_batch(self, batch_text: str, index: int) -> List[Dict]:
        """Process a single batch sequentially (called one at a time)."""
        prompt = f"""You are an expert educational content analyzer.
Extract the core educational topics from the following text document chunks.

For each distinct concept/topic, provide:
- name: The specific topic name (e.g., "Memory Pagination")
- chapter: The broader chapter or section it belongs to (e.g., "Memory Management")
- subject: The overarching subject (e.g., "Operating Systems")
- keywords: A list of 3-5 keywords related to this topic.

Return ONLY a valid JSON array of objects. Do not wrap in markdown tags like ```json.
Example:
[
  {{"name": "Topic 1", "chapter": "Chapter 1", "subject": "Subject 1", "keywords": ["kw1", "kw2"]}}
]

Text to analyze:
{batch_text}
"""
        response = await llm_service.generate_response(prompt)
        
        # Clean markdown backticks if the model ignores the instruction
        response_clean = response.strip()
        if response_clean.startswith("```json"):
            response_clean = response_clean[7:]
        if response_clean.startswith("```"):
            response_clean = response_clean[3:]
        if response_clean.endswith("```"):
            response_clean = response_clean[:-3]
            
        return json.loads(response_clean.strip())

    async def extract_topics(self, db: AsyncSession, document: Document) -> List[Topic]:
        logger.info(f"Starting topic extraction for document {document.id}")
        
        # 1. Fetch chunks
        stmt = select(DocumentChunk).where(DocumentChunk.document_id == document.id).order_by(DocumentChunk.chunk_index)
        result = await db.execute(stmt)
        chunks = result.scalars().all()
        
        if not chunks:
            logger.warning(f"No chunks found for document {document.id}")
            return []
            
        # Batch chunks to avoid context window limits.
        # Use larger batches (15) so we have fewer LLM calls total.
        batch_size = 15
        batches = []
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            batch_text = "\n\n".join([c.content for c in batch])
            batches.append((batch_text, i))
            
        # Process SEQUENTIALLY — one at a time to avoid 429 rate limits
        extracted_data = []
        last_error = None
        for batch_text, idx in batches:
            logger.info(f"Extracting topics from chunk batch starting at index {idx}...")
            try:
                res = await self._process_batch(batch_text, idx)
                if isinstance(res, list):
                    extracted_data.extend(res)
                elif isinstance(res, dict):
                    for key, val in res.items():
                        if isinstance(val, list):
                            extracted_data.extend(val)
                            break
                    else:
                        extracted_data.append(res)
            except Exception as e:
                logger.warning(f"Batch {idx} failed, skipping: {e}")
                last_error = str(e) or type(e).__name__
                continue
                
        unique_topics_map = {}
        for t in extracted_data:
            if isinstance(t, dict) and "name" in t:
                name = t["name"].strip()
                if name and name not in unique_topics_map:
                    unique_topics_map[name] = t
                    
        if not unique_topics_map:
            # If we had a specific LLM error (like 429 Quota Exceeded) and got no topics, surface that error.
            if last_error:
                raise Exception(f"Failed to extract topics. Underlying error: {last_error}")
            raise Exception(f"No valid topics extracted from {len(chunks)} chunks.")
            
        # 3. Save to database using UPSERT (ON CONFLICT DO NOTHING) via bulk insert
        new_topics = []
        insert_data = []
        for name, data in unique_topics_map.items():
            insert_data.append({
                "document_id": document.id,
                "name": name,
                "subject": data.get("subject", ""),
                "chapter": data.get("chapter", ""),
                "keywords": data.get("keywords", [])
            })

        if insert_data:
            stmt = insert(Topic).values(insert_data).on_conflict_do_nothing(
                index_elements=['document_id', 'name']
            ).returning(Topic)
            
            result = await db.execute(stmt)
            new_topics = result.scalars().all()
                
        await db.commit()
        logger.info(f"Successfully extracted and saved {len(new_topics)} new topics for document {document.id}")
        
        # In case some were already in the DB from a previous partial run, we fetch all for this document
        all_stmt = select(Topic).where(Topic.document_id == document.id)
        all_result = await db.execute(all_stmt)
        all_topics = all_result.scalars().all()
        
        return list(all_topics)

concept_extraction_service = ConceptExtractionService()
