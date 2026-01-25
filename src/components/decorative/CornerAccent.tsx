import { cn } from "@/lib/utils";

interface CornerAccentProps {
  position?: "tl" | "tr" | "bl" | "br";
  size?: number;
  className?: string;
}

export const CornerAccent = ({
  position = "tl",
  size = 24,
  className,
}: CornerAccentProps) => {
  const positions = {
    tl: "top-0 left-0",
    tr: "top-0 right-0 rotate-90",
    bl: "bottom-0 left-0 -rotate-90",
    br: "bottom-0 right-0 rotate-180",
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("absolute", positions[position], className)}
      aria-hidden="true"
    >
      <path
        d="M0 0 L24 0 L24 4 L4 4 L4 24 L0 24 Z"
        fill="currentColor"
        className="text-primary"
      />
    </svg>
  );
};
