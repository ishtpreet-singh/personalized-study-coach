import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.services.quiz_management_service import quiz_management_service
from app.models.quiz import QuizAttempt

async def main():
    async with AsyncSessionLocal() as db:
        # Get any open attempt
        result = await db.execute(
            __import__('sqlalchemy').select(QuizAttempt).where(QuizAttempt.completed_at == None).limit(1)
        )
        attempt = result.scalar_one_or_none()
        if not attempt:
            print("No open attempt found")
            return
            
        print(f"Testing attempt: {attempt.id}")
        
        try:
            res = await quiz_management_service.submit_attempt(
                db=db,
                attempt_id=attempt.id,
                user_id=attempt.user_id,
                answers_data={}
            )
            print(f"Success: {res.score}")
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
