import logging
import asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """
    Unified LLM service supporting NVIDIA NIM and Google Gemini.
    Provider is selected via LLM_PROVIDER env var ("nvidia" or "gemini").
    """

    def __init__(self):
        self.llm = None
        provider = (settings.LLM_PROVIDER or "nvidia").lower()
        logger.info(f"Initializing LLM service with provider: {provider}")

        if provider == "gemini":
            self._init_gemini()
        else:
            self._init_nvidia()

    def _init_gemini(self):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            self.llm = ChatGoogleGenerativeAI(
                model=settings.GEMINI_CHAT_MODEL,
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.3,
                convert_system_message_to_human=True,
            )
            logger.info(f"Google Gemini initialized — model: {settings.GEMINI_CHAT_MODEL}")
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini: {e}. LLM calls will fail.")
            self.llm = None

    def _init_nvidia(self):
        try:
            from langchain_openai import ChatOpenAI
            self.llm = ChatOpenAI(
                model=settings.NVIDIA_CHAT_MODEL,
                api_key=settings.NVIDIA_API_KEY,
                base_url=settings.NVIDIA_BASE_URL,
                temperature=0.3,
            )
            logger.info(f"NVIDIA NIM initialized — model: {settings.NVIDIA_CHAT_MODEL}")
        except Exception as e:
            logger.warning(f"Failed to initialize NVIDIA NIM: {e}. LLM calls will fail.")
            self.llm = None

    async def generate_response(self, prompt: str) -> str:
        """
        Send a prompt to the configured LLM provider.
        Timeout of 60s. No automatic retry — caller handles errors.
        """
        if not self.llm:
            raise RuntimeError("LLM is not initialized. Check your API key and LLM_PROVIDER config.")

        provider = (settings.LLM_PROVIDER or "nvidia").lower()
        logger.info(f"Sending prompt to {provider} LLM ({len(prompt)} chars)...")

        try:
            response = await asyncio.wait_for(
                self.llm.ainvoke(prompt),
                timeout=60.0
            )
            logger.info("Received LLM response.")
            return response.content
        except asyncio.TimeoutError:
            msg = f"LLM request timed out after 60 seconds (provider: {provider}, model: {settings.GEMINI_CHAT_MODEL if provider == 'gemini' else settings.NVIDIA_CHAT_MODEL})"
            logger.error(msg)
            raise RuntimeError(msg)
        except Exception as e:
            # Make sure we always have a non-empty message
            err_msg = str(e) or f"LLM request failed with {type(e).__name__} (provider: {provider})"
            logger.error(f"LLM request failed: {err_msg}")
            raise RuntimeError(err_msg) from e

    async def generate_stream(self, prompt: str):
        """
        Stream the generated response incrementally from the configured LLM.
        """
        if not self.llm:
            yield "Error: LLM is not initialized."
            return

        provider = (settings.LLM_PROVIDER or "nvidia").lower()
        logger.info(f"Streaming prompt to {provider} LLM...")
        try:
            async for chunk in self.llm.astream(prompt):
                yield chunk.content
            logger.info("Finished streaming LLM response.")
        except Exception as e:
            logger.error(f"LLM stream error: {e}")
            yield f"Error: AI service is currently unavailable. ({e})"


llm_service = LLMService()
