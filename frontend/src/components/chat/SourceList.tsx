import type { Source } from "../../types/chat";
import { FileText } from "lucide-react";

interface SourceListProps {
  sources: Source[];
}

export function SourceList({ sources }: SourceListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-surface-100 flex flex-col gap-2">
      <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Sources</span>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <div
            key={`${source.filename}-${source.page || index}`}
            className="flex items-center gap-2.5 p-2 pr-3 bg-white border border-surface-200 rounded-lg shadow-sm hover:shadow-card hover:-translate-y-0.5 hover:border-primary-300 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-md bg-primary-50 flex items-center justify-center text-primary-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
              <FileText size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-surface-900 truncate max-w-[160px]" title={source.filename}>
                {source.filename}
              </span>
              {source.page && (
                <span className="text-[10px] text-surface-500 font-medium">
                  Page {source.page}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
