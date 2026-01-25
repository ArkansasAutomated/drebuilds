import { motion } from "framer-motion";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { StatusDot } from "@/components/ui/StatusDot";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { ArrowRight, Code2 } from "lucide-react";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Multi-layer Background */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-noise" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-6 py-24 max-w-5xl">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", ...springConfig, delay: 0.2 }}
        >
          {/* Terminal Prompt */}
          <motion.div
            className="font-mono text-primary glow-amber text-lg mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            &gt;_ system.architect.init()
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.3 }}
          >
            Building the Future,
            <br />
            <span className="text-primary glow-amber">One Agent at a Time.</span>
            <BlinkingCursor className="hidden md:inline-block" />
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.4 }}
          >
            Software Developer. Automation Educator. Architect of Agentic Workflows.
            <br className="hidden md:block" />
            Transforming business logic into intelligent systems that scale.
          </motion.p>

          {/* Status Indicator */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <StatusDot status="available" label="Available for architecture" />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.6 }}
          >
            <TextSwapButton
              defaultText="View My Builds"
              hoverText="/exec_portfolio"
              variant="primary"
              size="lg"
              icon={<Code2 size={20} />}
            />
            <TextSwapButton
              defaultText="Hire for Architecture"
              hoverText="sudo hire --dre"
              variant="outline"
              size="lg"
              icon={<ArrowRight size={20} />}
            />
          </motion.div>
        </motion.div>

        {/* Decorative Corners */}
        <CornerAccent position="tl" size={40} className="opacity-40" />
        <CornerAccent position="tr" size={40} className="opacity-40" />
        <CornerAccent position="bl" size={40} className="opacity-40" />
        <CornerAccent position="br" size={40} className="opacity-40" />
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ 
          opacity: { delay: 1 },
          y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
        }}
      >
        <div className="w-6 h-10 border-2 border-primary/40 rounded-full flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 bg-primary rounded-full"
            animate={{ y: [0, 16, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
};
