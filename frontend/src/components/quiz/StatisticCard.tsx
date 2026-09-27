import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Card, CardContent } from "../ui/Card";
import { cn } from "../../utils/cn";

interface StatisticCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  colorClass?: string;
}

export function StatisticCard({ title, value, icon, trend, colorClass = "bg-primary-100 text-primary-600" }: StatisticCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="overflow-hidden border-surface-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colorClass)}>
              {icon}
            </div>
            {trend && (
              <span className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
          <div>
            <h4 className="text-3xl font-display font-bold text-surface-900">{value}</h4>
            <p className="text-sm font-medium text-surface-500 mt-1">{title}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
