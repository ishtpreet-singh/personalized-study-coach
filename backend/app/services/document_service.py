import logging
import uuid
import os
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import traceback

from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document as LangchainDocument
from langchain_chroma import Chroma
import chromadb
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
import pptx
import openpyxl
from PIL import Image
import pytesseract

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.document import Document, DocumentChunk, DocumentStatus
from app.models.document_vector import DocumentChunkVector
from app.services.storage_service import storage_service

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
        # Always initialize Gemini embeddings (used by both Chroma and pgvector)
        try:
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model=settings.GEMINI_EMBEDDING_MODEL,
                google_api_key=settings.GEMINI_API_KEY
            )
        except Exception as e:
            logger.warning(f"Could not initialize GoogleGenerativeAIEmbeddings: {e}")
            self.embeddings = None

        # Conditionally initialize ChromaDB client only if using chroma provider
        self.chroma_client = None
        self.vector_store = None

        if settings.VECTOR_STORE_PROVIDER == "chroma":
            try:
                self.chroma_client = chromadb.HttpClient(
                    host=settings.CHROMA_HOST,
                    port=settings.CHROMA_PORT
                )
                self.vector_store = Chroma(
                    client=self.chroma_client,
                    collection_name=settings.CHROMA_COLLECTION_NAME,
                    embedding_function=self.embeddings
                )
                logger.info(f"Initialized ChromaDB client at {settings.CHROMA_HOST}:{settings.CHROMA_PORT}")
            except Exception as e:
                logger.warning(f"Failed to initialize ChromaDB (provider=chroma): {e}")

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1600,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )

    def _get_loader(self, file_path: str):
        path = Path(file_path)
        ext = path.suffix.lower()

        if ext == ".pdf":
            return PyPDFLoader(file_path)
        elif ext in [".docx", ".doc"]:
            return Docx2txtLoader(file_path)
        elif ext in [".pptx", ".ppt"]:
            return CustomPPTXLoader(file_path)
        elif ext == ".txt":
            return CustomTextLoader(file_path, encoding='utf-8')
        elif ext in [".xlsx", ".xls"]:
            return CustomXLSXLoader(file_path)
        elif ext in [".jpg", ".jpeg", ".png"]:
            return CustomImageLoader(file_path)
        else:
            raise DocumentProcessingError(f"Unsupported file format: {ext}")

    async def process_document(self, db: AsyncSession, document: Document) -> dict:
        """
        Executes document ingestion:
          1. Ensures file is locally available (via StorageService)
          2. Text extraction
          3. Chunking
          4. Vector embedding generation (Gemini)
          5. Persistent storage in pgvector (production) or ChromaDB (local)
          6. Chunks saved to PostgreSQL
        Returns a dictionary of execution times (in seconds).
        """
        timings = {}

        try:
            logger.info(f"Starting processing for document {document.id}. Updating status to PROCESSING.")
            document.status = DocumentStatus.PROCESSING
            document.processing_stage = "PDF Parsing"
            await db.commit()

            # 1. Ensure file is locally available (downloads from Supabase Storage if running on Render)
            local_path = await storage_service.ensure_local_file(document.file_path)
            logger.info(f"Extracting text from {local_path} using custom loader.")
            t_parse_start = time.perf_counter()
            loader = self._get_loader(local_path)
            langchain_docs = loader.load()
            timings["pdf_parsing"] = time.perf_counter() - t_parse_start

            # 2. Chunk text
            document.processing_stage = "Chunking"
            await db.commit()

            logger.info("Splitting text into chunks.")
            t_chunk_start = time.perf_counter()
            chunks = self.text_splitter.split_documents(langchain_docs)

            if not chunks:
                raise DocumentProcessingError("No text could be extracted from the document.")

            logger.info(f"Created {len(chunks)} initial chunks.")

            # 3. Enforce chunk length limits
            texts = []
            MAX_CHARS = 2000
            for chunk in chunks:
                content = chunk.page_content
                if len(content) > MAX_CHARS:
                    for i in range(0, len(content), MAX_CHARS):
                        texts.append(content[i:i + MAX_CHARS])
                else:
                    texts.append(content)

            timings["chunking"] = time.perf_counter() - t_chunk_start

            # 4. Generate embeddings and store in vector database
            document.processing_stage = "Embeddings"
            await db.commit()

            logger.info(f"Generating embeddings for {len(texts)} chunks (provider={settings.VECTOR_STORE_PROVIDER}).")
            t_embed_start = time.perf_counter()

            if settings.VECTOR_STORE_PROVIDER == "pgvector":
                # ── pgvector flow (Supabase / Production) ──
                if hasattr(self.embeddings, "aembed_documents"):
                    vectors = await self.embeddings.aembed_documents(texts)
                else:
                    from fastapi.concurrency import run_in_threadpool
                    vectors = await run_in_threadpool(self.embeddings.embed_documents, texts)

                for i, text in enumerate(texts):
                    chunk_id = uuid.uuid4()
                    db_chunk = DocumentChunk(
                        id=chunk_id,
                        document_id=document.id,
                        chunk_index=i,
                        content=text,
                        embedding_id=f"{document.id}_chunk_{i}"
                    )
                    db.add(db_chunk)

                    vector_entry = DocumentChunkVector(
                        chunk_id=chunk_id,
                        document_id=document.id,
                        subject_id=document.subject_id,
                        user_id=document.user_id,
                        embedding=vectors[i]
                    )
                    db.add(vector_entry)

            else:
                # ── ChromaDB flow (Local / Backward-compatible) ──
                metadatas = []
                db_chunks = []

                for i, text in enumerate(texts):
                    metadata = {
                        "user_id": str(document.user_id),
                        "document_id": str(document.id),
                        "subject_id": str(document.subject_id),
                        "filename": document.title,
                        "chunk_index": i,
                        "subject": ""
                    }
                    metadatas.append(metadata)

                    db_chunks.append(
                        DocumentChunk(
                            document_id=document.id,
                            chunk_index=i,
                            content=text,
                            embedding_id=""
                        )
                    )

                ids = [f"{document.id}_chunk_{i}" for i in range(len(texts))]

                self.vector_store.add_texts(
                    texts=texts,
                    metadatas=metadatas,
                    ids=ids
                )

                for i, db_chunk in enumerate(db_chunks):
                    db_chunk.embedding_id = ids[i]
                    db.add(db_chunk)

            timings["embeddings"] = time.perf_counter() - t_embed_start

            # 5. Mark as TUTOR_READY
            document.status = DocumentStatus.TUTOR_READY
            document.processing_stage = "Extracting Topics"
            await db.commit()
            logger.info(f"Successfully processed document {document.id}. Status updated to TUTOR_READY.")

            return timings

        except Exception as e:
            logger.error(f"Error processing document {document.id}: {str(e)}\n{traceback.format_exc()}")
            await db.rollback()
            doc_record = await db.get(Document, document.id)
            if doc_record:
                doc_record.status = DocumentStatus.FAILED
                doc_record.error_message = str(e)
                await db.commit()
                logger.info(f"Document {document.id} status updated to FAILED.")
            raise

    async def process_document_background(self, document_id: uuid.UUID) -> None:
        async with AsyncSessionLocal() as session:
            document = await session.get(Document, document_id)
            if document:
                await self.process_document(session, document)

    async def delete_document(self, db: AsyncSession, document: Document) -> None:
        """
        Delete a document's vectors and physical/cloud storage.
        PostgreSQL document_chunks and document_chunk_vectors cascade-delete automatically.
        """
        try:
            await self.delete_document_vectors(document, db=db)
            await storage_service.delete_file(document.file_path)
            logger.info(f"Cleaned up vectors and storage for document {document.id}")
        except Exception as e:
            logger.error(f"Error cleaning up document {document.id}: {str(e)}")

    async def delete_document_vectors(self, document: Document, db: Optional[AsyncSession] = None) -> None:
        """
        Clear vector embeddings for a document (used on retry or delete).
        """
        try:
            if settings.VECTOR_STORE_PROVIDER == "pgvector":
                async def _delete_pg(session: AsyncSession):
                    stmt = delete(DocumentChunkVector).where(DocumentChunkVector.document_id == document.id)
                    await session.execute(stmt)
                    logger.info(f"Cleared pgvector embeddings for document {document.id}")

                if db is not None:
                    await _delete_pg(db)
                else:
                    async with AsyncSessionLocal() as session:
                        await _delete_pg(session)
                        await session.commit()
            else:
                if self.chroma_client is not None:
                    collection = self.chroma_client.get_collection(settings.CHROMA_COLLECTION_NAME)
                    collection.delete(where={"document_id": str(document.id)})
                    logger.info(f"Cleared ChromaDB vectors for document {document.id}")
        except Exception as e:
            logger.warning(f"Could not clear vectors for document {document.id} (non-fatal): {str(e)}")

    async def search_by_vector(
        self,
        embedding: list[float],
        subject_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        document_id: Optional[uuid.UUID] = None,
        k: int = 5,
        db: Optional[AsyncSession] = None
    ) -> List[LangchainDocument]:
        """
        Search for nearest neighbor document chunks using a query embedding.
        Enforces strict subject and user isolation.
        """
        if settings.VECTOR_STORE_PROVIDER == "pgvector":
            async def _run_pg_search(session: AsyncSession) -> List[LangchainDocument]:
                stmt = (
                    select(
                        DocumentChunk.content,
                        Document.title.label("filename"),
                        Document.id.label("document_id"),
                        Document.subject_id.label("subject_id"),
                        DocumentChunkVector.chunk_id,
                        DocumentChunkVector.embedding.cosine_distance(embedding).label("distance")
                    )
                    .join(DocumentChunk, DocumentChunk.id == DocumentChunkVector.chunk_id)
                    .join(Document, Document.id == DocumentChunkVector.document_id)
                )

                if subject_id is not None:
                    stmt = stmt.where(DocumentChunkVector.subject_id == subject_id)
                if user_id is not None:
                    stmt = stmt.where(DocumentChunkVector.user_id == user_id)
                if document_id is not None:
                    stmt = stmt.where(DocumentChunkVector.document_id == document_id)

                stmt = stmt.order_by("distance").limit(k)
                result = await session.execute(stmt)
                rows = result.all()

                results = []
                for row in rows:
                    results.append(
                        LangchainDocument(
                            page_content=row.content,
                            metadata={
                                "filename": row.filename,
                                "document_id": str(row.document_id),
                                "subject_id": str(row.subject_id),
                                "chunk_id": str(row.chunk_id),
                                "source": row.filename,
                                "distance": float(row.distance) if row.distance is not None else 0.0,
                            }
                        )
                    )
                return results

            if db is not None:
                return await _run_pg_search(db)
            else:
                async with AsyncSessionLocal() as session:
                    return await _run_pg_search(session)

        else:
            # ── ChromaDB flow ──
            try:
                if self.chroma_client is None or self.vector_store is None:
                    logger.warning("ChromaDB client is not available.")
                    return []

                collection = self.chroma_client.get_collection(settings.CHROMA_COLLECTION_NAME)
                if collection.count() == 0:
                    return []

                from fastapi.concurrency import run_in_threadpool

                filter_dict = {}
                if subject_id:
                    filter_dict["subject_id"] = str(subject_id)
                if user_id:
                    filter_dict["user_id"] = str(user_id)
                if document_id:
                    filter_dict["document_id"] = str(document_id)

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

    async def search_by_text(
        self,
        query: str,
        subject_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        document_id: Optional[uuid.UUID] = None,
        k: int = 5,
        db: Optional[AsyncSession] = None
    ) -> List[LangchainDocument]:
        """
        Embeds query text and executes semantic search.
        """
        if hasattr(self.embeddings, "aembed_query"):
            query_embedding = await self.embeddings.aembed_query(query)
        else:
            from fastapi.concurrency import run_in_threadpool
            query_embedding = await run_in_threadpool(self.embeddings.embed_query, query)

        return await self.search_by_vector(
            embedding=query_embedding,
            subject_id=subject_id,
            user_id=user_id,
            document_id=document_id,
            k=k,
            db=db
        )


document_service = DocumentService()
