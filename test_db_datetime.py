import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def test():
    engine = create_async_engine(os.getenv("DATABASE_URL"))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Try to pass naive datetime to timezone-aware parameter
            await session.execute(
                text("SELECT * FROM quiz_attempts WHERE started_at > :d"),
                {"d": datetime.utcnow()}
            )
            print("Naive datetime query SUCCESS")
        except Exception as e:
            print("Naive datetime query FAILED:", type(e).__name__, str(e))
            
if __name__ == "__main__":
    asyncio.run(test())
