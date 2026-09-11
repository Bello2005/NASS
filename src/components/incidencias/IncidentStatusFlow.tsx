import { STATUS_CONFIG } from "@/lib/constants";
import type { IncidentStatus } from "@/types/incident.types";
import { cn } from "@/lib/utils";

const FLOW: IncidentStatus[] = ["nueva", "recibida", "asignada", "en_camino", "en_sitio", "atendiendo", "cerrada"];

export function IncidentStatusFlow({ current }: { current: IncidentStatus }) {
  const currentIdx = FLOW.indexOf(current);
  const isCancelled = current === "cancelada";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 py-2">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm text-red-400 font-medium">Cancelada</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {FLOW.map((status, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const config = STATUS_CONFIG[status];
        return (
          <div key={status} className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-full h-1.5 rounded-full transition-colors",
                  isDone ? "bg-primary" : "bg-border"
                )}
                style={isCurrent ? { background: config.color } : undefined}
              />
              <span
                className={cn(
                  "text-xs mt-1 truncate max-w-full text-center",
                  isCurrent ? "text-foreground font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"
                )}
              >
                {config.label}
              </span>
            </div>
            {idx < FLOW.length - 1 && <div className="w-1 h-1 rounded-full bg-border shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}
