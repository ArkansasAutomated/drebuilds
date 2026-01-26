import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StatusDot } from "@/components/ui/StatusDot";
import { Database, Clock, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useDatabaseStats = () => {
  return useQuery({
    queryKey: ["admin", "db-stats"],
    queryFn: async () => {
      const tables = ["subscribers", "button_clicks", "content_items", "offer_settings", "telemetry_events"] as const;
      
      const counts = await Promise.all(
        tables.map(async (table) => {
          const { count } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true });
          return { table, count: count || 0 };
        })
      );
      
      return {
        total: counts.reduce((sum, t) => sum + t.count, 0),
        byTable: counts
      };
    },
    refetchInterval: 30000,
  });
};

export const HUDBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { data: dbStats, isLoading: isLoadingStats } = useDatabaseStats();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="fixed top-0 left-16 right-0 h-12 bg-card/80 backdrop-blur-sm border-b border-border z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: System Label */}
        <div className="flex items-center gap-4">
          <motion.h1 
            className="font-mono text-sm text-primary glow-amber"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            &gt; COMMAND_CENTER
          </motion.h1>
          
          <div className="h-4 w-px bg-border" />
          
          {/* Status */}
          <div className="flex items-center gap-2">
            <StatusDot status="online" />
            <span className="font-mono text-xs text-success">ONLINE</span>
          </div>
        </div>

        {/* Right: Metrics */}
        <div className="flex items-center gap-6">
          {/* Activity Indicator */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity size={14} className="text-data" />
            <span className="font-mono text-xs">ACTIVE</span>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Clock */}
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            <span className="font-mono text-xs text-foreground tabular-nums">
              {formattedTime}
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Database Stats */}
          <div className="flex items-center gap-2">
            <Database size={14} className="text-data" />
            <span className="font-mono text-xs text-muted-foreground">ROWS:</span>
            <motion.span 
              className="font-mono text-xs text-data glow-cyan tabular-nums"
              key={dbStats?.total}
              initial={{ opacity: 0.5, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {isLoadingStats ? "---" : dbStats?.total.toLocaleString()}
            </motion.span>
          </div>
        </div>
      </div>
    </header>
  );
};
