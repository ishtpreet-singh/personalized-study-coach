import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { chatApi } from "../api/chat";
import type { ChatMessage } from "../types/chat";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Create empty assistant message placeholder
      const assistantId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Stream the message
        for await (const payload of chatApi.streamMessage(userMessage.content)) {
          if (payload.type === "sources") {
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === assistantId 
                  ? { ...msg, sources: payload.data } 
                  : msg
              )
            );
          } else if (payload.type === "chunk") {
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === assistantId 
                  ? { ...msg, content: msg.content + payload.data } 
                  : msg
              )
            );
          }
        }
      } catch (streamErr) {
        console.warn("Streaming failed or unavailable, falling back to standard fetch...", streamErr);
        try {
            // Fallback to the non-streaming endpoint
            const result = await chatApi.sendMessage(userMessage.content);
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === assistantId 
                  ? { ...msg, content: result.answer, sources: result.sources } 
                  : msg
              )
            );
        } catch (fallbackErr: any) {
            throw fallbackErr;
        }
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to get a response from the AI tutor.";
      setError(errorMessage);
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}
