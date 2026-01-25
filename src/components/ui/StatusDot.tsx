import { cn } from "@/lib/utils";

interface StatusDotProps {
  status?: "available" | "busy" | "offline" | "online" | "warning";
  label?: string;
  className?: string;
}

export const StatusDot = ({ 
  status = "available", 
  label,
  className 
}: StatusDotProps) => {
  const statusColors = {
    available: "bg-success",
    online: "bg-success",
    busy: "bg-primary",
    warning: "bg-primary",
    offline: "bg-muted-foreground",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-block w-2 h-2 rounded-full status-pulse",
          statusColors[status]
        )}
      />
      {label && (
        <span className="font-mono text-xs text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
};
