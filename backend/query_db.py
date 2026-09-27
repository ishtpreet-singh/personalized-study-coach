import asyncio
from app.db.session import AsyncSessionLocal
from app.models.document import Document
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        stmt = select(Document).order_by(Document.created_at.desc()).limit(3)
        docs = (await db.execute(stmt)).scalars().all()
        for doc in docs:
            print(f"Title: {doc.title}")
            print(f"Status: {doc.status}")
            print(f"Stage: {doc.processing_stage}")
            print(f"Error: {doc.error_message}")
            print(f"Failed Stage: {doc.failed_stage}")
            print("---")

if __name__ == "__main__":
    asyncio.run(main())
