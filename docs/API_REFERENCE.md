# API Reference — Personalized Study Coach

> Base URL: `http://localhost:8000/api/v1`
> All endpoints (except auth) require `Authorization: Bearer <token>` header.

---

## Authentication `/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Get JWT tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/auth/google` | Initiate Google OAuth flow |
| `GET` | `/auth/google/callback` | Handle Google OAuth callback |
| `POST` | `/auth/logout` | Revoke refresh token |

---

## Documents `/documents`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/documents/upload` | Upload a new study material (multipart/form-data) |
| `GET` | `/documents` | List all uploaded documents for the user |
| `GET` | `/documents/{id}` | Get document metadata |
| `DELETE` | `/documents/{id}` | Delete document and its vectors |
| `GET` | `/documents/{id}/status` | Check processing status |

---

## RAG Q&A `/rag`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/rag/ask` | Ask a question against uploaded documents |
| `GET` | `/rag/history` | Get past Q&A history |

### POST /rag/ask — Request Body
```json
{
  "question": "string",
  "document_ids": ["uuid", "..."],   // Optional: scope to specific docs
  "top_k": 5                          // Number of chunks to retrieve
}
```

---

## Quiz Engine `/quiz`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/quiz/generate` | Generate a new quiz from documents |
| `GET` | `/quiz/sessions` | List past quiz sessions |
| `GET` | `/quiz/sessions/{id}` | Get quiz questions |
| `POST` | `/quiz/sessions/{id}/submit` | Submit answers and get scored results |
| `GET` | `/quiz/results` | All quiz results for the user |
| `GET` | `/quiz/results/{id}` | Detailed result with weak topics |

---

## Adaptive Learning `/adaptive`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/adaptive/weak-topics` | Get current weak topic list |
| `POST` | `/adaptive/quiz` | Generate quiz weighted to weak topics |
| `GET` | `/adaptive/progress` | Overall topic mastery scores |

---

## Study Plans `/study-plans`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/study-plans/generate` | AI-generate a personalized study plan |
| `GET` | `/study-plans` | List all study plans |
| `GET` | `/study-plans/{id}` | Get a specific plan with tasks |

---

## Google Calendar `/calendar`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/calendar/auth` | Initiate Calendar OAuth |
| `POST` | `/calendar/sync/{plan_id}` | Push study plan tasks to Google Calendar |
| `DELETE` | `/calendar/sync/{plan_id}` | Remove synced events from calendar |

---

## System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check (no auth required) |
| `GET` | `/` | API info (no auth required) |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/redoc` | ReDoc documentation |
