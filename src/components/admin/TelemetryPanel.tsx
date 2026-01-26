import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { Zap, Eye, MousePointer, ScrollText, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TelemetryEvent {
  id: string;
  event_type: string;
  element_id: string | null;
  metadata: unknown;
  created_at: string;
}

const eventTypeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  click: { icon: <MousePointer size={12} />, color: "text-primary" },
  scroll_milestone: { icon: <ScrollText size={12} />, color: "text-data" },
  section_view: { icon: <Eye size={12} />, color: "text-success" },
  exit_intent: { icon: <ArrowUpRight size={12} />, color: "text-destructive" },
  default: { icon: <Zap size={12} />, color: "text-muted-foreground" },
};

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const TelemetryPanel = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["admin", "telemetry-events"],
    queryFn: async (): Promise<TelemetryEvent[]> => {
      const { data, error } = await supabase
        .from("telemetry_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  const getEventConfig = (eventType: string) => {
    return eventTypeConfig[eventType] || eventTypeConfig.default;
  };

  return (
    <motion.div
      className="relative p-6 bg-card border border-border rounded-sm group hover:border-data/30 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...springConfig }}
    >
      <CornerAccent position="tl" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      <CornerAccent position="br" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-sm text-foreground">
          &gt; TELEMETRY_STREAM
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-data animate-pulse" />
          <span className="font-mono text-xs text-data">LIVE</span>
        </div>
      </div>

      {/* Event List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="font-mono text-xs text-muted-foreground">
            Loading telemetry data...
          </div>
        ) : events && events.length > 0 ? (
          events.map((event, index) => {
            const config = getEventConfig(event.event_type);
            return (
              <motion.div
                key={event.id}
                className="flex items-center gap-3 py-2 px-3 bg-muted/30 rounded-sm font-mono text-xs"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <span className={config.color}>{config.icon}</span>
                <span className="text-foreground min-w-[100px]">
                  {event.event_type}
                </span>
                <span className="text-muted-foreground flex-1 truncate">
                  {event.element_id || "—"}
                </span>
                <span className="text-muted-foreground/60">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </span>
              </motion.div>
            );
          })
        ) : (
          <div className="font-mono text-xs text-muted-foreground py-4 text-center">
            No telemetry events recorded yet
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          // Last 20 events
        </span>
        <span className="font-mono text-xs text-data">
          {events?.length || 0} events
        </span>
      </div>
    </motion.div>
  );
};
