/**
 * Global TypeScript Types — Personalized Study Coach
 *
 * Shared domain types used across pages, components, and API layers.
 * Add to this file as new features are implemented.
 */

// ── Authentication ─────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

// ── Documents ─────────────────────────────────────────────────
export type DocumentType = "pdf" | "docx" | "pptx" | "image" | "handwriting";

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_type: DocumentType;
  s3_key: string;
  size_bytes: number;
  status: "processing" | "ready" | "failed";
  created_at: string;
}

// ── Quiz ───────────────────────────────────────────────────────
export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];          // For multiple choice
  correct_answer: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizSession {
  id: string;
  user_id: string;
  document_ids: string[];
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizResult {
  id: string;
  session_id: string;
  user_id: string;
  score: number;               // 0–100
  total_questions: number;
  correct_answers: number;
  weak_topics: string[];
  completed_at: string;
}

// ── Study Plan ─────────────────────────────────────────────────
export interface StudyTask {
  id: string;
  title: string;
  topic: string;
  duration_minutes: number;
  scheduled_at: string;
  calendar_event_id?: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  tasks: StudyTask[];
  generated_at: string;
}

// ── API Response Envelope ──────────────────────────────────────
export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
