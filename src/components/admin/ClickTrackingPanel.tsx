import { motion } from "framer-motion";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { useClickStats } from "@/hooks/useAdminStats";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const buttonLabels: Record<string, string> = {
  consulting: "consulting",
  community: "community",
  store: "store",
  learn: "learn",
};

export const ClickTrackingPanel = () => {
  const { data: stats, isLoading } = useClickStats();

  const maxClicks = stats ? Math.max(...stats.map(s => s.clicks), 1) : 1;
  const totalClicks = stats ? stats.reduce((sum, s) => sum + s.clicks, 0) : 0;

  const getBarWidth = (clicks: number) => {
    const maxWidth = 20;
    return Math.ceil((clicks / maxClicks) * maxWidth);
  };

  return (
    <motion.div
      className="relative p-6 bg-card border border-border rounded-sm group hover:border-primary/30 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...springConfig, delay: 0.2 }}
    >
      <CornerAccent position="tl" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      <CornerAccent position="br" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />

      <h2 className="font-mono text-sm text-muted-foreground mb-4">
        // CTR_LOGIC_GATES
      </h2>

      {isLoading ? (
        <div className="font-mono text-sm text-primary flex items-center gap-2">
          <span>&gt; fetching_data</span>
          <BlinkingCursor />
        </div>
      ) : (
        <div className="space-y-3">
          {stats?.map((stat) => {
            const barFilled = getBarWidth(stat.clicks);
            const barEmpty = 20 - barFilled;
            
            return (
              <div key={stat.buttonId} className="font-mono text-sm flex items-center gap-3">
                <span className="w-24 text-muted-foreground">
                  {buttonLabels[stat.buttonId]}
                </span>
                <span className="text-primary">{"▓".repeat(barFilled)}</span>
                <span className="text-muted-foreground/30">{"░".repeat(barEmpty)}</span>
                <span className="text-foreground w-16 text-right">
                  {stat.clicks} clicks
                </span>
                <span className="text-muted-foreground w-16 text-right">
                  ({stat.percentage}%)
                </span>
              </div>
            );
          })}

          <div className="pt-3 mt-3 border-t border-border font-mono text-sm">
            <span className="text-muted-foreground">&gt; total_clicks:</span>
            <span className="text-primary ml-2">{totalClicks}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
