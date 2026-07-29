import { MessageSquarePlus, MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import type { ConversationSummary } from "../../api/conversations";

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onRename,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleEdit = (c: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEdit = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="w-72 bg-surface-50 border-r border-surface-200 flex flex-col h-full">
      <div className="p-4 border-b border-surface-200">
        <button
          onClick={() => onSelect(null)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-sm hover:shadow-md font-medium text-sm"
        >
          <MessageSquarePlus className="w-4 h-4" />
          Start New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-3 mb-2 mt-2">
          History
        </h3>
        {conversations.length === 0 ? (
          <div className="text-center text-sm text-surface-400 py-4 px-2">
            No previous conversations.
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = activeId === c.id;
            const isEditing = editingId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`group flex items-center justify-between px-3 py-3 mb-1 rounded-xl cursor-pointer transition-all ${
                  isActive ? "bg-primary-50 text-primary-900 ring-1 ring-primary-200 shadow-sm" : "hover:bg-surface-100/50 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-primary-100 text-primary-600" : "bg-surface-100 text-surface-400 group-hover:bg-white group-hover:shadow-sm"}`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  
                  {isEditing ? (
                    <form onSubmit={(e) => saveEdit(c.id, e)} className="flex-1 flex items-center gap-1">
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 min-w-0 bg-white border border-primary-300 rounded-md px-2 py-1 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button type="submit" className="text-success-600 p-1 hover:bg-success-50 rounded-md transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={cancelEdit} className="text-danger-600 p-1 hover:bg-danger-50 rounded-md transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex flex-col overflow-hidden w-full">
                      <span className={`text-sm font-medium truncate leading-tight ${isActive ? "text-primary-900" : "text-surface-700"}`}>
                        {c.title}
                      </span>
                      <span className="text-[11px] text-surface-400 font-medium mt-0.5">
                        {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
                
                {!isEditing && (
                  <div className={`flex items-center gap-1 shrink-0 ml-2 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                    <button
                      onClick={(e) => handleEdit(c, e)}
                      className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-white rounded-md transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id);
                      }}
                      className="p-1.5 text-surface-400 hover:text-danger-600 hover:bg-white rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
