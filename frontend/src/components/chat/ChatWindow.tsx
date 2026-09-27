import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types/chat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { LoadingSpinner } from "./LoadingSpinner";
import { AlertCircle } from "lucide-react";

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => void;
}

export function ChatWindow({ messages, isLoading, error, sendMessage }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-surface-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <span className="text-primary-600 font-bold text-sm">AI</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-900 leading-tight">Study Coach AI</h2>
            <p className="text-xs text-surface-500 font-medium">Your personalized learning assistant</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scroll-smooth">
        <div className="max-w-3xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center text-surface-500 space-y-6 animate-fade-in">
              <div className="relative">
                {/* Clean background */}
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg shadow-primary-500/30 relative z-10 transform rotate-3">
                  AI
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-2xl font-bold text-surface-900">How can I help you study?</h3>
                <p className="text-surface-500 text-sm leading-relaxed">
                  I can explain complex topics, test your knowledge, or help you review your course materials.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-24">
              {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
              
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white border border-surface-200 rounded-2xl rounded-tl-sm p-4 shadow-sm animate-fade-in">
                    <LoadingSpinner />
                  </div>
                </div>
              )}
              
              {error && (
                <div className="flex items-center gap-2 p-4 my-4 text-sm text-danger-800 border border-danger-300 rounded-xl bg-danger-50 animate-fade-in shadow-sm">
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="font-medium text-danger-900">Error:</span> {error}
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-surface-50 via-surface-50 to-transparent pt-10 pb-6 px-4 pointer-events-none">
        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
