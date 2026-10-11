# 🎓 Personalized Study Coach — Adaptive AI Tutor

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-0.3+-blue)](https://github.com/pgvector/pgvector)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.6_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docs.docker.com/compose/)

> An AI-powered adaptive study platform that transforms lecture slides, notes, and course materials into interactive personal tutors, practice quizzes, and mastery tracking with strict subject isolation.

---

## 📖 Overview

**Personalized Study Coach** is a full-stack educational platform built with **FastAPI**, **React**, and **Google Gemini**. It enables students to organize their study materials into dedicated subject workspaces, ask questions grounded strictly in their uploaded documents via Retrieval-Augmented Generation (RAG), and take customized practice quizzes generated on-demand from extracted course topics.

The platform is designed with a hybrid storage and retrieval architecture:
- **Local Development**: Runs containerized with **Docker Compose**, using **ChromaDB** for vector similarity search and the local filesystem for document storage.
- **Production (Planned)**: Deploys the FastAPI backend to **Render**, the React SPA to **Firebase Hosting**, and persistent PostgreSQL, **pgvector** (3072-dimensional embeddings), and private document files to **Supabase**.

---

## 🗺️ Development Roadmap

- [x] **Phase 0 — Planning & Architecture:** System design, technology stack, database schema, and project structure.
- [x] **Phase 1 — Backend Foundation & Authentication:** FastAPI, PostgreSQL, SQLAlchemy async, JWT authentication, bcrypt password hashing, TOTP two-factor authentication (2FA), Google Sign-In, and in-memory token blacklisting.
- [x] **Phase 2 — Frontend Foundation:** React 19, TypeScript, Tailwind CSS, React Router 7, authentication UI, responsive top navigation (`TopNav`), and dashboard views.
- [x] **Phase 3 — AI / RAG Foundation:** Multi-format document ingestion (PDF, PPTX, DOCX, XLSX, TXT, image OCR), text chunking, Gemini 3072-dimensional embeddings (`models/gemini-embedding-001`), dual vector storage (ChromaDB locally, pgvector in production), and grounded AI Tutor chat with source citations.
- [x] **Phase 4 — Quiz Engine:** On-demand quiz question generation from document topics using Gemini, interactive quiz player with timer and auto-saving, automated answer evaluation, and score tracking.
- [ ] **Phase 5 — Learning Analytics & Weak Topic Detection:** *(Next Phase)* In-depth quiz performance analysis, historical topic mastery progression, automated weak-area identification, and targeted revision recommendations.
- [ ] **Phase 6 — Personalized Study Planner:** Adaptive revision schedule generation, spaced-repetition reminders, and Google Calendar synchronization.
- [ ] **Phase 7 — Flashcards & AI Notes:** Automated flashcard deck generation, key concept summaries, and cheat-sheet generation from uploaded course materials.

---

## ✨ Features & Implementation Status

| Feature | Phase | Status | Description |
|---|---|---|---|
| 🔐 **Authentication & Security** | Phase 1 | ✅ Implemented | JWT access & refresh token rotation, bcrypt password hashing, TOTP 2FA with QR code generation, Google OAuth sign-in, token blacklisting on logout, email verification, and password reset flows. |
| 📚 **Subject Workspaces** | Phase 2 | ✅ Implemented | Subject-specific workspaces (`/subjects/:id`) with custom color themes, exam countdowns, study streaks, and strict user/subject data isolation. |
| 🧭 **Global Top Navigation** | Phase 2 | ✅ Implemented | Horizontal header (`TopNav`) with branding, Calendar and Planner status indicators, Profile management, and standalone Logout control. |
| 📄 **Document Ingestion Pipeline** | Phase 3 | ✅ Implemented | Multi-format text extraction (PDF via `pypdf`, DOCX, PPTX, XLSX, TXT, and OCR via Tesseract), character-limited chunking, background stage tracking, and processing retry endpoint (`POST /documents/{id}/retry`). |
| 🧠 **Dual Vector Storage (RAG)** | Phase 3 | ✅ Implemented | Google Gemini embeddings (3072-dim). Supports **ChromaDB** for local development and **pgvector** (`document_chunk_vectors` table) for production with exact cosine distance search (`<=>`) and composite indexing on `(subject_id, user_id)`. |
| ☁️ **Hybrid Document Storage** | Phase 3 | ✅ Implemented | Private Supabase Storage bucket (`study_coach_documents`) with automatic recovery for ephemeral filesystems, plus local filesystem fallback (`uploads/`) for development. |
| 🤖 **AI Tutor (Grounded Q&A)** | Phase 3 | ✅ Implemented | Conversational study tutor powered by Gemini 3.6 Flash. Grounded with retrieved document chunks and learning profile context, streaming SSE responses, and deduplicated source citations. |
| 📝 **Quiz Generation & Evaluation** | Phase 4 | ✅ Implemented | On-demand question generation from extracted document topics, multiple question types (MCQ, True/False, Short Answer), interactive timer, instant scoring, and attempt history logging. |
| 📊 **Basic Mastery Scoring** | Phase 4 | ✅ Implemented | Initial mastery score and quiz accuracy recording in `AILearningProfile` upon quiz submission. |
| 🧠 **Weak Topic Detection & Analytics** | Phase 5 | 🔄 In Progress | Granular weak-topic classification, confidence trend tracking, and automated revision recommendations based on cumulative performance. |
| 📋 **Study Planner & Calendar Views** | Phase 6 | 🔄 In Progress | Frontend UI for daily study schedules and monthly revision calendars (currently rendered with mock data; backend generators and Google Calendar sync planned). |
| 🃏 **Flashcards & AI Summary Notes** | Phase 7 | 🔜 Planned | Auto-generated active recall flashcards, chapter summaries, and revision cheat-sheets. |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND: React 19 + Vite 8                         │
│   TopNav │ Dashboard │ Subject Workspace │ AI Tutor │ Quizzes │ Profile │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │  HTTPS / REST (Axios)
┌────────────────────────────────────▼────────────────────────────────────┐
│                      BACKEND: FastAPI (Python 3.11)                     │
│  Auth (JWT/2FA) │ Subjects │ Documents │ Chat (RAG) │ Quiz Engine       │
└──────────────┬─────────────────────────────┬────────────────────────────┘
               │                             │
    ┌──────────▼──────────┐       ┌──────────▼──────────────┐
    │   PostgreSQL 15     │       │        AI Layer         │
    │  Users, Subjects,   │       │  Google Gemini 3.6      │
    │  Quizzes, Chunks    │       │  Gemini Embeddings      │
    └──────────┬──────────┘       │  (models/gemini-        │
               │                  │   embedding-001)        │
    ┌──────────▼──────────┐       └─────────────────────────┘
    │    Vector Store     │
    │  • Local: ChromaDB  │
    │  • Prod: pgvector   │
    └─────────────────────┘
               │
    ┌──────────▼──────────┐
    │   Document Files    │
    │  • Local: uploads/  │
    │  • Prod: Supabase   │
    │    Storage Bucket   │
    └─────────────────────┘
```

### Vector Storage Architecture: Local vs. Production
The backend supports pluggable vector storage via the `VECTOR_STORE_PROVIDER` environment variable:
- **Local Development (`VECTOR_STORE_PROVIDER=chroma`)**: Connects to the local `chromadb` HTTP container on port `8001`. Chunks and metadata are stored in the `study_materials` Chroma collection.
- **Production (`VECTOR_STORE_PROVIDER=pgvector`)**: Stores 3072-dimensional embeddings directly in PostgreSQL inside the `document_chunk_vectors` table. Queries execute exact cosine similarity search (`<=>`) with SQL filtering on `subject_id` and `user_id`, eliminating extra service dependencies.

---

## 📁 Project Structure

```
personalized-study-coach/
├── frontend/                   # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── api/                # API clients (auth, chat, documents, quizzes, etc.)
│   │   ├── components/         # Reusable UI (quiz, layout with TopNav, chat primitives)
│   │   ├── pages/              # Page routes (Dashboard, Calendar, Planner, Settings, etc.)
│   │   │   ├── quizzes/        # QuizList, QuizConfigurator, QuizPlayer, QuizResult
│   │   │   └── subjects/       # SubjectWorkspace, Analytics, LearningProfile
│   │   ├── hooks/              # Custom hooks (useAuth)
│   │   ├── store/              # Global state & AuthContext
│   │   ├── types/              # TypeScript interface definitions
│   │   └── utils/              # Helper utilities
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                    # FastAPI backend application
│   ├── app/
│   │   ├── api/                # Route handlers (v1: auth, chat, documents, quizzes, subjects, dashboard)
│   │   ├── core/               # Configuration, security, token blacklist
│   │   ├── db/                 # Database engine & async session factory
│   │   ├── models/             # SQLAlchemy ORM models (User, Subject, Document, DocumentChunkVector, etc.)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   └── services/           # Services (document_service, llm_service, storage_service, quiz, etc.)
│   ├── alembic/                # Alembic database migrations (versions up to a1b2c3d4e5f6)
│   ├── tests/                  # Pytest test suite (auth, 2fa, documents, health, security)
│   ├── reindex_to_pgvector.py  # Standalone utility to populate pgvector from stored chunks
│   ├── test_pgvector_rag.py    # Verification test suite for pgvector & isolation
│   ├── requirements.txt        # Pinned Python dependencies
│   ├── alembic.ini             # Alembic configuration
│   └── pytest.ini              # Pytest configuration
│
├── docker/                     # Dockerfiles per service
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── docs/                       # Architecture and design documentation
├── docker-compose.yml          # Local container orchestration
├── .env.example                # Template for environment configuration
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) (recommended)
- [Node.js](https://nodejs.org/) (v18+) & `npm`
- [Python](https://www.python.org/) 3.11+
- Google AI Studio Gemini API Key ([get one here](https://aistudio.google.com/))

---

### Method A: Docker Compose (Recommended)

1. **Clone the repository and copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure mandatory environment variables in `.env`**:
   - Generate a secure 32+ character secret key:
     ```bash
     python3 -c "import secrets; print(secrets.token_hex(32))"
     ```
   - Set `SECRET_KEY` in `.env` with the generated value.
   - Set `GEMINI_API_KEY` with your Google Gemini API key.
   - Set `LLM_PROVIDER=gemini`.
   - Leave `VECTOR_STORE_PROVIDER=chroma` for local Docker ChromaDB.

3. **Start all services**:
   ```bash
   docker compose up --build
   ```

4. **Access local services**:
   | Service | Local Address |
   |---|---|
   | **Frontend** | [http://localhost:5173](http://localhost:5173) |
   | **Backend API** | [http://localhost:8000](http://localhost:8000) |
   | **Interactive API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |
   | **Alternative Docs (ReDoc)** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |
   | **Health Probe** | [http://localhost:8000/health](http://localhost:8000/health) |
   | **ChromaDB API** | [http://localhost:8001](http://localhost:8001) |
   | **pgAdmin (Optional Dev GUI)** | [http://localhost:5050](http://localhost:5050) *(run with `--profile dev`)* |

---

### Method B: Manual Setup (Without Docker)

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations against your local PostgreSQL database
alembic upgrade head

# Start FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
In a separate terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🔑 Environment Variables Reference

Configure environment variables in `.env` based on `.env.example`:

| Variable | Scope | Purpose | Example / Default Value |
|---|---|---|---|
| `APP_ENV` | Backend | Environment mode | `development` or `production` |
| `DEBUG` | Backend | Verbose debug logging | `false` |
| `SECRET_KEY` | Backend | Minimum 32-character key for JWT signing | `generate_via_secrets_token_hex` |
| `DATABASE_URL` | Backend | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `DB_POOL_SIZE` | Backend | SQLAlchemy pool size | `5` (Render) / `10` (Docker) |
| `DB_MAX_OVERFLOW` | Backend | Max pool overflow connections | `5` |
| `VECTOR_STORE_PROVIDER` | Backend | Vector storage provider | `chroma` (local) or `pgvector` (prod) |
| `CHROMA_HOST` | Backend | ChromaDB service hostname | `localhost` or `chromadb` |
| `CHROMA_PORT` | Backend | ChromaDB service port | `8001` (host) or `8000` (Docker internal) |
| `SUPABASE_URL` | Backend | Supabase Project REST API URL | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Secret key for Supabase Storage operations | `your_supabase_service_role_key` |
| `SUPABASE_STORAGE_BUCKET` | Backend | Bucket name for document files | `study_coach_documents` |
| `GEMINI_API_KEY` | Backend | Google AI Studio API key | `your_gemini_api_key` |
| `GEMINI_CHAT_MODEL` | Backend | Gemini model for chat and quizzes | `models/gemini-3.6-flash` |
| `GEMINI_EMBEDDING_MODEL` | Backend | Gemini model for 3072-dim embeddings | `models/gemini-embedding-001` |
| `LLM_PROVIDER` | Backend | Primary LLM provider | `gemini` |
| `FRONTEND_URL` | Backend | Client URL for email links and CORS | `http://localhost:5173` |
| `BACKEND_CORS_ORIGINS` | Backend | Allowed CORS origins (JSON array or comma list) | `["http://localhost:5173"]` |
| `VITE_API_BASE_URL` | Frontend | Backend API base URL | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | Google OAuth Client ID for sign-in | `your_google_client_id` |

---

## 🗄️ Database Migrations & Re-indexing

### Running Migrations (Alembic)
The project uses Alembic to manage PostgreSQL schemas asynchronously.

```bash
cd backend

# View current migration revision
alembic current

# Apply all pending migrations to the latest head
alembic upgrade head

# Roll back by one revision (if needed)
alembic downgrade -1
```

### Populating pgvector (`reindex_to_pgvector.py`)
When migrating existing documents from ChromaDB to pgvector on PostgreSQL / Supabase, run the included idempotent re-indexing script:

```bash
cd backend

# Preview documents eligible for re-indexing without writing to DB
python3 reindex_to_pgvector.py --dry-run

# Re-index chunks and generate 3072-dim embeddings with Gemini
python3 reindex_to_pgvector.py

# Force re-indexing of a specific document
python3 reindex_to_pgvector.py --force --document-id <DOCUMENT_UUID>
```

---

## 🧪 Testing

### Backend Test Suite
The backend includes unit tests for authentication, two-factor authentication, security helpers, and health probes, as well as an integration test for pgvector semantic retrieval.

```bash
cd backend

# Run the pgvector semantic retrieval and isolation verification suite
python3 test_pgvector_rag.py

# Run the unit test suite (requires configured TEST_DATABASE_URL in pytest.ini)
pytest tests/ -v
```

### Frontend Verification
```bash
cd frontend

# Verify TypeScript types and production bundle build
npm run build

# Run fast linter
npm run lint
```

---

## ☁️ Planned Production Deployment

> **Status**: Deployment preparation completed. Live production deployment steps are **planned** and pending external provider provisioning.

### 1. Database & Vector Storage (Supabase)
- **Database**: Managed PostgreSQL 15 on Supabase Free tier.
- **pgvector**: Enabled via `CREATE EXTENSION IF NOT EXISTS vector;`.
- **Document Storage**: Private Supabase Storage bucket named `study_coach_documents`.
- **Access**: Server-side only via connection pooling URI (`port 6543`) and `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Backend Web Service (Render)
- **Service**: Render Free Web Service linked to repository `backend/` directory.
- **Runtime**: Python 3.
- **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`.
- **Start Command**: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Health Check Path**: `/health` (lightweight JSON liveness probe).

### 3. Frontend Hosting (Firebase Hosting)
- **Service**: Firebase Hosting (Free Spark plan) serving `frontend/dist`.
- **Configuration**: Single-Page Application (SPA) rewrite rules routing all requests to `index.html`.
- **Base URL**: Pointing `VITE_API_BASE_URL` to the deployed Render backend URL.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
