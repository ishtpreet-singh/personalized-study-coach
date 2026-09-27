import asyncio
import logging
from sqlalchemy import select, update
import chromadb

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.subject import Subject
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.conversation import Conversation
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate_data():
    logger.info("Starting V2 Data Migration...")
    
    async with AsyncSessionLocal() as session:
        # 1. Fetch all users
        result = await session.execute(select(User))
        users = result.scalars().all()
        logger.info(f"Found {len(users)} users.")
        
        doc_to_subject_map = {}
        
        for user in users:
            # Check if General Studies already exists for this user
            stmt = select(Subject).where(Subject.user_id == user.id, Subject.name == "General Studies")
            result = await session.execute(stmt)
            default_subject = result.scalar_one_or_none()
            
            if not default_subject:
                default_subject = Subject(
                    user_id=user.id,
                    name="General Studies",
                    color="#4F46E5",
                    icon="📚"
                )
                session.add(default_subject)
                await session.flush()
                logger.info(f"Created General Studies subject for user {user.email}")
            
            subject_id = default_subject.id
            
            # Update Documents
            stmt = select(Document).where(Document.user_id == user.id, Document.subject_id.is_(None))
            docs = (await session.execute(stmt)).scalars().all()
            for doc in docs:
                doc.subject_id = subject_id
                doc_to_subject_map[str(doc.id)] = str(subject_id)
            if docs:
                logger.info(f"Updated {len(docs)} documents for user {user.email}")
                
            # Update Quizzes
            stmt = select(Quiz).where(Quiz.user_id == user.id, Quiz.subject_id.is_(None))
            quizzes = (await session.execute(stmt)).scalars().all()
            for quiz in quizzes:
                quiz.subject_id = subject_id
            if quizzes:
                logger.info(f"Updated {len(quizzes)} quizzes for user {user.email}")
                
            # Update Conversations
            stmt = select(Conversation).where(Conversation.user_id == user.id, Conversation.subject_id.is_(None))
            convos = (await session.execute(stmt)).scalars().all()
            for convo in convos:
                convo.subject_id = subject_id
            if convos:
                logger.info(f"Updated {len(convos)} conversations for user {user.email}")

        await session.commit()
        logger.info("Database migration committed successfully.")
        
        # 2. Update ChromaDB Metadata
        if doc_to_subject_map:
            logger.info("Connecting to ChromaDB for metadata injection...")
            client = chromadb.HttpClient(
                host=settings.CHROMA_HOST, 
                port=settings.CHROMA_PORT,
            )
            collection = client.get_collection(name=settings.CHROMA_COLLECTION_NAME)
            
            for doc_id_str, subj_id_str in doc_to_subject_map.items():
                # Query chunks by document_id
                results = collection.get(
                    where={"document_id": doc_id_str}
                )
                if results and results["ids"]:
                    ids = results["ids"]
                    metadatas = results["metadatas"]
                    
                    # Update metadata with subject_id
                    new_metadatas = []
                    for meta in metadatas:
                        meta["subject_id"] = subj_id_str
                        new_metadatas.append(meta)
                        
                    # Update in ChromaDB
                    collection.update(
                        ids=ids,
                        metadatas=new_metadatas
                    )
                    logger.info(f"Injected subject_id into {len(ids)} chunks for document {doc_id_str}")
        
    logger.info("V2 Migration Completed!")

if __name__ == "__main__":
    asyncio.run(migrate_data())
