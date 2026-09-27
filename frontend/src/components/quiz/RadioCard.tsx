import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface RadioCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

export function RadioCard({ title, description, icon, selected, onClick, className, disabled = false }: RadioCardProps & { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex w-full flex-col text-left p-4 rounded-2xl border-2 transition-all duration-200 outline-none",
        disabled ? "opacity-50 cursor-not-allowed border-surface-200 bg-surface-50 grayscale-[0.5]" : "focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        !disabled && selected 
          ? "border-primary-500 bg-primary-50/50" 
          : !disabled ? "border-surface-200 bg-white hover:border-primary-200 hover:bg-surface-50" : "",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            selected ? "bg-primary-100 text-primary-600" : "bg-surface-100 text-surface-500"
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h4 className={cn(
            "text-sm font-bold",
            selected ? "text-primary-900" : "text-surface-900"
          )}>
            {title}
          </h4>
          {description && (
            <p className={cn(
              "text-xs mt-1 leading-relaxed",
              selected ? "text-primary-700/80" : "text-surface-500"
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
      
      {/* Selection indicator ring */}
      {selected && (
        <motion.div 
          layoutId="radio-indicator"
          className="absolute -right-2 -top-2 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-sm"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </motion.div>
      )}
    </button>
  );
}
