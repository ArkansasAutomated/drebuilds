import { useRef, useEffect } from "react";
import { motion, useScroll, useVelocity, useSpring, useTransform } from "framer-motion";

interface ScrollReactiveGridProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollReactiveGrid = ({ children, className = "" }: ScrollReactiveGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });

  // Transform velocity to opacity (0.03 base to 0.15 max)
  const gridOpacity = useTransform(
    smoothVelocity,
    [-1000, 0, 1000],
    [0.15, 0.03, 0.15]
  );

  // Transform velocity to amber intensity (0 base to 1 max)
  const amberIntensity = useTransform(
    smoothVelocity,
    [-1000, -200, 0, 200, 1000],
    [1, 0.5, 0, 0.5, 1]
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Base grid layer */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      
      {/* Reactive amber grid overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(45 100% 50% / var(--grid-opacity)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(45 100% 50% / var(--grid-opacity)) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: amberIntensity,
          // @ts-ignore - CSS custom property
          "--grid-opacity": gridOpacity,
        }}
      />

      {/* Glow effect on fast scroll */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, hsl(45 100% 50% / 0.05) 0%, transparent 70%)`,
          opacity: amberIntensity,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
