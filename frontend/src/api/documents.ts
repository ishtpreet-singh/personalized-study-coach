import apiClient from './client';
import type { Document, DocumentListResponse } from '../types/document';

export const documentApi = {
  uploadDocument: async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<Document>('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  listDocuments: async (skip: number = 0, limit: number = 100): Promise<DocumentListResponse> => {
    const response = await apiClient.get<DocumentListResponse>('/api/v1/documents', {
      params: { skip, limit },
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
};
