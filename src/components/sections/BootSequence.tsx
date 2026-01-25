import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootSequenceProps {
  onComplete: () => void;
  duration?: number;
}

const bootMessages = [
  "> Initializing Dre_Builds_Core...",
  "> Loading agentic systems...",
  "> Compiling automation workflows...",
  "> Boot complete.",
];

export const BootSequence = ({ onComplete, duration = 1500 }: BootSequenceProps) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const messageInterval = duration / bootMessages.length;
    
    const timer = setInterval(() => {
      setCurrentMessage((prev) => {
        if (prev >= bootMessages.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(onComplete, 300);
          }, 200);
          return prev;
        }
        return prev + 1;
      });
    }, messageInterval);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Architectural Grid Background */}
          <div className="absolute inset-0 bg-grid opacity-50" />
          
          {/* Logo SVG Path Animation */}
          <motion.div
            className="relative mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <svg
              width="400"
              height="60"
              viewBox="0 0 520 80"
              className="max-w-[90vw]"
            >
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <motion.text
                x="10"
                y="55"
                fontFamily="JetBrains Mono, Courier New, monospace"
                fontSize="48"
                fontWeight="700"
                fill="hsl(43, 85%, 45%)"
                filter="url(#glow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                &gt; DRE_BUILDS_
              </motion.text>
              {/* Animated underline */}
              <motion.rect
                x="10"
                y="62"
                height="3"
                fill="hsl(43, 85%, 45%)"
                initial={{ width: 0 }}
                animate={{ width: 380 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </svg>
          </motion.div>

          {/* Boot Messages */}
          <div className="flex flex-col items-start gap-2 font-mono text-sm text-muted-foreground max-w-[90vw]">
            {bootMessages.slice(0, currentMessage + 1).map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={
                  index === bootMessages.length - 1 && currentMessage === bootMessages.length - 1
                    ? "text-success"
                    : ""
                }
              >
                {message}
                {index === currentMessage && (
                  <motion.span
                    className="inline-block w-2 h-4 bg-primary ml-1 cursor-blink"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Loading Bar */}
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 h-1 bg-surface-overlay rounded overflow-hidden"
          >
            <motion.div
              className="h-full bg-primary glow-amber-box"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: duration / 1000, ease: "easeOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
