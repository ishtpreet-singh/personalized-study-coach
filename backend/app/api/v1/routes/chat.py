from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import logging
from app.api.deps import CurrentUser
from app.schemas.chat import ChatRequest, ChatResponse, Source
from app.services.document_service import document_service
from app.services.prompt_builder import prompt_builder
from app.services.llm_service import llm_service
from app.services.conversation_service import conversation_service
import json

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("", response_model=ChatResponse | None, status_code=status.HTTP_200_OK)
async def chat(
    request: ChatRequest,
    current_user: CurrentUser,
):
    """
    Dummy chat endpoint for Phase 3.4.
    Generates an embedding, retrieves context, and builds a prompt.
    """
    try:
        logger.info("Generating query embedding...")
        
        # We might need to run embed_query in a threadpool if it's synchronous, 
        # but langchain NVIDIAEmbeddings provides aembed_query which is async.
        # However, fallback to standard embed_query if not natively awaited.
        if hasattr(document_service.embeddings, "aembed_query"):
            embedding = await document_service.embeddings.aembed_query(request.question)
        else:
            from fastapi.concurrency import run_in_threadpool
            embedding = await run_in_threadpool(document_service.embeddings.embed_query, request.question)
            
        logger.info("Query embedding generated successfully.")
        
        # Phase 3.3: Search ChromaDB using the generated embedding
        logger.info("Searching ChromaDB...")
        chunks = await document_service.search_by_vector(embedding, k=5)
        logger.info(f"Retrieved {len(chunks)} chunks.")
        
        # Phase 3.4: Build the prompt
        chunk_texts = [chunk.page_content for chunk in chunks]
        prompt = prompt_builder.build_rag_prompt(request.question, chunk_texts)
        
        # Extract and deduplicate sources
        sources = []
        seen = set()
        for chunk in chunks:
            # ChromaDB metadata might use 'filename' or 'source' depending on the loader
            filename = chunk.metadata.get("filename") or chunk.metadata.get("source") or "Unknown"
            # Ensure we only get the filename, not the full path
            if "/" in filename:
                filename = filename.split("/")[-1]
            page = chunk.metadata.get("page")
            
            source_key = (filename, page)
            if source_key not in seen:
                seen.add(source_key)
                sources.append(Source(filename=filename, page=page))

        # Phase 3.9: Conversation logic
        if request.conversation_id:
            conversation = await conversation_service.get_conversation(request.conversation_id, current_user.id)
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            conversation = await conversation_service.create_conversation(current_user.id)
            await conversation_service.auto_title_conversation(conversation.id, current_user.id, request.question)
        
        # Append user message
        await conversation_service.append_message(conversation.id, "user", request.question)

        # Phase 3.5: Generate answer using NVIDIA NIM
        if request.stream:
            headers = {
                "X-Sources": json.dumps([s.dict() for s in sources]),
                "X-Conversation-Id": str(conversation.id),
                "Access-Control-Expose-Headers": "X-Sources, X-Conversation-Id"
            }
            
            async def generate_and_save():
                full_text = ""
                async for chunk in llm_service.generate_stream(prompt):
                    full_text += chunk
                    yield chunk
                await conversation_service.append_message(conversation.id, "assistant", full_text)

            return StreamingResponse(
                generate_and_save(),
                media_type="text/event-stream",
                headers=headers
            )
        else:
            answer = await llm_service.generate_response(prompt)
            await conversation_service.append_message(conversation.id, "assistant", answer)
            return ChatResponse(conversation_id=conversation.id, answer=answer, sources=sources)
        
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request."
        )
