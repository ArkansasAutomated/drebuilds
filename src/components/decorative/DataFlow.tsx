import { cn } from "@/lib/utils";

interface DataFlowProps {
  className?: string;
  direction?: "right" | "down";
}

export const DataFlow = ({ className, direction = "right" }: DataFlowProps) => {
  if (direction === "down") {
    return (
      <svg
        width="24"
        height="48"
        viewBox="0 0 24 48"
        fill="none"
        className={cn("text-primary/60", className)}
        aria-hidden="true"
      >
        <line
          x1="12"
          y1="0"
          x2="12"
          y2="40"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <polygon points="12,48 6,40 18,40" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      width="48"
      height="24"
      viewBox="0 0 48 24"
      fill="none"
      className={cn("text-primary/60", className)}
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="12"
        x2="40"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      <polygon points="48,12 40,6 40,18" fill="currentColor" />
    </svg>
  );
};
