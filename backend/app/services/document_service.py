import logging
import uuid
import os
from pathlib import Path
from typing import List, Dict, Any

from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
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
        
        def extract_text(shape):
            extracted = ""
            if hasattr(shape, "text") and shape.text:
                extracted += shape.text + "\n"
            if hasattr(shape, "has_table") and shape.has_table:
                for row in shape.table.rows:
                    row_text = []
                    for cell in row.cells:
                        if cell.text:
                            row_text.append(cell.text.replace('\n', ' ').strip())
                    if row_text:
                        extracted += " | ".join(row_text) + "\n"
            if hasattr(shape, "shapes"):
                for child in shape.shapes:
                    extracted += extract_text(child)
            return extracted

        for slide in prs.slides:
            for shape in slide.shapes:
                text = extract_text(shape)
                if text.strip():
                    text_runs.append(text.strip())
                    
        final_text = "\n\n".join(text_runs)
        return [LangchainDocument(page_content=final_text, metadata={"source": self.file_path})]

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
        try:
            # Initialize the ChromaDB client
            self.chroma_client = chromadb.HttpClient(
                host=settings.CHROMA_HOST, 
                port=settings.CHROMA_PORT
            )
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model=settings.GEMINI_EMBEDDING_MODEL,
                google_api_key=settings.GEMINI_API_KEY
            )
            # Using LangChain Chroma wrapper for easy integration
            self.vector_store = Chroma(
                client=self.chroma_client,
                collection_name=settings.CHROMA_COLLECTION_NAME,
                embedding_function=self.embeddings
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to initialize ChromaDB: {e}")
            self.chroma_client = None
            self.embeddings = None
            self.vector_store = None
            
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1600,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )

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

    async def process_document(self, db: AsyncSession, document: Document) -> Dict[str, float]:
        """
        Background task to process a document.
        Returns a dictionary of execution times (in seconds).
        """
        import time
        timings = {}
        t_start_total = time.perf_counter()
        
        try:
            logger.info(f"Starting processing for document {document.id}. Updating status to PROCESSING.")
            # 1. Update status to PROCESSING
            document.status = DocumentStatus.PROCESSING
            document.processing_stage = "PDF Parsing"
            await db.commit()

            # 2. Extract text using Langchain loaders
            if not os.path.exists(document.file_path):
                raise DocumentProcessingError(f"File not found: {document.file_path}")

            logger.info(f"Extracting text from {document.file_path} using custom loader.")
            t_parse_start = time.perf_counter()
            loader = self._get_loader(document.file_path)
            langchain_docs = loader.load()
            timings["pdf_parsing"] = time.perf_counter() - t_parse_start

            # 3. Chunk text
            document.processing_stage = "Chunking"
            await db.commit()
            
            logger.info("Splitting text into chunks.")
            t_chunk_start = time.perf_counter()
            chunks = self.text_splitter.split_documents(langchain_docs)
            
            if not chunks:
                raise DocumentProcessingError("No text could be extracted from the document.")

            logger.info(f"Created {len(chunks)} initial chunks.")

            # 4. Prepare for Vector DB
            texts = []
            
            MAX_CHARS = 2000
            
            # Enforce hard limit (fallback safety)
            for chunk in chunks:
                content = chunk.page_content
                if len(content) > MAX_CHARS:
                    for i in range(0, len(content), MAX_CHARS):
                        texts.append(content[i:i + MAX_CHARS])
                else:
                    texts.append(content)
                    
            logger.info(f"Enforced character limit. Final chunk count: {len(texts)}.")
            timings["chunking"] = time.perf_counter() - t_chunk_start

            # 5. Embed and store in ChromaDB
            document.processing_stage = "Embeddings"
            await db.commit()
            
            logger.info("Generating embeddings and storing in ChromaDB.")
            t_embed_start = time.perf_counter()
            
            metadatas = []
            db_chunks = []
            
            for i, text in enumerate(texts):
                metadata = {
                    "user_id": str(document.user_id),
                    "document_id": str(document.id),
                    "subject_id": str(document.subject_id),
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

            timings["embeddings"] = time.perf_counter() - t_embed_start

            # 7. Mark as TUTOR_READY
            document.status = DocumentStatus.TUTOR_READY
            document.processing_stage = "Extracting Topics"
            await db.commit()
            logger.info(f"Successfully processed document {document.id}. Status updated to TUTOR_READY.")
            
            return timings

        except Exception as e:
            logger.error(f"Error processing document {document.id}: {str(e)}\n{traceback.format_exc()}")
            await db.rollback()
            document = await db.get(Document, document.id)
            if document:
                document.status = DocumentStatus.FAILED
                document.error_message = str(e)
                await db.commit()
                logger.info(f"Document {document.id} status updated to FAILED.")
            raise

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

    async def delete_document_vectors(self, document: Document) -> None:
        """
        Delete ONLY the ChromaDB vectors for a document without touching the file or PostgreSQL.
        Used by Retry Processing to clear stale embeddings before re-indexing.
        """
        try:
            if self.chroma_client is None:
                return
            collection = self.chroma_client.get_collection(settings.CHROMA_COLLECTION_NAME)
            collection.delete(where={"document_id": str(document.id)})
            logger.info(f"Cleared stale vectors for document {document.id} (retry)")
        except Exception as e:
            logger.warning(f"Could not clear vectors for document {document.id} (non-fatal): {str(e)})")

    async def search_by_vector(self, embedding: list[float], subject_id: uuid.UUID = None, document_id: uuid.UUID = None, k: int = 5):
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
            
            filter_dict = {}
            if subject_id:
                filter_dict["subject_id"] = str(subject_id)
            if document_id:
                filter_dict["document_id"] = str(document_id)
                
            # similarity_search_by_vector is a synchronous LangChain method
            results = await run_in_threadpool(
                self.vector_store.similarity_search_by_vector,
                embedding,
                k=k,
                filter=filter_dict if filter_dict else None
            )
            return results
        except Exception as e:
            logger.error(f"Error searching ChromaDB by vector: {str(e)}")
            raise DocumentProcessingError(f"Retrieval failed: {str(e)}")

    async def search_by_text(self, query: str, subject_id: uuid.UUID = None, document_id: uuid.UUID = None, k: int = 5):
        """
        Search ChromaDB using a text query.
        """
        try:
            # Check if collection exists
            try:
                collection = self.chroma_client.get_collection(settings.CHROMA_COLLECTION_NAME)
            except ValueError:
                return []
                
            if collection.count() == 0:
                return []
                
            from fastapi.concurrency import run_in_threadpool
            
            filter_dict = {}
            if subject_id:
                filter_dict["subject_id"] = str(subject_id)
            if document_id:
                filter_dict["document_id"] = str(document_id)
                
            results = await run_in_threadpool(
                self.vector_store.similarity_search,
                query,
                k=k,
                filter=filter_dict if filter_dict else None
            )
            return results
        except Exception as e:
            logger.error(f"Error searching ChromaDB by text: {str(e)}")
            return []

document_service = DocumentService()
