import asyncio
from app.services.llm_service import llm_service

async def main():
    try:
        response = await llm_service.generate_response("Hello")
        print("Response:", response)
    except Exception as e:
        print("Exception:", e)

asyncio.run(main())
