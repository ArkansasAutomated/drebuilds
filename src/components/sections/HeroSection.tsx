import { motion } from "framer-motion";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { StatusDot } from "@/components/ui/StatusDot";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { ArrowRight, ClipboardCheck, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const HeroSection = () => {
  const navigate = useNavigate();
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
            &gt;_ arkansas.automation.init()
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.3 }}
          >
            Automate Your
            <br />
            <span className="text-primary glow-amber">Arkansas Business.</span>
            <BlinkingCursor className="hidden md:inline-block" />
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.4 }}
          >
            Save time, reduce overhead, and scale without adding more repetitive work.
          </motion.p>

          {/* Status Indicator */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <StatusDot status="available" label="Accepting automation audits" />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", ...springConfig, delay: 0.6 }}
          >
            <TextSwapButton
              defaultText="Get Your Free Audit"
              hoverText="run audit()"
              variant="primary"
              size="lg"
              icon={<ClipboardCheck size={20} />}
              onClick={() => navigate("/audit")}
            />
            <TextSwapButton
              defaultText="Call Dre"
              hoverText="dial 479-221-0524"
              variant="outline"
              size="lg"
              icon={<ArrowRight size={20} />}
              onClick={() => {
                window.location.href = "tel:+14792210524";
              }}
            />
          </motion.div>
        </motion.div>

        {/* Decorative Corners */}
        <CornerAccent position="tl" size={40} className="opacity-40" />
        <CornerAccent position="tr" size={40} className="opacity-40" />
        <CornerAccent position="bl" size={40} className="opacity-40" />
        <CornerAccent position="br" size={40} className="opacity-40" />
      </div>

      {/* Double Chevron Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
          }}
        >
          <ChevronDown className="w-5 h-5 text-primary glow-amber" strokeWidth={2} />
        </motion.div>
        <motion.div
          className="-mt-2"
          animate={{ y: [0, 6, 0] }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
            delay: 0.12,
          }}
        >
          <ChevronDown className="w-5 h-5 text-primary/50" strokeWidth={2} />
        </motion.div>
      </motion.div>
    </section>
  );
};
