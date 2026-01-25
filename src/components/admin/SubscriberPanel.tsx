import { motion } from "framer-motion";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { useSubscriberStats } from "@/hooks/useAdminStats";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { TrendingUp, TrendingDown } from "lucide-react";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const SubscriberPanel = () => {
  const { data: stats, isLoading } = useSubscriberStats();

  const maxBarWidth = 20;
  const barFilled = stats ? Math.min(Math.ceil((stats.total / 500) * maxBarWidth), maxBarWidth) : 0;
  const barEmpty = maxBarWidth - barFilled;

  return (
    <motion.div
      className="relative p-6 bg-card border border-border rounded-sm group hover:border-primary/30 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...springConfig, delay: 0.1 }}
    >
      <CornerAccent position="tl" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      <CornerAccent position="br" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />

      <h2 className="font-mono text-sm text-muted-foreground mb-4">
        // SUBSCRIBER_COUNT
      </h2>

      {isLoading ? (
        <div className="font-mono text-sm text-primary flex items-center gap-2">
          <span>&gt; fetching_data</span>
          <BlinkingCursor />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="font-mono text-lg">
            <span className="text-primary">{"▓".repeat(barFilled)}</span>
            <span className="text-muted-foreground/30">{"░".repeat(barEmpty)}</span>
            <span className="ml-3 text-foreground">{stats?.total}</span>
            <span className="text-muted-foreground ml-2">total</span>
          </div>

          {/* Stats Grid */}
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">&gt; today:</span>
              <span className="text-success">+{stats?.today}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">&gt; this_week:</span>
              <span className="text-success">+{stats?.thisWeek}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">&gt; growth:</span>
              <span className={stats?.growthPercent && stats.growthPercent >= 0 ? "text-success" : "text-destructive"}>
                {stats?.growthPercent && stats.growthPercent >= 0 ? (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{stats.growthPercent}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    {stats?.growthPercent}%
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
