from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import CurrentUser
from app.schemas.conversation import ConversationResponse, ConversationSummary, ConversationUpdate
from app.services.conversation_service import conversation_service

router = APIRouter()

@router.get("/", response_model=List[ConversationSummary])
async def list_conversations(current_user: CurrentUser):
    return await conversation_service.get_user_conversations(current_user.id)

@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: UUID, current_user: CurrentUser):
    conversation = await conversation_service.get_conversation(conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation

@router.post("/", response_model=ConversationSummary)
async def create_conversation(current_user: CurrentUser):
    return await conversation_service.create_conversation(current_user.id)

@router.patch("/{conversation_id}", response_model=ConversationSummary)
async def update_conversation(conversation_id: UUID, update_data: ConversationUpdate, current_user: CurrentUser):
    conversation = await conversation_service.update_conversation(conversation_id, current_user.id, update_data)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(conversation_id: UUID, current_user: CurrentUser):
    success = await conversation_service.delete_conversation(conversation_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return None
