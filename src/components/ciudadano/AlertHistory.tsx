"use client";

import { BellOff } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_LABELS, STATUS_CONFIG } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import type { Incident } from "@/types/incident.types";

export function AlertHistory({ incidents, loading }: { incidents: Incident[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((key) => <Skeleton key={key} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  if (incidents.length === 0) {
    return <EmptyState icon={BellOff} title="Sin alertas" description="Cuando generes una alerta aparecerá aquí tu historial." />;
  }

  return (
    <ul className="space-y-2">
      {incidents.map((incident) => {
        const status = STATUS_CONFIG[incident.status];
        return (
          <li key={incident.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">{incident.code}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: `${status.color}22`, color: status.color }}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium">{CATEGORY_LABELS[incident.category]}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(incident.reportedAt)} · {incident.zone}
            </p>
            {incident.source === "panico" && (
              <p className="mt-1 text-[10px] uppercase tracking-wider text-red-400">Botón de pánico</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
