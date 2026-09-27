import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Button } from "../ui/Button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-surface-50 border border-surface-200"
    >
      <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold text-surface-900 mb-3">{title}</h3>
      <p className="text-surface-600 max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg" className="px-8 shadow-glow-primary">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
