import re
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal
from app.models.conversation import Conversation, Message
from app.schemas.conversation import ConversationUpdate

class ConversationService:
    async def get_user_conversations(self, user_id: UUID, subject_id: Optional[UUID] = None) -> List[Conversation]:
        async with AsyncSessionLocal() as session:
            stmt = select(Conversation).where(Conversation.user_id == user_id)
            if subject_id:
                stmt = stmt.where(Conversation.subject_id == subject_id)
            stmt = stmt.order_by(Conversation.created_at.desc())
            result = await session.execute(stmt)
            return result.scalars().all()

    async def get_conversation(self, conversation_id: UUID, user_id: UUID) -> Optional[Conversation]:
        async with AsyncSessionLocal() as session:
            stmt = select(Conversation).options(selectinload(Conversation.messages)).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            result = await session.execute(stmt)
            return result.scalars().first()

    async def create_conversation(self, user_id: UUID, subject_id: UUID, title: str = "New Chat") -> Conversation:
        async with AsyncSessionLocal() as session:
            conversation = Conversation(user_id=user_id, subject_id=subject_id, title=title)
            session.add(conversation)
            await session.commit()
            await session.refresh(conversation)
            return conversation

    async def update_conversation(self, conversation_id: UUID, user_id: UUID, update_data: ConversationUpdate) -> Optional[Conversation]:
        async with AsyncSessionLocal() as session:
            stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
            result = await session.execute(stmt)
            conversation = result.scalars().first()
            if not conversation:
                return None
            
            conversation.title = update_data.title
            await session.commit()
            await session.refresh(conversation)
            return conversation

    async def delete_conversation(self, conversation_id: UUID, user_id: UUID) -> bool:
        async with AsyncSessionLocal() as session:
            stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
            result = await session.execute(stmt)
            conversation = result.scalars().first()
            if not conversation:
                return False
            
            await session.delete(conversation)
            await session.commit()
            return True

    async def append_message(self, conversation_id: UUID, role: str, content: str) -> Message:
        async with AsyncSessionLocal() as session:
            message = Message(conversation_id=conversation_id, role=role, content=content)
            session.add(message)
            await session.commit()
            await session.refresh(message)
            return message

    async def auto_title_conversation(self, conversation_id: UUID, user_id: UUID, first_message: str):
        async with AsyncSessionLocal() as session:
            stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
            result = await session.execute(stmt)
            conversation = result.scalars().first()
            
            if not conversation or conversation.title != "New Chat":
                return
            
            # Simple heuristic: first 4-6 words, no punctuation, max 40 chars
            clean_msg = re.sub(r'[^\w\s]', '', first_message)
            words = clean_msg.split()
            title = " ".join(words[:5])
            title = title[:40].strip()
            
            if not title:
                title = "New Chat"
                
            conversation.title = title
            await session.commit()

conversation_service = ConversationService()
