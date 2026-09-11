"use client";

import { useIncidents } from "@/hooks/useIncidents";
import { useUIStore } from "@/store/ui.store";
import { CATEGORY_LABELS, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import { formatRelative } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";
import { isActiveStatus, type IncidentPriority } from "@/types/incident.types";

const PRIORITY_WEIGHT: Record<IncidentPriority, number> = { critica: 0, alta: 1, media: 2, baja: 3 };

/** Cola de atención del centro de despacho: lo más urgente primero. */
export function IncidentQueue() {
  const { data: incidents, isLoading } = useIncidents();
  const selectedIncidentId = useUIStore((state) => state.selectedIncidentId);
  const setSelectedIncidentId = useUIStore((state) => state.setSelectedIncidentId);

  const queue = (incidents ?? [])
    .filter((incident) => isActiveStatus(incident.status))
    .sort((a, b) => {
      const byPriority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (byPriority !== 0) return byPriority;
      return b.reportedAt.localeCompare(a.reportedAt);
    });

  return (
    <div className="flex h-full flex-col border-r border-border bg-card/40">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cola de atención
        </h2>
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums">
          {queue.length}
        </span>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {isLoading && (
          <li className="space-y-2 p-3">
            {[0, 1, 2].map((key) => <Skeleton key={key} className="h-14" />)}
          </li>
        )}
        {!isLoading && queue.length === 0 && (
          <li className="p-4 text-xs text-muted-foreground">
            Sin incidentes activos. El territorio está despejado.
          </li>
        )}
        {queue.map((incident) => {
          const priority = PRIORITY_CONFIG[incident.priority];
          const status = STATUS_CONFIG[incident.status];
          const selected = selectedIncidentId === incident.id;
          return (
            <li key={incident.id}>
              <button
                type="button"
                onClick={() => setSelectedIncidentId(incident.id)}
                className={`w-full border-l-2 px-3 py-2.5 text-left transition hover:bg-accent/60 ${
                  selected ? "bg-accent" : ""
                }`}
                style={{ borderLeftColor: priority.color }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{incident.code}</span>
                  <span className="text-[10px] text-muted-foreground">{formatRelative(incident.reportedAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium">{CATEGORY_LABELS[incident.category]}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px]">
                  <span className="font-semibold" style={{ color: priority.color }}>
                    {priority.label.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span style={{ color: status.color }}>{status.short}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="truncate text-muted-foreground">{incident.zone}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
