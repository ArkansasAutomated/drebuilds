import { motion } from "framer-motion";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { StatusDot } from "@/components/ui/StatusDot";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const SystemStatusPanel = () => {
  const uptime = "99.9%";
  const currentTime = new Date().toLocaleTimeString("en-US", { 
    hour12: false, 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  return (
    <motion.div
      className="relative p-6 bg-card border border-border rounded-sm group hover:border-primary/30 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...springConfig }}
    >
      <CornerAccent position="tl" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      <CornerAccent position="br" size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl text-foreground">
            &gt; SYSTEM_MONITOR
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            // ADMIN_PANEL
          </p>
        </div>

        <div className="flex items-center gap-6 font-mono text-sm">
          <div className="flex items-center gap-2">
            <StatusDot status="online" />
            <span className="text-success">ONLINE</span>
          </div>
          <div className="text-muted-foreground">
            uptime: <span className="text-foreground">{uptime}</span>
          </div>
          <div className="text-muted-foreground">
            time: <span className="text-primary">{currentTime}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
