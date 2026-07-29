import { ChatWindow } from "../components/chat/ChatWindow";
import { ConversationSidebar } from "../components/chat/ConversationSidebar";
import { useConversation } from "../hooks/useConversation";

export default function Chat() {
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
  } = useConversation();

  return (
    <div className="flex-1 flex w-full bg-white overflow-hidden">
      <ConversationSidebar 
        conversations={conversations} 
        activeId={activeId} 
        onSelect={selectConversation} 
        onDelete={deleteConversation}
        onRename={renameConversation}
      />
      <div className="flex-1 min-w-0 bg-surface-50 relative flex flex-col h-full">
        <ChatWindow 
          messages={messages} 
          isLoading={isSending || isLoadingHistory} 
          error={error} 
          sendMessage={sendMessage} 
        />
      </div>
    </div>
  );
}
