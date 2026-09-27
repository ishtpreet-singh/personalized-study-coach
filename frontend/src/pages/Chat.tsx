import { ChatWindow } from "../components/chat/ChatWindow";
import { ConversationSidebar } from "../components/chat/ConversationSidebar";
import { useConversation } from "../hooks/useConversation";
import { useOutletContext } from "react-router-dom";
import type { Subject } from "../types/subject";
import { BrainCircuit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { profileApi, type LearningProfileSummary } from "../api/profile";
import { useState, useEffect } from "react";

export default function Chat() {
  const { subject, subjectId } = useOutletContext<{ subject: Subject, subjectId: string }>();
  const [profile, setProfile] = useState<LearningProfileSummary | null>(null);

  useEffect(() => {
    profileApi.getSummary(subjectId).then(setProfile).catch(console.error);
  }, [subjectId]);

  const {
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
  } = useConversation(subjectId);

  return (
    <div className="flex-1 flex w-full h-full bg-white overflow-hidden">
      <ConversationSidebar 
        conversations={conversations} 
        activeId={activeId} 
        onSelect={selectConversation} 
        onDelete={deleteConversation}
        onRename={renameConversation}
      />
      <div className="flex-1 min-w-0 bg-surface-50 relative flex flex-col h-full">
        {/* AI Learning Summary Header */}
        <div className="bg-white border-b border-surface-200 px-6 py-4 shadow-sm shrink-0 flex flex-col gap-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-${subject.color || 'primary'}-50 flex items-center justify-center`}>
                <BrainCircuit className={`w-5 h-5 text-${subject.color || 'primary'}-600`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-0.5">Currently Studying</p>
                <h3 className="font-bold text-surface-900">{subject.name}</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {profile ? (
                <>
                  <div className="text-right">
                    <p className="text-xs text-surface-500 mb-0.5">Overall Mastery</p>
                    <p className="font-bold text-surface-900">{profile.overallMastery}%</p>
                  </div>
                  <div className="w-px h-8 bg-surface-200" />
                  <div>
                    <p className="text-xs text-surface-500 mb-0.5">Weak Topics</p>
                    <p className="font-medium text-orange-600 text-sm">{profile.weakTopics.join(', ') || 'None'}</p>
                  </div>
                  <div className="w-px h-8 bg-surface-200" />
                  <div>
                    <p className="text-xs text-surface-500 mb-0.5">Strong Topics</p>
                    <p className="font-medium text-emerald-600 text-sm">{profile.strongTopics.join(', ') || 'None'}</p>
                  </div>
                </>
              ) : (
                <div className="h-8 w-48 bg-surface-100 animate-pulse rounded" />
              )}
              <div className="w-px h-8 bg-surface-200" />
              <div className="text-right">
                <p className="text-xs text-surface-500 mb-0.5">Last Revision</p>
                <p className="font-medium text-surface-900 text-sm">{formatDistanceToNow(new Date(subject.updated_at))} ago</p>
              </div>
            </div>
          </div>
          
          <div className="bg-primary-50 rounded-lg px-4 py-2 border border-primary-100 flex items-center gap-2">
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">AI Recommendation:</span>
            <span className="text-sm font-medium text-primary-900">
              {profile ? `"${profile.aiRecommendation}"` : <span className="inline-block w-64 h-4 bg-primary-100 animate-pulse rounded ml-2 align-middle" />}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <ChatWindow 
            messages={messages} 
            isLoading={isSending || isLoadingHistory} 
            error={error} 
            sendMessage={sendMessage} 
          />
        </div>
      </div>
    </div>
  );
}
