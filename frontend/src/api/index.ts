/**
 * API Service Modules — Placeholder stubs
 *
 * Each module will encapsulate all API calls for one domain feature.
 * They wrap the central apiClient and return typed responses.
 *
 * Files to create per phase:
 *   auth.ts       → login, register, refresh token, Google OAuth
 *   documents.ts  → upload, list, delete documents
 *   rag.ts        → ask question, get answer with sources
 *   quiz.ts       → generate quiz, submit answers, get results
 *   adaptive.ts   → get weak topics, personalized quiz
 *   studyPlan.ts  → generate plan, sync with Google Calendar
 */

export * from "./auth";
export * from "./documents";
export * from "./quizzes";
export * from "./chat";
export * from "./conversations";
export * from "./support";
export * from "./subjects";
