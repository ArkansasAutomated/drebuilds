import { motion } from "framer-motion";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { StatusDot } from "@/components/ui/StatusDot";
import { CheckCircle2, Calendar } from "lucide-react";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

interface AuditSuccessProps {
  onReset: () => void;
}

export const AuditSuccess = ({ onReset }: AuditSuccessProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-24">
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-noise" />

      <div className="relative z-10 container mx-auto px-6 max-w-3xl">
        <motion.div
          className="relative p-8 md:p-12 bg-card border border-border rounded-sm text-center"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", ...springConfig }}
        >
          <CornerAccent position="tl" size={32} />
          <CornerAccent position="tr" size={32} />
          <CornerAccent position="bl" size={32} />
          <CornerAccent position="br" size={32} />

          {/* Status indicator */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <StatusDot status="available" label="audit.queued ✓" />
          </motion.div>

          {/* Icon */}
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-success/10 border border-success/30 rounded-sm mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.2 }}
          >
            <CheckCircle2 className="w-10 h-10 text-success" />
          </motion.div>

          {/* Prompt */}
          <motion.p
            className="font-mono text-primary glow-amber text-lg mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            &gt; audit.lead.received()
            <BlinkingCursor className="align-middle" />
          </motion.p>

          {/* Headline */}
          <motion.h1
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.45 }}
          >
            We&apos;ll send your personalized{" "}
            <span className="text-primary glow-amber">AI Automation Audit</span>{" "}
            within <span className="text-success">48 hours.</span>
          </motion.h1>

          <motion.p
            className="text-muted-foreground mb-10 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Check your inbox for next steps. Want to skip the wait and talk
            through your operations live? Book a call below.
          </motion.p>

          {/* Book a call CTA */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.75 }}
          >
            <TextSwapButton
              defaultText="Book a Call Now"
              hoverText="cal.com/drebuilds"
              variant="primary"
              size="lg"
              icon={<Calendar size={18} />}
              onClick={() =>
                window.open("https://cal.com/drebuilds", "_blank", "noopener,noreferrer")
              }
            />
            <TextSwapButton
              defaultText="Submit Another"
              hoverText="reset_form()"
              variant="outline"
              size="lg"
              onClick={onReset}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};