import asyncio
import json
from app.db.session import AsyncSessionLocal
from app.models.learning_profile import AILearningProfile
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AILearningProfile.mastery_score, AILearningProfile.subject_id))
        profiles = result.all()
        print(json.dumps([{"score": float(p[0]), "subject": str(p[1])} for p in profiles]))

if __name__ == "__main__":
    asyncio.run(main())
