import { cn } from "@/lib/utils";

interface NodeConnectionProps {
  className?: string;
  vertical?: boolean;
}

export const NodeConnection = ({ className, vertical = false }: NodeConnectionProps) => {
  if (vertical) {
    return (
      <svg
        width="24"
        height="64"
        viewBox="0 0 24 64"
        fill="none"
        className={cn("text-primary/40", className)}
        aria-hidden="true"
      >
        <circle cx="12" cy="4" r="4" fill="currentColor" />
        <line
          x1="12"
          y1="8"
          x2="12"
          y2="56"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <circle cx="12" cy="60" r="4" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      width="64"
      height="24"
      viewBox="0 0 64 24"
      fill="none"
      className={cn("text-primary/40", className)}
      aria-hidden="true"
    >
      <circle cx="4" cy="12" r="4" fill="currentColor" />
      <line
        x1="8"
        y1="12"
        x2="56"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <circle cx="60" cy="12" r="4" fill="currentColor" />
    </svg>
  );
};
