# 🎓 Personalized Study Coach — Adaptive AI Tutor

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docs.docker.com/compose/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://postgresql.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-FF6B35)](https://trychroma.com/)

> An AI-powered adaptive learning platform that turns your study materials into an intelligent, personalized tutor.

---

## ✨ Features

| Feature | Status | Description |
|---|---|---|
| 📄 Document Upload | 🔜 Planned | PDF, DOCX, PPTX, Images, Handwritten notes |
| 🤖 RAG Q&A | 🔜 Planned | Ask questions from your own uploaded material |
| 📝 AI Quiz Generation | 🔜 Planned | Auto-generate quizzes from your notes |
| 📊 Performance Tracking | 🔜 Planned | Track scores and monitor progress over time |
| 🧠 Weak Topic Detection | 🔜 Planned | Identify and flag knowledge gaps |
| 🔄 Adaptive Learning | 🔜 Planned | Future quizzes adapt to weak areas |
| 📅 Study Plans | 🔜 Planned | Personalized AI-generated study schedules |
| 📆 Google Calendar Sync | 🔜 Planned | Sync study plan with Google Calendar |

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                 │
│   Dashboard │ Upload │ Q&A Chat │ Quiz │ Analytics │ Calendar  │
└──────────────────────────┬─────────────────────────────────────┘
                           │  HTTP / REST (Axios)
┌──────────────────────────▼─────────────────────────────────────┐
│                       BACKEND (FastAPI)                        │
│  Auth │ Documents │ RAG │ Quiz Engine │ Adaptive │ Calendar    │
└──────┬──────────────────────┬──────────────────────────────────┘
       │                      │
┌──────▼──────┐    ┌──────────▼──────────────┐
│ PostgreSQL  │    │       AI Layer           │
│ (Users,     │    │  LangChain + OpenAI API  │
│  Quizzes,   │    │  Embeddings + ChromaDB   │
│  Progress)  │    │  Tesseract OCR           │
└─────────────┘    └──────────────────────────┘
       │
┌──────▼──────┐
│   AWS S3    │
│ (Documents) │
└─────────────┘
```

---

## 📁 Project Structure

```
personalized-study-coach/
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── api/                # Axios API client layer
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page-level route components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── store/              # Global state management
│   │   ├── utils/              # Helper utilities
│   │   └── types/              # TypeScript type definitions
│   └── ...
│
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/                # Route handlers (versioned)
│   │   ├── core/               # Settings, security, logging
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   ├── ai/                 # AI & RAG pipeline modules
│   │   └── db/                 # Database setup & migrations
│   └── ...
│
├── docs/                       # Architecture & API documentation
├── docker/                     # Dockerfiles per service
├── docker-compose.yml          # Local development orchestration
└── .gitignore
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- An OpenAI API Key

### 1. Clone & Configure

Step 1:
Copy the example environment file:
```bash
cp .env.example .env
```

Step 2:
Open the newly created `.env` file and fill in the required environment variables.
**CRITICAL**: You must replace the `SECRET_KEY` placeholder with a securely generated key (e.g., run `openssl rand -hex 32`). The backend will crash on startup if an insecure default value is detected.

Step 3:
Run:
```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |

### 3. Manual Setup (without Docker)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the root directory and configure the necessary keys as explained in the comments within the file.

---

## 🗺️ Development Roadmap

- [x] **Phase 0** — Project foundation & architecture
- [ ] **Phase 1** — Authentication (JWT + OAuth)
- [ ] **Phase 2** — Document upload & processing pipeline (OCR, text extraction)
- [ ] **Phase 3** — RAG pipeline (embeddings + ChromaDB)
- [ ] **Phase 4** — Quiz engine (generation + scoring)
- [ ] **Phase 5** — Adaptive learning engine & weak-topic detection
- [ ] **Phase 6** — Dashboard & analytics
- [ ] **Phase 7** — Google Calendar integration
- [ ] **Phase 8** — AWS deployment (EC2 + S3)

---

## 🤝 Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
