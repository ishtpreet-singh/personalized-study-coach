import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface SegmentedControlProps {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (value: any) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn("flex p-1 bg-surface-100 rounded-xl overflow-hidden", className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 py-2 px-3 text-sm font-medium transition-colors outline-none rounded-lg",
              isSelected ? "text-surface-900" : "text-surface-500 hover:text-surface-700 hover:bg-surface-200/50"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId={`segment-${options[0].value}`}
                className="absolute inset-0 bg-white rounded-lg shadow-sm border border-surface-200"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
