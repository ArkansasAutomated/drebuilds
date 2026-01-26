import { motion } from "framer-motion";
import { MonitorDot, GitBranch, Mail, CreditCard, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataFlow } from "@/components/decorative/DataFlow";
import { useConversionPipeline } from "@/hooks/useConversionPipeline";
import { Skeleton } from "@/components/ui/skeleton";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const stageVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, mass: 1, stiffness: 120, damping: 14 },
  },
};

interface FunnelStageProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  subLabel?: string;
  className?: string;
}

const FunnelStage = ({ label, value, icon, subLabel, className = "" }: FunnelStageProps) => (
  <motion.div
    variants={stageVariant}
    className={`relative p-4 rounded-md border border-border bg-card/50 backdrop-blur-sm ${className}`}
  >
    <div className="flex items-center gap-3 mb-2">
      <span className="text-primary">{icon}</span>
      <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="font-mono text-2xl text-data glow-cyan">
      {value.toLocaleString()}
    </div>
    {subLabel && (
      <div className="font-mono text-xs text-muted-foreground mt-1">
        {subLabel}
      </div>
    )}
  </motion.div>
);

interface GateCardProps {
  label: string;
  value: number;
  percentage: number;
}

const GateCard = ({ label, value, percentage }: GateCardProps) => (
  <div className="flex-1 p-3 rounded border border-border/50 bg-surface-deep/50">
    <div className="font-mono text-xs text-muted-foreground uppercase mb-1">
      {label}
    </div>
    <div className="font-mono text-xl text-data">
      {value}
    </div>
    <div className="font-mono text-xs text-primary">
      ({percentage.toFixed(1)}%)
    </div>
  </div>
);

export const ConversionFunnel = () => {
  const { data, isLoading } = useConversionPipeline();

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-mono text-sm text-primary flex items-center gap-2">
            <span className="text-muted-foreground">&gt;</span>
            CONVERSION_PIPELINE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalGateClicks = data?.totalLogicGateClicks || 0;
  const consultingPct = totalGateClicks > 0 
    ? (data?.logicGateClicks.consulting || 0) / totalGateClicks * 100 
    : 0;
  const communityPct = totalGateClicks > 0 
    ? (data?.logicGateClicks.community || 0) / totalGateClicks * 100 
    : 0;
  const storePct = totalGateClicks > 0 
    ? (data?.logicGateClicks.store || 0) / totalGateClicks * 100 
    : 0;
  const learnPct = totalGateClicks > 0 
    ? (data?.logicGateClicks.learn || 0) / totalGateClicks * 100 
    : 0;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono text-sm text-primary flex items-center gap-2">
          <span className="text-muted-foreground">&gt;</span>
          CONVERSION_PIPELINE
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Stage 1: Input */}
          <FunnelStage
            label="INPUT: TOTAL_SESSIONS"
            value={data?.totalSessions || 0}
            icon={<MonitorDot size={18} />}
            subLabel="Unique visitor sessions"
          />

          {/* Flow Arrow */}
          <div className="flex justify-center">
            <DataFlow direction="down" className="text-primary/40" />
          </div>

          {/* Stage 2: Processing - Logic Gates */}
          <motion.div variants={stageVariant} className="space-y-3">
            <div className="flex items-center gap-3 px-4">
              <GitBranch size={18} className="text-primary" />
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                PROCESSING: LOGIC_GATES
              </span>
              <span className="font-mono text-xs text-data ml-auto">
                {totalGateClicks} total
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 px-2">
              <GateCard 
                label="CONSULTING" 
                value={data?.logicGateClicks.consulting || 0}
                percentage={consultingPct}
              />
              <GateCard 
                label="COMMUNITY" 
                value={data?.logicGateClicks.community || 0}
                percentage={communityPct}
              />
              <GateCard 
                label="STORE" 
                value={data?.logicGateClicks.store || 0}
                percentage={storePct}
              />
              <GateCard 
                label="LEARN" 
                value={data?.logicGateClicks.learn || 0}
                percentage={learnPct}
              />
            </div>

            <div className="text-center font-mono text-xs text-muted-foreground">
              Session → Click Rate: <span className="text-data">{data?.sessionToClickRate || 0}%</span>
            </div>
          </motion.div>

          {/* Flow Arrow */}
          <div className="flex justify-center">
            <DataFlow direction="down" className="text-primary/40" />
          </div>

          {/* Stage 3: Output - Conversions */}
          <motion.div variants={stageVariant} className="space-y-3">
            <div className="flex items-center gap-3 px-4">
              <Users size={18} className="text-primary" />
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                OUTPUT: CONVERSIONS
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 px-2">
              <div className="p-4 rounded border border-success/30 bg-success/5">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={16} className="text-success" />
                  <span className="font-mono text-xs text-muted-foreground uppercase">
                    NEWSLETTER
                  </span>
                </div>
                <div className="font-mono text-2xl text-success">
                  {data?.newsletterSignups || 0}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {data?.clickToSignupRate || 0}% conversion
                </div>
              </div>
              
              <div className="p-4 rounded border border-data/30 bg-data/5">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={16} className="text-data" />
                  <span className="font-mono text-xs text-muted-foreground uppercase">
                    STRIPE
                  </span>
                </div>
                <div className="font-mono text-2xl text-data">
                  {data?.stripeRedirects || 0}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  Store redirects
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
};
