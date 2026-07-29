import asyncio
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from app.core.config import settings

async def main():
    llm = ChatNVIDIA(
        model="meta/llama-3.1-70b-instruct", 
        api_key=settings.NVIDIA_API_KEY,
        temperature=0.3
    )
    try:
        response = await llm.ainvoke("Hello")
        print("Response:", response)
    except Exception as e:
        print("Exception:", e)

asyncio.run(main())
