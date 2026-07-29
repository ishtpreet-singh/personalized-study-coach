# Development Roadmap — Personalized Study Coach

## Phase 0 — Foundation ✅
**Goal**: Establish clean project structure and development environment.
- [x] Monorepo folder structure
- [x] Docker Compose (PostgreSQL, ChromaDB, pgAdmin, frontend, backend)
- [x] FastAPI app factory with CORS, lifecycle hooks
- [x] Async SQLAlchemy + Alembic migration setup
- [x] Pydantic Settings (type-safe env vars)
- [x] React + Vite + Tailwind CSS + React Router + Axios + React Query
- [x] TypeScript domain types
- [x] Architecture and API documentation

---

## Phase 1 — Authentication
**Goal**: Secure user accounts with JWT and Google OAuth.

### Backend
- [ ] `User` SQLAlchemy model + Alembic migration
- [ ] Password hashing with bcrypt
- [ ] JWT access + refresh token generation
- [ ] `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` endpoints
- [ ] Google OAuth2 integration (via httpx + google-auth)

### Frontend
- [ ] Login page (email/password + Google button)
- [ ] Register page
- [ ] `useAuth` custom hook
- [ ] Protected route component
- [ ] Auth token persistence in localStorage

---

## Phase 2 — Document Upload & Processing
**Goal**: Let users upload study materials and extract text for AI use.

### Backend
- [ ] `Document` SQLAlchemy model + migration
- [ ] File type validation (PDF, DOCX, PPTX, images)
- [ ] AWS S3 upload service
- [ ] Text extraction pipeline:
  - [ ] PDF → pypdf
  - [ ] DOCX → python-docx
  - [ ] PPTX → python-pptx
  - [ ] Images/handwriting → Tesseract OCR
- [ ] Background task queue (FastAPI BackgroundTasks or Celery)
- [ ] Document processing status tracking

### Frontend
- [ ] Upload page with drag-and-drop (react-dropzone)
- [ ] File type icons and progress indicator
- [ ] Document list with processing status
- [ ] Delete document confirmation dialog

---

## Phase 3 — RAG Pipeline
**Goal**: Enable AI-powered Q&A from uploaded documents.

### Backend
- [ ] Text chunking (LangChain RecursiveCharacterTextSplitter)
- [ ] Embedding generation (OpenAI text-embedding-3-small)
- [ ] ChromaDB collection management (per user)
- [ ] RetrievalQA chain assembly (LangChain)
- [ ] `/rag/ask` endpoint with streaming support
- [ ] Q&A history persistence

### Frontend
- [ ] Chat-style Q&A interface
- [ ] Document selector (scope to specific docs)
- [ ] Source citations shown below answers
- [ ] Chat history sidebar

---

## Phase 4 — Quiz Engine
**Goal**: Auto-generate quizzes from study materials and score them.

### Backend
- [ ] Quiz generation prompt (LangChain LLMChain)
- [ ] `QuizSession`, `QuizQuestion`, `QuizResult` models + migrations
- [ ] Answer scoring logic
- [ ] Weak topic extraction from wrong answers
- [ ] Quiz CRUD endpoints

### Frontend
- [ ] Quiz generation form (select docs, difficulty, count)
- [ ] Question renderer (MCQ, True/False, short answer)
- [ ] Timer per question
- [ ] Results page with score breakdown

---

## Phase 5 — Adaptive Learning Engine
**Goal**: Personalize future quizzes based on student performance.

### Backend
- [ ] Weak topic weighting algorithm
- [ ] Adaptive quiz generation endpoint
- [ ] Topic mastery score calculation
- [ ] `/adaptive/weak-topics` and `/adaptive/progress` endpoints

### Frontend
- [ ] Weak topics visualization (Recharts radar chart)
- [ ] "Adaptive Quiz" button on dashboard
- [ ] Progress over time (line chart)

---

## Phase 6 — Dashboard & Analytics
**Goal**: Give students a bird's-eye view of their progress.

### Frontend
- [ ] Main dashboard layout (sidebar navigation)
- [ ] Stats cards (total docs, quizzes taken, avg score, study streak)
- [ ] Performance trend chart (Recharts LineChart)
- [ ] Topic breakdown chart (Recharts BarChart)
- [ ] Recent activity feed

---

## Phase 7 — Google Calendar Integration
**Goal**: Sync AI-generated study plans with the student's Google Calendar.

### Backend
- [ ] AI study plan generation (LLM)
- [ ] `StudyPlan`, `StudyTask` models + migrations
- [ ] Google Calendar API client (google-api-python-client)
- [ ] `/calendar/sync` endpoint

### Frontend
- [ ] Study plan view (timeline/list)
- [ ] "Sync to Google Calendar" button
- [ ] Calendar OAuth consent screen handling

---

## Phase 8 — Production Deployment
**Goal**: Deploy to AWS, configure for production.

- [ ] Production Docker Compose (no pgAdmin, production uvicorn settings)
- [ ] EC2 setup and deployment scripts
- [ ] S3 bucket + IAM policy configuration
- [ ] Nginx reverse proxy config
- [ ] SSL/TLS with Let's Encrypt
- [ ] Environment-specific settings
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring setup (CloudWatch or Sentry)
