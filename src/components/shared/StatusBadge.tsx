import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import type { IncidentStatus } from "@/types/incident.types";

interface StatusBadgeProps {
  status: IncidentStatus;
  className?: string;
}

/** El color viene del token de estado, así un estado nuevo no requiere tocar este archivo. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", className)}
      style={{
        background: `${config.color}1f`,
        color: config.color,
        borderColor: `${config.color}55`,
      }}
    >
      {config.label}
    </span>
  );
}
