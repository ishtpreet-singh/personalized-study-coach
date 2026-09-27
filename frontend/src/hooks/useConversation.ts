import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { chatApi } from "../api/chat";
import { conversationApi, type ConversationSummary } from "../api/conversations";
import type { ChatMessage } from "../types/chat";

export function useConversation(subjectId?: string) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all conversations on mount
  const fetchConversations = useCallback(async () => {
    try {
      const data = await conversationApi.listConversations(subjectId);
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Select a conversation and load its messages
  const selectConversation = useCallback(async (id: string | null) => {
    setActiveId(id);
    setError(null);
    
    if (!id) {
      setMessages([]);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const data = await conversationApi.getConversation(id);
      
      // Map backend messages to frontend ChatMessage format
      const loadedMessages: ChatMessage[] = data.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at),
        // sources aren't stored in DB in this phase to keep it simple, 
        // but can be parsed if we saved them. We'll leave them empty for history.
      }));
      setMessages(loadedMessages);
    } catch (err) {
      console.error("Failed to load conversation messages:", err);
      setError("Failed to load conversation history.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    setError(null);

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
      // Use activeId for the API call (undefined if new chat)
      const currentConversationId = activeId || undefined;
      let newConversationId: string | null = null;

      try {
        for await (const payload of chatApi.streamMessage(userMessage.content, currentConversationId, subjectId)) {
          if (payload.type === "conversation_id") {
            newConversationId = payload.data;
            if (!activeId) {
              setActiveId(payload.data);
            }
          } else if (payload.type === "sources") {
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === assistantId ? { ...msg, sources: payload.data } : msg
              )
            );
          } else if (payload.type === "chunk") {
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === assistantId ? { ...msg, content: msg.content + payload.data } : msg
              )
            );
          }
        }
      } catch (streamErr) {
        console.warn("Streaming failed, falling back to standard fetch...", streamErr);
        const result = await chatApi.sendMessage(userMessage.content, currentConversationId, subjectId);
        newConversationId = result.conversation_id;
        if (!activeId) {
            setActiveId(result.conversation_id);
        }
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantId ? { ...msg, content: result.answer, sources: result.sources } : msg
          )
        );
      }

      // If this was a new conversation, refresh the sidebar list to show the auto-title
      if (!currentConversationId && newConversationId) {
        fetchConversations();
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to get a response from the AI tutor.";
      setError(errorMessage);
      console.error("Chat error:", err);
    } finally {
      setIsSending(false);
    }
  }, [activeId, fetchConversations, subjectId]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await conversationApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        selectConversation(null);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  }, [activeId, selectConversation]);

  const renameConversation = useCallback(async (id: string, newTitle: string) => {
    try {
      const updated = await conversationApi.renameConversation(id, newTitle);
      setConversations((prev) => prev.map((c) => c.id === id ? updated : c));
    } catch (err) {
      console.error("Failed to rename conversation", err);
    }
  }, []);

  return {
    conversations,
    activeId,
    messages,
    isLoadingHistory,
    isSending,
    error,
    selectConversation,
    sendMessage,
    deleteConversation,
    renameConversation,
    createNew: () => selectConversation(null)
  };
}
