import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "inherit";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-2xl md:rounded-full border border-surface-200 shadow-card hover:shadow-card-hover focus-within:shadow-glow-primary focus-within:border-primary-300 transition-all duration-300 flex items-end gap-2 p-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask a question about your study materials..."
          className="flex-1 max-h-[200px] bg-transparent py-3 px-4 outline-none resize-none overflow-y-auto text-sm md:text-base disabled:opacity-50 min-h-[48px] rounded-2xl md:rounded-full text-surface-900 placeholder:text-surface-400"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="h-10 w-10 md:h-12 md:w-12 mb-0.5 mr-0.5 flex-shrink-0 flex items-center justify-center bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:bg-surface-200 disabled:text-surface-400 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <Send size={18} className="md:w-5 md:h-5 ml-0.5" />
        </button>
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] text-surface-400">
          AI Tutor can make mistakes. Check important info.
        </span>
      </div>
    </div>
  );
}
