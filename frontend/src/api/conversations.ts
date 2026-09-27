import { apiClient } from "./client";

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageResponse {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ConversationResponse extends ConversationSummary {
  messages: MessageResponse[];
}

export const conversationApi = {
  async listConversations(subjectId?: string): Promise<ConversationSummary[]> {
    const response = await apiClient.get<ConversationSummary[]>("/api/v1/conversations", {
      params: { subject_id: subjectId }
    });
    return response.data;
  },

  async getConversation(id: string): Promise<ConversationResponse> {
    const response = await apiClient.get<ConversationResponse>(`/api/v1/conversations/${id}`);
    return response.data;
  },

  async createConversation(subjectId: string): Promise<ConversationSummary> {
    const response = await apiClient.post<ConversationSummary>("/api/v1/conversations", { subject_id: subjectId });
    return response.data;
  },

  async renameConversation(id: string, title: string): Promise<ConversationSummary> {
    const response = await apiClient.patch<ConversationSummary>(`/api/v1/conversations/${id}`, { title });
    return response.data;
  },

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/conversations/${id}`);
  }
};
