import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

interface TerminalConfettiProps {
  isActive: boolean;
  originX?: number;
  originY?: number;
}

const TERMINAL_CHARS = ["_", ">", "/", "|", "*", "{", "}", "[", "]"];
const PARTICLE_COUNT = 50;
const GRAVITY = 0.3;
const FRICTION = 0.99;

export const TerminalConfetti = ({ 
  isActive, 
  originX = window.innerWidth / 2, 
  originY = window.innerHeight / 2 
}: TerminalConfettiProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Create initial particles
    const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      char: TERMINAL_CHARS[Math.floor(Math.random() * TERMINAL_CHARS.length)],
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * 20,
      vy: -Math.random() * 15 - 5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
    }));

    setParticles(newParticles);

    // Animation loop
    let animationId: number;
    let frame = 0;
    const maxFrames = 120; // ~2 seconds at 60fps

    const animate = () => {
      frame++;
      
      if (frame >= maxFrames) {
        setParticles([]);
        return;
      }

      setParticles(prevParticles =>
        prevParticles.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vx: p.vx * FRICTION,
          vy: p.vy + GRAVITY,
          rotation: p.rotation + p.rotationSpeed,
        }))
      );

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, originX, originY]);

  return (
    <AnimatePresence>
      {particles.map(particle => (
        <motion.span
          key={particle.id}
          className="fixed pointer-events-none font-mono text-primary font-bold z-50 glow-amber"
          style={{
            left: particle.x,
            top: particle.y,
            transform: `rotate(${particle.rotation}deg)`,
            fontSize: `${Math.random() * 12 + 14}px`,
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ 
            opacity: 1 - (particles.length > 0 ? 0 : 1),
            scale: 1,
          }}
          exit={{ opacity: 0 }}
        >
          {particle.char}
        </motion.span>
      ))}
    </AnimatePresence>
  );
};
