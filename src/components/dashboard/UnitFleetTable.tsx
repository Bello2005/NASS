"use client";

import { useUnits } from "@/hooks/useUnits";
import { AVAILABILITY_CONFIG, INSTITUTION_CONFIG } from "@/lib/constants";
import { formatTime } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";

export function UnitFleetTable() {
  const { data: units, isLoading } = useUnits();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-10" />)}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-2 pr-3 font-medium">Indicativo</th>
            <th className="py-2 pr-3 font-medium">Institución</th>
            <th className="py-2 pr-3 font-medium">Estado</th>
            <th className="py-2 pr-3 font-medium">Zona</th>
            <th className="py-2 pr-3 font-medium">Servicio</th>
            <th className="py-2 pr-3 font-medium">Último GPS</th>
          </tr>
        </thead>
        <tbody>
          {(units ?? []).map((unit) => {
            const institution = INSTITUTION_CONFIG[unit.institution];
            const availability = AVAILABILITY_CONFIG[unit.availability];
            return (
              <tr key={unit.id} className="border-b border-border/60 last:border-0">
                <td className="py-2 pr-3 font-mono font-semibold">{unit.callsign}</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center gap-1.5" style={{ color: institution.color }}>
                    {institution.icon} {institution.label}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full" style={{ background: availability.color }} />
                    {availability.label}
                  </span>
                </td>
                <td className="py-2 pr-3 text-muted-foreground">{unit.zone}</td>
                <td className="py-2 pr-3 font-mono text-muted-foreground">
                  {unit.assignedIncidentId ?? "—"}
                </td>
                <td className="py-2 pr-3 text-muted-foreground">{formatTime(unit.lastUpdated)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
