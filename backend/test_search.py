import asyncio
import uuid
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.document_service import document_service

async def main():
    print("Testing search...")
    # Just grab any document from DB to test
    from app.db.session import AsyncSessionLocal
    from app.models.document import Document
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as db:
        stmt = select(Document).order_by(Document.created_at.desc()).limit(1)
        doc = (await db.execute(stmt)).scalar_one_or_none()
        if not doc:
            print("No documents found in DB.")
            return
            
        print(f"Testing with doc: {doc.title} (ID: {doc.id}, Subject: {doc.subject_id})")
        
        # Test text search
        try:
            results = await document_service.search_by_text("input output", document_id=doc.id)
            print(f"Search by text found {len(results)} chunks.")
            if results:
                print(f"Sample chunk: {results[0].page_content[:100]}")
        except Exception as e:
            print(f"Search by text failed: {e}")
            
        # Test vector search
        try:
            embedding = await document_service.embeddings.aembed_query("input output")
            results2 = await document_service.search_by_vector(embedding, subject_id=doc.subject_id)
            print(f"Search by vector found {len(results2)} chunks.")
        except Exception as e:
            print(f"Search by vector failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
