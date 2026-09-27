import type { ChatMessage } from "../../types/chat";
import { User } from "lucide-react";
import { SourceList } from "./SourceList";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full animate-slide-up ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex w-full max-w-full md:max-w-[85%] lg:max-w-[90%] rounded-2xl p-5 sm:p-6 ${
          isUser
            ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-sm shadow-md shadow-primary-500/20 ml-auto"
            : "bg-white border border-surface-200 text-surface-800 rounded-tl-sm shadow-card"
        }`}
      >
        <div className={`mr-4 shrink-0 mt-0.5 ${isUser ? "hidden" : "block"}`}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-primary-700 font-bold text-xs sm:text-sm">AI</span>
          </div>
        </div>

        <div className="flex flex-col min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isUser ? "text-primary-100" : "text-surface-500"}`}>
              {isUser ? "You" : "Study Coach"}
            </span>
            <span className={`text-[10px] ml-4 font-medium ${isUser ? "text-primary-200" : "text-surface-400"}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <div className={`text-sm sm:text-base break-words leading-relaxed ${isUser ? "whitespace-pre-wrap font-medium" : "prose prose-sm sm:prose-base prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-a:text-primary-600 hover:prose-a:text-primary-700 prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-800 prose-pre:text-surface-50 prose-pre:border prose-pre:border-surface-200"}`}>
            {isUser ? (
              message.content
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          
          {message.sources && <SourceList sources={message.sources} />}
        </div>

        <div className={`ml-4 shrink-0 mt-0.5 ${isUser ? "block" : "hidden"}`}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-primary-600 border border-primary-100 shadow-sm">
            <User size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
