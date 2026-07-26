import { motion } from "framer-motion";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { StatusDot } from "@/components/ui/StatusDot";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { Sparkles } from "lucide-react";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const AuditHero = () => {
  const scrollToForm = () => {
    const form = document.getElementById("audit-form");
    form?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background layers (matches site aesthetic) */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-noise" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

      <div className="relative z-10 container mx-auto px-6 max-w-4xl">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", ...springConfig, delay: 0.1 }}
        >
          {/* Status pill */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <StatusDot status="available" label="free_audit.open_for_intake" />
          </motion.div>

          {/* Section label */}
          <motion.div
            className="font-mono text-primary glow-amber text-lg mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            &gt;_ ai_automation.audit()
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.35 }}
          >
            Free AI{" "}
            <span className="text-primary glow-amber">Automation Audit</span>
            <BlinkingCursor className="hidden md:inline-block" />
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.45 }}
          >
            We&apos;ll analyze your Arkansas business operations and show you exactly where AI can{" "}
            <span className="text-primary font-mono">save you 10&ndash;20 hours per week.</span>
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.55 }}
          >
            <TextSwapButton
              defaultText="Start My Free Audit"
              hoverText="/exec_audit_form"
              variant="primary"
              size="lg"
              icon={<Sparkles size={20} />}
              onClick={scrollToForm}
            />
          </motion.div>

          {/* Trust strip */}
          <motion.p
            className="mt-8 font-mono text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-primary/60">$</span> 3-step form &middot; no credit card &middot; personalized reply within 48 hours
          </motion.p>
        </motion.div>

        {/* Corner accents (matches site) */}
        <CornerAccent position="tl" size={32} className="opacity-40" />
        <CornerAccent position="tr" size={32} className="opacity-40" />
        <CornerAccent position="bl" size={32} className="opacity-40" />
        <CornerAccent position="br" size={32} className="opacity-40" />
      </div>
    </section>
  );
};