import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, X } from "lucide-react";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const navLinks = [
  { label: "~/home", href: "#hero", command: "cd ~/" },
  { label: "~/outcomes", href: "#outcomes", command: "cat ./outcomes" },
  { label: "~/services", href: "#services", command: "ls ./services" },
  { label: "~/process", href: "#process", command: "run ./process" },
  { label: "~/arkansas", href: "#arkansas", command: "ls ./arkansas" },
  { label: "~/newsletter", href: "#newsletter", command: "subscribe --log" },
];

export const MobileCommandCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-sm flex items-center justify-center glow-amber-box md:hidden"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", ...springConfig }}
          >
            <Terminal className="w-6 h-6 text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/90 backdrop-blur-lg"
              onClick={() => setIsOpen(false)}
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(20px)" }}
              exit={{ backdropFilter: "blur(0px)" }}
            />

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center px-8">
              {/* Terminal Header */}
              <motion.div
                className="font-mono text-muted-foreground text-sm mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                $ ls ./navigation
              </motion.div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-4 w-full max-w-xs">
                {navLinks.map((link, index) => (
                  <motion.button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="group relative text-left"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.15 + index * 0.08,
                      type: "spring",
                      ...springConfig 
                    }}
                  >
                    <div className="flex items-center gap-3 py-3 px-4 bg-card/50 border border-border rounded-sm transition-all hover:border-primary hover:bg-primary/10">
                      <span className="text-primary font-mono">&gt;</span>
                      <span className="font-mono text-lg text-foreground group-hover:text-primary transition-colors">
                        {hoveredIndex === index ? link.command : link.label}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </nav>

              {/* Close Button */}
              <motion.button
                onClick={() => setIsOpen(false)}
                className="mt-12 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-mono text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <X className="w-4 h-4" />
                <span>close --terminal</span>
                <BlinkingCursor />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
