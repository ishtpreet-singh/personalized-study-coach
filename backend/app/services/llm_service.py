import logging
import asyncio
from fastapi import HTTPException, status
from langchain_openai import ChatOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        # We use ChatOpenAI pointing to NVIDIA's base URL because it flawlessly 
        # supports the new Llama 3.1 model streaming, whereas the old 
        # langchain-nvidia-ai-endpoints 0.1.6 crashes due to unknown model type.
        self.llm = ChatOpenAI(
            model=settings.NVIDIA_CHAT_MODEL,
            api_key=settings.NVIDIA_API_KEY,
            base_url=settings.NVIDIA_BASE_URL,
            temperature=0.3
        )
        
    async def generate_response(self, prompt: str) -> str:
        """
        Sends the final constructed prompt to the NVIDIA NIM Chat model.
        """
        logger.info(f"Sending prompt to NVIDIA NIM... Model: {settings.NVIDIA_CHAT_MODEL}, Base URL: {settings.NVIDIA_BASE_URL}")
        try:
            response = await self.llm.ainvoke(prompt)
            logger.info("Received response from NVIDIA NIM.")
            return response.content
        except asyncio.TimeoutError:
            logger.exception("Timeout while waiting for NVIDIA NIM response.")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI model timed out."
            )
        except Exception as e:
            logger.exception(f"Error calling NVIDIA NIM: {str(e)}")
            error_detail = str(e) if getattr(settings, "DEBUG", False) else "AI service is currently unavailable."
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=error_detail
            )

    async def generate_stream(self, prompt: str):
        """
        Stream the generated response incrementally from NVIDIA NIM.
        """
        logger.info(f"Streaming prompt to NVIDIA NIM... Model: {settings.NVIDIA_CHAT_MODEL}, Base URL: {settings.NVIDIA_BASE_URL}")
        try:
            async for chunk in self.llm.astream(prompt):
                yield chunk.content
            logger.info("Finished streaming response from NVIDIA NIM.")
        except asyncio.TimeoutError:
            logger.exception("Timeout while waiting for NVIDIA NIM response.")
            yield "Error: AI model timed out."
        except Exception as e:
            logger.exception(f"Error calling NVIDIA NIM: {str(e)}")
            error_detail = str(e) if getattr(settings, "DEBUG", False) else "AI service is currently unavailable."
            yield f"Error: {error_detail}"

llm_service = LLMService()
