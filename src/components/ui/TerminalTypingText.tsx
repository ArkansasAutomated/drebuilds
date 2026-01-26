import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BlinkingCursor } from "./BlinkingCursor";

interface TerminalTypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
}

export const TerminalTypingText = ({
  text,
  speed = 20,
  onComplete,
  className,
  showCursor = true,
}: TerminalTypingTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={cn("font-mono", className)}>
      {displayedText}
      {showCursor && !isComplete && <BlinkingCursor />}
    </span>
  );
};
