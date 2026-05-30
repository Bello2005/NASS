"use client";

import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SeverityDot } from "@/components/shared/SeverityDot";
import { IncidentTimeline } from "@/components/incidencias/IncidentTimeline";
import { useUIStore } from "@/store/ui.store";
import { useIncident } from "@/hooks/useIncidents";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDateTime, formatRelative } from "@/lib/date";

export function IncidentDetailPanel() {
  const { selectedIncidentId, setSelectedIncidentId } = useUIStore();
  const { data: incident } = useIncident(selectedIncidentId ?? "");

  return (
    <Sheet open={!!selectedIncidentId} onOpenChange={(open) => !open && setSelectedIncidentId(null)}>
      <SheetContent className="w-96 bg-card border-border overflow-y-auto p-0">
        {incident ? (
          <>
            <SheetHeader className="p-5 pb-4 border-b border-border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-muted-foreground mb-1">{incident.id}</p>
                  <SheetTitle className="text-sm font-semibold text-foreground leading-snug">{incident.title}</SheetTitle>
                </div>
                <button onClick={() => setSelectedIncidentId(null)} className="text-muted-foreground hover:text-foreground mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <SeverityDot severity={incident.severity} showLabel />
                <StatusBadge status={incident.status} />
              </div>
            </SheetHeader>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Zona</p>
                  <p className="text-sm text-foreground">{incident.zone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Tipo</p>
                  <p className="text-sm text-foreground">{CATEGORY_LABELS[incident.category]}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Dirección</p>
                  <p className="text-sm text-foreground">{incident.address}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Reportada</p>
                  <p className="text-sm text-foreground">{formatRelative(incident.reportedAt)}</p>
                </div>
                {incident.assignedAgentId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Agente</p>
                    <p className="text-sm text-foreground">{incident.assignedAgentId}</p>
                  </div>
                )}
              </div>

              {incident.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{incident.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-3">Historial reciente</p>
                <IncidentTimeline events={incident.timeline.slice(-3)} />
              </div>

              <Link href={`/incidencias/${incident.id}`}>
                <Button variant="outline" size="sm" className="w-full gap-2 border-border">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver detalle completo
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Selecciona una incidencia</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
