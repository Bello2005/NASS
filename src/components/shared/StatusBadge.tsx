import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import type { IncidentStatus } from "@/types/incident.types";

const variantClasses: Record<IncidentStatus, string> = {
  nueva:      "bg-zinc-800 text-zinc-300 border-zinc-700",
  aceptada:   "bg-blue-950 text-blue-300 border-blue-800",
  en_camino:  "bg-yellow-950 text-yellow-300 border-yellow-800",
  atendiendo: "bg-orange-950 text-orange-300 border-orange-800",
  cerrada:    "bg-green-950 text-green-300 border-green-800",
  cancelada:  "bg-red-950 text-red-300 border-red-800",
};

interface StatusBadgeProps {
  status: IncidentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        variantClasses[status],
        className
      )}
    >
      {STATUS_CONFIG[status].label}
    </span>
  );
}
