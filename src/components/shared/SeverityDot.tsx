import { cn } from "@/lib/utils";
import { SEVERITY_CONFIG } from "@/lib/constants";
import type { IncidentSeverity } from "@/types/incident.types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SeverityDotProps {
  severity: IncidentSeverity;
  showLabel?: boolean;
  className?: string;
}

const dotColors: Record<IncidentSeverity, string> = {
  1: "bg-green-500",
  2: "bg-yellow-400",
  3: "bg-orange-500",
  4: "bg-red-500",
  5: "bg-red-900",
};

export function SeverityDot({ severity, showLabel = false, className }: SeverityDotProps) {
  const dot = (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("w-2 h-2 rounded-full shrink-0", dotColors[severity])} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{SEVERITY_CONFIG[severity].label}</span>
      )}
    </span>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger className="cursor-default">{dot}</TooltipTrigger>
        <TooltipContent>Gravedad {severity} — {SEVERITY_CONFIG[severity].label}</TooltipContent>
      </Tooltip>
    );
  }
  return dot;
}
