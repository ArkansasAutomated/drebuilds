import { cn } from "@/lib/utils";

interface TerminalPromptProps {
  className?: string;
}

export const TerminalPrompt = ({ className }: TerminalPromptProps) => {
  return (
    <span className={cn("font-mono text-primary glow-amber", className)}>
      &gt;_
    </span>
  );
};
