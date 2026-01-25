import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { StatusDot } from "@/components/ui/StatusDot";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { TerminalConfetti } from "@/components/effects/TerminalConfetti";
import { useNewsletterSubscription } from "@/hooks/useNewsletterSubscription";
import { Mail } from "lucide-react";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 0, y: 0 });
  const formRef = useRef<HTMLFormElement>(null);
  const { subscribe, status, message, reset } = useNewsletterSubscription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Get form position for confetti origin
    if (formRef.current) {
      const rect = formRef.current.getBoundingClientRect();
      setConfettiOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }

    const result = await subscribe(email);
    
    if (result.status === "success") {
      setShowConfetti(true);
      setEmail("");
      // Reset confetti after animation
      setTimeout(() => setShowConfetti(false), 2500);
    }
  };

  const handleTryAgain = () => {
    reset();
    setEmail("");
  };

  return (
    <section className="relative py-24 md:py-32 bg-surface-elevated/30">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      <div className="container mx-auto px-6 max-w-3xl relative z-10">
        {/* Section Label */}
        <motion.div
          className="section-label mb-4"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          // ALPHA_CHANNEL
        </motion.div>

        {/* Content Card */}
        <motion.div
          className="relative p-8 md:p-12 bg-card border border-border rounded-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", ...springConfig }}
        >
          {/* Corner Accents */}
          <CornerAccent position="tl" size={28} />
          <CornerAccent position="br" size={28} />

          <div className="text-center">
            {/* Icon */}
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-sm mb-6"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", ...springConfig, delay: 0.2 }}
            >
              <Mail className="w-8 h-8 text-primary" />
            </motion.div>

            {/* Header */}
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Test the <span className="text-primary glow-amber">Waters</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Get exclusive builds, automation breakdowns, and early access to new systems. 
              No spam, just signal.
            </p>

            {/* Confetti Effect */}
            <TerminalConfetti 
              isActive={showConfetti} 
              originX={confettiOrigin.x} 
              originY={confettiOrigin.y} 
            />

            {/* Form */}
            {status === "idle" || status === "loading" ? (
              <form 
                ref={formRef}
                onSubmit={handleSubmit} 
                className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              >
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={status === "loading"}
                    className="w-full px-4 py-3 bg-background border-2 border-primary/50 rounded-sm font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:glow-amber-box transition-all disabled:opacity-50"
                  />
                </div>
                <TextSwapButton
                  defaultText={status === "loading" ? "Processing..." : "Subscribe to the Log"}
                  hoverText={status === "loading" ? "writing_to_db..." : "write_to_stdout"}
                  variant="primary"
                  size="md"
                  type="submit"
                />
              </form>
            ) : status === "success" ? (
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", ...springConfig }}
              >
                <StatusDot status="available" />
                <p className="font-mono text-primary">
                  {message}
                </p>
                <p className="text-sm text-muted-foreground">
                  Welcome to the build log. Check your inbox.
                </p>
              </motion.div>
            ) : status === "duplicate" ? (
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", ...springConfig }}
              >
                <StatusDot status="busy" />
                <p className="font-mono text-primary">
                  {message}
                </p>
                <p className="text-sm text-muted-foreground">
                  You're already on the list. Stay tuned.
                </p>
                <button
                  onClick={handleTryAgain}
                  className="text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
                >
                  &gt; try_another_email<BlinkingCursor />
                </button>
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", ...springConfig }}
              >
                <StatusDot status="offline" />
                <p className="font-mono text-destructive">
                  {message}
                </p>
                <p className="text-sm text-muted-foreground">
                  Something went wrong. Please try again.
                </p>
                <button
                  onClick={handleTryAgain}
                  className="text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
                >
                  &gt; retry_connection<BlinkingCursor />
                </button>
              </motion.div>
            )}

            {/* Privacy Note */}
            <p className="mt-6 text-xs text-muted-foreground">
              <span className="font-mono text-primary/60">$</span> We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
