"use client";

import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import { useUIStore } from "@/store/ui.store";
import type { IncidentStatus } from "@/types/incident.types";

const FILTERABLE_STATUSES: IncidentStatus[] = ["nueva", "recibida", "asignada", "en_camino", "en_sitio", "atendiendo"];

export function MapFiltersBar() {
  const { mapActiveFilters, setMapActiveFilters } = useUIStore();

  const toggle = (status: IncidentStatus) => {
    if (mapActiveFilters.includes(status)) {
      setMapActiveFilters(mapActiveFilters.filter((s) => s !== status));
    } else {
      setMapActiveFilters([...mapActiveFilters, status]);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-background/80 backdrop-blur border-b border-border flex-wrap">
      <span className="text-xs text-muted-foreground font-medium mr-1">Filtrar:</span>
      {FILTERABLE_STATUSES.map((status) => {
        const active = mapActiveFilters.includes(status);
        const config = STATUS_CONFIG[status];
        return (
          <button
            key={status}
            onClick={() => toggle(status)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all",
              active
                ? "border-transparent text-background"
                : "border-border text-muted-foreground bg-transparent hover:border-border/80"
            )}
            style={active ? { background: config.color } : undefined}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
