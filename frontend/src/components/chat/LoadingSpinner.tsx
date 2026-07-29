export function LoadingSpinner() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-primary-400 animate-pulse delay-150"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-primary-200 animate-pulse delay-300"></div>
      </div>
      <span className="text-sm font-medium text-surface-500 animate-pulse">
        AI Tutor is thinking...
      </span>
    </div>
  );
}
