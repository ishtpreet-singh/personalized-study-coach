import apiClient from './client';
import type { Document, DocumentListResponse } from '../types/document';

export const documentApi = {
  uploadDocument: async (file: File, subjectId: string): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', subjectId);
    
    const response = await apiClient.post<Document>('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  listDocuments: async (skip: number = 0, limit: number = 100, subjectId?: string): Promise<DocumentListResponse> => {
    const response = await apiClient.get<DocumentListResponse>('/api/v1/documents', {
      params: { skip, limit, subject_id: subjectId },
    });
    return response.data;
  },

  getDocument: async (id: string): Promise<Document> => {
    const response = await apiClient.get<Document>(`/api/v1/documents/${id}`);
    return response.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/documents/${id}`);
  },

  retryDocument: async (id: string) => {
    const response = await apiClient.post(`/api/v1/documents/${id}/retry`);
    return response.data;
  },
};
