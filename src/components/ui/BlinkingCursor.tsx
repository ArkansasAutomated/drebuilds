import { cn } from "@/lib/utils";

interface BlinkingCursorProps {
  className?: string;
}

export const BlinkingCursor = ({ className }: BlinkingCursorProps) => {
  return (
    <span
      className={cn(
        "inline-block w-3 h-6 bg-primary cursor-blink glow-amber ml-1",
        className
      )}
      aria-hidden="true"
    />
  );
};
