import apiClient from "./client";

export interface QuizCreate {
  title: string;
  subject_id: string;
  total_questions: number;
  document_id?: string;
  config?: any;
}

export interface QuizAttemptStart {
  mode: "PRACTICE" | "EXAM" | "REVISION";
}

export const quizzesApi = {
  createQuiz: async (data: QuizCreate) => {
    const response = await apiClient.post("/api/v1/quizzes/create", data);
    return response.data;
  },

  getQuizzes: async (skip = 0, limit = 100, subjectId?: string) => {
    const response = await apiClient.get(`/api/v1/quizzes`, {
      params: { skip, limit, subject_id: subjectId }
    });
    return response.data;
  },

  getQuiz: async (id: string) => {
    const response = await apiClient.get(`/api/v1/quizzes/${id}`);
    return response.data;
  },

  startAttempt: async (quizId: string, data: QuizAttemptStart) => {
    const response = await apiClient.post(`/api/v1/quizzes/${quizId}/attempts`, data);
    return response.data;
  },

  getAttempt: async (attemptId: string) => {
    const response = await apiClient.get(`/api/v1/quizzes/attempts/${attemptId}`);
    return response.data;
  },

  submitAttempt: async (attemptId: string, answers: Record<string, string>) => {
    const response = await apiClient.post(`/api/v1/quizzes/attempts/${attemptId}/submit`, { answers });
    return response.data;
  },

  getAttempts: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(`/api/v1/quizzes/attempts?skip=${skip}&limit=${limit}`);
    return response.data;
  }
};
