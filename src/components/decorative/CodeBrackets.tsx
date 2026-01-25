import { cn } from "@/lib/utils";

interface CodeBracketsProps {
  className?: string;
  size?: number;
}

export const CodeBrackets = ({ className, size = 120 }: CodeBracketsProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={cn("text-primary/10", className)}
      aria-hidden="true"
    >
      <text
        x="10"
        y="80"
        fontFamily="JetBrains Mono, monospace"
        fontSize="80"
        fontWeight="700"
        fill="currentColor"
      >
        &lt;/&gt;
      </text>
    </svg>
  );
};
