import asyncio
from app.db.session import AsyncSessionLocal
from app.models.document import Document
from sqlalchemy import select
from app.services.learning_pipeline_service import learning_pipeline_service

async def main():
    async with AsyncSessionLocal() as db:
        # Get the document
        stmt = select(Document).where(Document.title.ilike('%Input Output Organization%')).limit(1)
        doc = (await db.execute(stmt)).scalar_one_or_none()
        if not doc:
            print("Document not found.")
            return
        print(f"Testing document {doc.id}")
        await learning_pipeline_service._process_pipeline(db, doc)
        print(f"Final status: {doc.status}")

if __name__ == "__main__":
    asyncio.run(main())
