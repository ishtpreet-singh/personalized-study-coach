import { apiClient } from "./client";

import type { Source } from "../types/chat";

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export const chatApi = {
  /**
   * Send a question to the AI Tutor
   */
  async sendMessage(question: string, conversationId?: string, subjectId?: string): Promise<{ answer: string; sources: Source[], conversation_id: string }> {
    const response = await apiClient.post<ChatResponse & { conversation_id: string }>("/api/v1/chat", { 
        question, 
        stream: false,
        conversation_id: conversationId,
        subject_id: subjectId
    });
    return {
        answer: response.data.answer,
        sources: response.data.sources || [],
        conversation_id: response.data.conversation_id
    };
  },

  /**
   * Stream a question to the AI Tutor and yield chunks/sources
   */
  async *streamMessage(question: string, conversationId?: string, subjectId?: string): AsyncGenerator<{ type: "sources" | "chunk" | "conversation_id", data: any }, void, unknown> {
    const token = localStorage.getItem("access_token");
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
    
    const response = await fetch(`${baseUrl}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ 
        question, 
        stream: true,
        conversation_id: conversationId,
        subject_id: subjectId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to stream message");
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    // Extract sources and conversation_id from headers
    const sourcesHeader = response.headers.get("X-Sources");
    if (sourcesHeader) {
      try {
        const sources = JSON.parse(sourcesHeader);
        yield { type: "sources", data: sources };
      } catch (e) {
        console.error("Failed to parse sources from header", e);
      }
    }

    const conversationIdHeader = response.headers.get("X-Conversation-Id");
    if (conversationIdHeader) {
      yield { type: "conversation_id", data: conversationIdHeader };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield { type: "chunk", data: decoder.decode(value, { stream: true }) };
      }
    } finally {
      reader.releaseLock();
    }
  },
};
