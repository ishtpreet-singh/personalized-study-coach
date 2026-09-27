import client from "./client";
import type { Subject, SubjectCreate, SubjectUpdate, AILearningProfile } from "../types/subject";

export const subjectsApi = {
  // Get all subjects
  getSubjects: async (): Promise<Subject[]> => {
    const { data } = await client.get<{ items: Subject[]; total: number }>("/api/v1/subjects");
    return data.items;
  },

  // Get a single subject
  getSubject: async (id: string): Promise<Subject> => {
    const { data } = await client.get<Subject>(`/api/v1/subjects/${id}`);
    return data;
  },

  // Create a subject
  createSubject: async (subject: SubjectCreate): Promise<Subject> => {
    const { data } = await client.post<Subject>("/api/v1/subjects", subject);
    return data;
  },

  // Update a subject
  updateSubject: async (id: string, subject: SubjectUpdate): Promise<Subject> => {
    const { data } = await client.patch<Subject>(`/api/v1/subjects/${id}`, subject);
    return data;
  },

  // Delete a subject
  deleteSubject: async (id: string): Promise<void> => {
    await client.delete(`/api/v1/subjects/${id}`);
  },

  // Get Learning Profile for a subject
  getLearningProfile: async (subjectId: string): Promise<AILearningProfile | null> => {
    const { data } = await client.get<AILearningProfile | null>(`/api/v1/subjects/${subjectId}/learning-profile`);
    return data;
  }
};
