import logging
from typing import List

logger = logging.getLogger(__name__)

class PromptBuilder:
    @staticmethod
    def build_rag_prompt(question: str, chunks: List[str]) -> str:
        """
        Builds a structured prompt for the AI Tutor based on RAG context.
        """
        logger.info("Building prompt...")
        
        if not chunks:
            prompt = (
                "System: You are an AI Tutor designed to help students learn effectively. "
                "However, no relevant context was found in the user's uploaded documents to answer the current question.\n"
                "Please inform the user that you don't have the context in their files, but you can still try to help using your general knowledge.\n\n"
                f"User Question: {question}\n\n"
                "Answer:"
            )
        else:
            context = "\n\n".join(chunks)
            prompt = (
                "System: You are a helpful AI Tutor. Use the provided context from the user's study materials to answer their question. "
                "If the answer is not contained in the context, say so, but provide the best answer you can.\n\n"
                f"Context from study materials:\n{context}\n\n"
                f"User Question: {question}\n\n"
                "Answer:"
            )
            
        logger.info("Prompt built successfully.")
        return prompt

prompt_builder = PromptBuilder()
