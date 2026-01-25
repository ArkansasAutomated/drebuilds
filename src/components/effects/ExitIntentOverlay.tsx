import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { markExitIntentShown } from "@/hooks/useExitIntent";

interface ExitIntentOverlayProps {
  isOpen: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

const MESSAGES = [
  "> ALERT: Connection termination detected.",
  "> Before you disconnect, would you like to clone the latest Agentic Blueprint?",
];

const TYPING_SPEED_MS = 40;

export const ExitIntentOverlay = ({
  isOpen,
  onAccept,
  onDismiss,
}: ExitIntentOverlayProps) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>(["", ""]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Reset state when overlay opens
  useEffect(() => {
    if (isOpen) {
      setDisplayedLines(["", ""]);
      setCurrentLine(0);
      setCurrentChar(0);
      setShowButtons(false);
      setIsTypingComplete(false);
    }
  }, [isOpen]);

  // Typewriter effect
  useEffect(() => {
    if (!isOpen || isTypingComplete) return;

    const currentMessage = MESSAGES[currentLine];
    if (!currentMessage) return;

    if (currentChar < currentMessage.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const newLines = [...prev];
          newLines[currentLine] = currentMessage.slice(0, currentChar + 1);
          return newLines;
        });
        setCurrentChar((prev) => prev + 1);
      }, TYPING_SPEED_MS);

      return () => clearTimeout(timer);
    } else if (currentLine < MESSAGES.length - 1) {
      // Move to next line after a brief pause
      const timer = setTimeout(() => {
        setCurrentLine((prev) => prev + 1);
        setCurrentChar(0);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      // Typing complete
      setIsTypingComplete(true);
      const timer = setTimeout(() => {
        setShowButtons(true);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isOpen, currentLine, currentChar, isTypingComplete]);

  const handleAccept = useCallback(() => {
    markExitIntentShown();
    onAccept();
  }, [onAccept]);

  const handleDismiss = useCallback(() => {
    markExitIntentShown();
    onDismiss();
  }, [onDismiss]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDismiss]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const boxVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        mass: 1,
        stiffness: 120,
        damping: 14,
      },
    },
    exit: {
      scale: 0.95,
      opacity: 0,
      transition: { duration: 0.15 },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[10px] bg-background/80"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleDismiss}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
        >
          <motion.div
            className="relative max-w-lg w-full mx-4 p-8 bg-[hsl(var(--background))] border border-primary/30 shadow-[0_0_30px_rgba(212,160,18,0.15)]"
            variants={boxVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner Accents */}
            <CornerAccent position="tl" size={20} />
            <CornerAccent position="tr" size={20} />
            <CornerAccent position="bl" size={20} />
            <CornerAccent position="br" size={20} />

            {/* Terminal Content */}
            <div className="space-y-4 font-mono">
              {/* Line 1 */}
              <p
                id="exit-intent-title"
                className="text-primary text-sm md:text-base leading-relaxed"
              >
                {displayedLines[0]}
                {currentLine === 0 && !isTypingComplete && <BlinkingCursor />}
              </p>

              {/* Line 2 */}
              {displayedLines[1] && (
                <p className="text-foreground/90 text-sm md:text-base leading-relaxed">
                  {displayedLines[1]}
                  {currentLine === 1 && !isTypingComplete && <BlinkingCursor />}
                </p>
              )}
            </div>

            {/* Buttons */}
            <AnimatePresence>
              {showButtons && (
                <motion.div
                  className="flex flex-col sm:flex-row gap-3 mt-8"
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <button
                    onClick={handleAccept}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-mono text-sm font-bold border border-primary hover:bg-primary/90 transition-all duration-200 glow-amber"
                  >
                    [ACCEPT_TRANSFER]
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-6 py-3 bg-transparent text-muted-foreground font-mono text-sm border border-border/50 hover:text-foreground hover:border-border transition-all duration-200"
                  >
                    [DISCONNECT]
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
