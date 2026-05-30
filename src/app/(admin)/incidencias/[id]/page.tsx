"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SeverityDot } from "@/components/shared/SeverityDot";
import { IncidentTimeline } from "@/components/incidencias/IncidentTimeline";
import { IncidentStatusFlow } from "@/components/incidencias/IncidentStatusFlow";
import { useIncident } from "@/hooks/useIncidents";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: incident, isLoading } = useIncident(id);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Incidencia no encontrada.</p>
        <Link href="/incidencias"><Button variant="ghost" className="mt-2">Volver</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/incidencias">
          <Button variant="ghost" size="sm" className="gap-2 mb-3 -ml-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            Incidencias
          </Button>
        </Link>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-muted-foreground mb-1">{incident.id}</p>
            <h1 className="text-xl font-semibold text-foreground">{incident.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SeverityDot severity={incident.severity} showLabel />
            <StatusBadge status={incident.status} />
          </div>
        </div>
      </div>

      {/* Status flow */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Progreso</h2>
        <IncidentStatusFlow current={incident.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Detalles</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Ubicación</p>
                <p className="text-sm text-foreground">{incident.address}</p>
                <p className="text-xs text-muted-foreground">{incident.zone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Tag className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Categoría</p>
                <p className="text-sm text-foreground">{CATEGORY_LABELS[incident.category]}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Reportada</p>
                <p className="text-sm text-foreground">{formatDateTime(incident.reportedAt)}</p>
                {incident.closedAt && (
                  <>
                    <p className="text-xs text-muted-foreground mt-1">Cerrada</p>
                    <p className="text-sm text-foreground">{formatDateTime(incident.closedAt)}</p>
                  </>
                )}
              </div>
            </div>
            {incident.assignedAgentId && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Agente asignado</p>
                  <p className="text-sm text-foreground">{incident.assignedAgentId}</p>
                </div>
              </div>
            )}
          </div>
          {incident.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Descripción</p>
              <p className="text-sm text-foreground leading-relaxed">{incident.description}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            Historial — registro inmutable
          </h2>
          <IncidentTimeline events={incident.timeline} />
        </div>
      </div>
    </div>
  );
}
