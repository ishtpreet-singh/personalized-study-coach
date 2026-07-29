# System Architecture — Personalized Study Coach

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│   Browser  ──→  React + Vite (SPA)                                  │
│                 Port 5173                                           │
│                 React Router · Axios · React Query · Recharts       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  HTTPS / REST
                           │  JSON Payloads
┌──────────────────────────▼──────────────────────────────────────────┐
│                         API LAYER (FastAPI)                         │
│                         Port 8000                                   │
│                                                                     │
│  /api/v1/auth       → JWT auth, Google OAuth                        │
│  /api/v1/documents  → Upload, process, manage study materials       │
│  /api/v1/rag        → RAG Q&A endpoint                              │
│  /api/v1/quiz       → Quiz generation and scoring                   │
│  /api/v1/adaptive   → Weak topic detection, adaptive quizzes        │
│  /api/v1/calendar   → Google Calendar sync                          │
└───────┬───────────────────────────────────────┬─────────────────────┘
        │                                       │
        │                                       │
┌───────▼───────────┐                 ┌─────────▼──────────────────────┐
│   DATA LAYER      │                 │          AI LAYER               │
│                   │                 │                                 │
│  PostgreSQL 15    │                 │  LangChain                      │
│  ─────────────    │                 │  ├── Document Loaders           │
│  users            │                 │  ├── Text Splitter              │
│  documents        │                 │  ├── OpenAI Embeddings          │
│  quiz_sessions    │                 │  ├── RetrievalQA Chain          │
│  quiz_results     │                 │  └── LLM (GPT-4o)              │
│  study_plans      │                 │                                 │
│  calendar_events  │                 │  ChromaDB (Vector Store)        │
│                   │                 │  ├── Per-user collections       │
│  Alembic          │                 │  └── Semantic search            │
│  (migrations)     │                 │                                 │
└───────────────────┘                 │  Tesseract OCR                  │
        │                             │  └── Image/handwriting → text   │
        │                             └─────────────────────────────────┘
        │
┌───────▼───────────┐
│   STORAGE LAYER   │
│                   │
│  AWS S3           │
│  └── Raw file     │
│      storage      │
│      (original    │
│       uploads)    │
└───────────────────┘
```

---

## 2. Data Flow — Document Upload & RAG

```
User Uploads File
       │
       ▼
FastAPI /documents/upload
       │
       ├──► Validate MIME type
       ├──► Upload raw file to AWS S3
       ├──► Save document record to PostgreSQL
       │
       ▼
Background Processing Task
       │
       ├──► Extract text
       │      ├── PDF      → pypdf
       │      ├── DOCX     → python-docx
       │      ├── PPTX     → python-pptx
       │      └── Image    → Tesseract OCR
       │
       ├──► Chunk text (RecursiveCharacterTextSplitter)
       ├──► Generate embeddings (OpenAI text-embedding-3-small)
       └──► Store in ChromaDB (user-namespaced collection)

User Asks Question
       │
       ▼
FastAPI /rag/ask
       │
       ├──► Embed the question
       ├──► Vector similarity search in ChromaDB
       ├──► Retrieve top-K relevant chunks
       ├──► Compose prompt with context
       └──► LLM (GPT-4o) generates answer
              │
              ▼
       Response with answer + source citations
```

---

## 3. Data Flow — Adaptive Quiz Engine

```
Quiz Generation
       │
       ├──► Retrieve user's weak topics from PostgreSQL
       ├──► Weight question difficulty based on past performance
       ├──► Retrieve relevant chunks from ChromaDB
       └──► LLM generates MCQ/short-answer questions

Quiz Submission
       │
       ├──► Score answers
       ├──► Identify wrong topics
       ├──► Update weak_topics in user profile
       └──► Store quiz_result in PostgreSQL

Next Quiz Cycle
       └──► Higher weight given to previously-failed topics
```

---

## 4. Component Responsibility Matrix

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend UI | React + Vite + Tailwind | User interface, routing, data fetching |
| State Management | React Query | Server state, caching, sync |
| HTTP Client | Axios | API calls, auth headers, error handling |
| Charts | Recharts | Progress, performance, analytics visualizations |
| API Framework | FastAPI | Request routing, validation, serialization |
| ORM | SQLAlchemy | Database models, queries, relationships |
| Migrations | Alembic | Schema versioning, rollback |
| Validation | Pydantic | Request/response type validation |
| AI Orchestration | LangChain | RAG chains, prompt templates |
| LLM | OpenAI GPT-4o | Quiz generation, Q&A, study plans |
| Embeddings | text-embedding-3-small | Semantic search vectors |
| Vector DB | ChromaDB | Fast similarity search |
| OCR | Tesseract | Handwriting & image text extraction |
| Relational DB | PostgreSQL 15 | All structured application data |
| File Storage | AWS S3 | Original uploaded documents |
| Compute | AWS EC2 | Application server hosting |
| Containers | Docker Compose | Local dev + production orchestration |
| Calendar | Google Calendar API | Study schedule sync |

---

## 5. Security Design

- **Authentication**: JWT access tokens (short-lived) + refresh tokens (long-lived)
- **Authorization**: Row-level: users can only access their own documents/quizzes
- **File Validation**: MIME type check + file size limits on upload
- **S3 Access**: Pre-signed URLs for secure direct downloads (no public buckets)
- **Secrets**: All API keys in environment variables, never committed
- **CORS**: Strict allowlist of frontend origins
- **SQL Injection**: Prevented by SQLAlchemy ORM parameterized queries
