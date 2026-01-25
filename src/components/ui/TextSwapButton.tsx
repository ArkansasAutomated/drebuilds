import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextSwapButtonProps {
  defaultText: string;
  hoverText: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: React.ReactNode;
}

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export const TextSwapButton = ({
  defaultText,
  hoverText,
  onClick,
  variant = "primary",
  size = "md",
  className,
  icon,
}: TextSwapButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-glow",
    secondary: "bg-secondary text-secondary-foreground hover:bg-surface-overlay",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      className={cn(
        "relative overflow-hidden font-mono font-medium transition-colors",
        "rounded-sm glow-amber-box",
        variants[variant],
        sizes[size],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative h-6 overflow-hidden flex items-center justify-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        <AnimatePresence mode="wait">
          {!isHovered ? (
            <motion.span
              key="default"
              initial={{ y: 0 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ type: "spring", ...springConfig }}
              className="block whitespace-nowrap"
            >
              {defaultText}
            </motion.span>
          ) : (
            <motion.span
              key="hover"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", ...springConfig }}
              className="block whitespace-nowrap text-xs"
            >
              {hoverText}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};
