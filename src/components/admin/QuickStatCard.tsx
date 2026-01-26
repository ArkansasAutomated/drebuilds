import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStatCardProps {
  label: string;
  value: number | string;
  trend?: string;
  icon?: React.ReactNode;
}

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const QuickStatCard = ({ label, value, trend, icon }: QuickStatCardProps) => {
  const getTrendInfo = () => {
    if (!trend) return null;
    
    const isPositive = trend.startsWith("+");
    const isNegative = trend.startsWith("-");
    
    return {
      icon: isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />,
      color: isPositive ? "text-success" : isNegative ? "text-destructive" : "text-muted-foreground",
    };
  };

  const trendInfo = getTrendInfo();

  return (
    <motion.div
      className="p-4 bg-card border border-border rounded-sm hover:border-data/30 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...springConfig }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="font-mono text-2xl text-data glow-cyan tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      
      {trend && trendInfo && (
        <div className={cn("flex items-center gap-1 mt-2", trendInfo.color)}>
          {trendInfo.icon}
          <span className="font-mono text-xs">{trend}</span>
          <span className="font-mono text-xs text-muted-foreground ml-1">vs last week</span>
        </div>
      )}
    </motion.div>
  );
};
