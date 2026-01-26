import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MousePointer, 
  Scroll, 
  Eye, 
  LogOut, 
  Mail, 
  Activity,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/StatusDot";
import { useLiveEvents } from "@/hooks/useConversionPipeline";
import { Skeleton } from "@/components/ui/skeleton";

const eventVariants = {
  initial: { opacity: 0, x: -20, height: 0 },
  animate: {
    opacity: 1,
    x: 0,
    height: "auto",
    transition: { type: "spring" as const, mass: 1, stiffness: 120, damping: 14 },
  },
  exit: { opacity: 0, x: 20, height: 0 },
};

interface EventConfig {
  icon: React.ReactNode;
  colorClass: string;
  label: string;
}

const getEventConfig = (eventType: string): EventConfig => {
  switch (eventType) {
    case "click":
      return {
        icon: <MousePointer size={12} />,
        colorClass: "text-primary",
        label: "CLICK_EVENT",
      };
    case "scroll_milestone":
      return {
        icon: <Scroll size={12} />,
        colorClass: "text-data",
        label: "SCROLL",
      };
    case "section_view":
      return {
        icon: <Eye size={12} />,
        colorClass: "text-success",
        label: "SECTION_VIEW",
      };
    case "exit_intent":
      return {
        icon: <LogOut size={12} />,
        colorClass: "text-destructive",
        label: "EXIT_INTENT",
      };
    case "newsletter_submit":
      return {
        icon: <Mail size={12} />,
        colorClass: "text-success",
        label: "NEWSLETTER",
      };
    default:
      return {
        icon: <Activity size={12} />,
        colorClass: "text-muted-foreground",
        label: eventType.toUpperCase(),
      };
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const LiveEventLog = () => {
  const { data: events, isLoading } = useLiveEvents();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
        <CardHeader className="pb-3">
          <CardTitle className="font-mono text-sm text-primary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">&gt;</span>
              EVENT_LOG
            </div>
            <StatusDot status="busy" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="font-mono text-sm text-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">&gt;</span>
            EVENT_LOG
          </div>
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-success animate-pulse" />
            <span className="text-xs text-success font-mono">LIVE</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-[400px] overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        >
          <AnimatePresence mode="popLayout">
            {(events || []).map((event) => {
              const config = getEventConfig(event.event_type);
              const elementDisplay = event.element_id 
                ? event.element_id.replace(/_/g, ".") 
                : "—";

              return (
                <motion.div
                  key={event.id}
                  variants={eventVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors font-mono text-xs"
                >
                  {/* Timestamp */}
                  <span className="text-muted-foreground shrink-0">
                    [{formatTimestamp(event.created_at || "")}]
                  </span>

                  {/* Event Type */}
                  <span className={`flex items-center gap-1.5 shrink-0 ${config.colorClass}`}>
                    {config.icon}
                    <span>{config.label}:</span>
                  </span>

                  {/* Element ID */}
                  <span className="text-foreground/80 truncate">
                    {elementDisplay}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {(!events || events.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Activity size={24} className="mb-2 opacity-50" />
              <span className="font-mono text-xs">Awaiting events...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
