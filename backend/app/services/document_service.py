import logging
import uuid
import os
from pathlib import Path
from typing import List, Dict, Any

from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import TokenTextSplitter
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from langchain_core.documents import Document as LangchainDocument
from langchain_chroma import Chroma
import chromadb
from sqlalchemy.ext.asyncio import AsyncSession
import traceback
import pptx
import openpyxl
from PIL import Image
import pytesseract

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.document import Document, DocumentChunk, DocumentStatus

logger = logging.getLogger(__name__)

class DocumentProcessingError(Exception):
    pass

class CustomPPTXLoader:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def load(self):
        prs = pptx.Presentation(self.file_path)
        text_runs = []
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text_runs.append(shape.text)
        text = "\n".join(text_runs)
        return [LangchainDocument(page_content=text, metadata={"source": self.file_path})]

class CustomTextLoader:
    def __init__(self, file_path: str, encoding: str = 'utf-8'):
        self.file_path = file_path
        self.encoding = encoding

    def load(self):
        with open(self.file_path, 'r', encoding=self.encoding) as f:
            text = f.read()
        return [LangchainDocument(page_content=text, metadata={"source": self.file_path})]

class CustomXLSXLoader:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def load(self):
        wb = openpyxl.load_workbook(self.file_path, data_only=True)
        text_runs = []
        for sheet in wb.sheetnames:
            ws = wb[sheet]
            for row in ws.iter_rows(values_only=True):
                row_texts = [str(cell) for cell in row if cell is not None and str(cell).strip() != ""]
                if row_texts:
                    text_runs.append(" ".join(row_texts))
        text = "\n".join(text_runs)
        return [LangchainDocument(page_content=text, metadata={"source": self.file_path})]

class CustomImageLoader:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def load(self):
        img = Image.open(self.file_path)
        text = pytesseract.image_to_string(img)
        return [LangchainDocument(page_content=text, metadata={"source": self.file_path})]

class DocumentService:
    def __init__(self):
        # Initialize the ChromaDB client
        self.chroma_client = chromadb.HttpClient(
            host=settings.CHROMA_HOST, 
            port=settings.CHROMA_PORT
        )
        self.embeddings = NVIDIAEmbeddings(
            model=settings.NVIDIA_EMBEDDING_MODEL,
            api_key=settings.NVIDIA_API_KEY
        )
        # Using LangChain Chroma wrapper for easy integration
        self.vector_store = Chroma(
            client=self.chroma_client,
            collection_name=settings.CHROMA_COLLECTION_NAME,
            embedding_function=self.embeddings
        )
        self.text_splitter = TokenTextSplitter(
            chunk_size=400,
            chunk_overlap=50,
            model_name=settings.OPENAI_MODEL  # uses tiktoken for this model's encoding
        )
        import tiktoken
        self.tokenizer = tiktoken.encoding_for_model(settings.OPENAI_MODEL)

    def _get_loader(self, file_path: str):
        path = Path(file_path)
        ext = path.suffix.lower()
        if ext == '.pdf':
            return PyPDFLoader(file_path)
        elif ext == '.docx':
            return Docx2txtLoader(file_path)
        elif ext == '.pptx':
            return CustomPPTXLoader(file_path)
        elif ext == '.txt':
            return CustomTextLoader(file_path, encoding='utf-8')
        elif ext == '.xlsx':
            return CustomXLSXLoader(file_path)
        elif ext in ['.jpg', '.jpeg', '.png']:
            return CustomImageLoader(file_path)
        else:
            raise DocumentProcessingError(f"Unsupported file extension: {ext}")

    async def process_document(self, db: AsyncSession, document: Document) -> None:
        """
        Background task to process a document:
        1. Extract text
        2. Chunk text
        3. Embed and store in ChromaDB
        4. Save chunks to Postgres
        5. Update document status
        """
        try:
            logger.info(f"Starting processing for document {document.id}. Updating status to PROCESSING.")
            # 1. Update status to PROCESSING
            document.status = DocumentStatus.PROCESSING
            await db.commit()

            # 2. Extract text using Langchain loaders
            if not os.path.exists(document.file_path):
                raise DocumentProcessingError(f"File not found: {document.file_path}")

            logger.info(f"Extracting text from {document.file_path} using custom loader.")
            loader = self._get_loader(document.file_path)
            langchain_docs = loader.load()

            # 3. Chunk text
            logger.info("Splitting text into chunks.")
            chunks = self.text_splitter.split_documents(langchain_docs)
            
            if not chunks:
                raise DocumentProcessingError("No text could be extracted from the document.")

            logger.info(f"Created {len(chunks)} initial chunks.")

            # 4. Prepare for Vector DB
            texts = []
            
            MAX_TOKENS = 512
            
            # Enforce hard limit and log token counts
            for chunk in chunks:
                tokens = self.tokenizer.encode(chunk.page_content)
                if len(tokens) > MAX_TOKENS:
                    # Hard split if still too large (fallback safety)
                    for i in range(0, len(tokens), MAX_TOKENS):
                        sub_tokens = tokens[i:i + MAX_TOKENS]
                        texts.append(self.tokenizer.decode(sub_tokens))
                else:
                    texts.append(chunk.page_content)
                    
            logger.info(f"Enforced token limit. Final chunk count: {len(texts)}.")

            logger.info("Generating embeddings and storing in ChromaDB.")
            metadatas = []
            db_chunks = []
            
            for i, text in enumerate(texts):
                metadata = {
                    "user_id": str(document.user_id),
                    "document_id": str(document.id),
                    "filename": document.title,
                    "chunk_index": i,
                    "subject": "" # For future use
                }
                metadatas.append(metadata)
                
                # Create corresponding DB chunk object
                db_chunks.append(
                    DocumentChunk(
                        document_id=document.id,
                        chunk_index=i,
                        content=text,
                        # We will assign embedding_id after insertion if we need it
                        embedding_id="" 
                    )
                )

            # 5. Embed and store in ChromaDB
            # We generate deterministic IDs or let Chroma generate them
            ids = [f"{document.id}_chunk_{i}" for i in range(len(texts))]
            
            self.vector_store.add_texts(
                texts=texts,
                metadatas=metadatas,
                ids=ids
            )
            
            # 6. Save chunks to PostgreSQL
            for i, db_chunk in enumerate(db_chunks):
                db_chunk.embedding_id = ids[i]
                db.add(db_chunk)

            # 7. Mark as completed
            document.status = DocumentStatus.COMPLETED
            await db.commit()
            logger.info(f"Successfully processed document {document.id}. Status updated to COMPLETED.")

        except Exception as e:
            logger.error(f"Error processing document {document.id}: {str(e)}\n{traceback.format_exc()}")
            await db.rollback()
            document = await db.get(Document, document.id)
            if document:
                document.status = DocumentStatus.FAILED
                document.error_message = str(e)
                await db.commit()
                logger.info(f"Document {document.id} status updated to FAILED.")

    async def process_document_background(self, document_id: uuid.UUID) -> None:
        """
        Wrapper to process a document in a background task with its own database session.
        """
        async with AsyncSessionLocal() as session:
            document = await session.get(Document, document_id)
            if document:
                await self.process_document(session, document)

    async def delete_document(self, db: AsyncSession, document: Document) -> None:
        """
        Delete a document's chunks from ChromaDB. 
        PostgreSQL chunks are cascade-deleted automatically.
        """
        try:
            # Delete from ChromaDB where metadata document_id matches
            collection = self.chroma_client.get_collection(settings.CHROMA_COLLECTION_NAME)
            collection.delete(where={"document_id": str(document.id)})
            logger.info(f"Deleted vectors for document {document.id}")
            
            # Delete physical file
            if os.path.exists(document.file_path):
                os.remove(document.file_path)
                
        except Exception as e:
            logger.error(f"Error cleaning up document {document.id}: {str(e)}")

    async def search_by_vector(self, embedding: list[float], k: int = 5):
        """
        Search ChromaDB using a pre-generated embedding vector.
        """
        try:
            # Check if collection exists
            try:
                collection = self.chroma_client.get_collection(settings.CHROMA_COLLECTION_NAME)
            except ValueError:
                logger.warning(f"ChromaDB collection {settings.CHROMA_COLLECTION_NAME} does not exist.")
                return []
                
            if collection.count() == 0:
                logger.warning("ChromaDB collection is empty.")
                return []
                
            from fastapi.concurrency import run_in_threadpool
            # similarity_search_by_vector is a synchronous LangChain method
            results = await run_in_threadpool(
                self.vector_store.similarity_search_by_vector,
                embedding,
                k=k
            )
            return results
        except Exception as e:
            logger.error(f"Error searching ChromaDB by vector: {str(e)}")
            raise DocumentProcessingError(f"Retrieval failed: {str(e)}")

document_service = DocumentService()
