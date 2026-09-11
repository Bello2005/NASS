"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SeverityDot } from "@/components/shared/SeverityDot";
import { IncidentTimeline } from "@/components/incidencias/IncidentTimeline";
import { IncidentStatusFlow } from "@/components/incidencias/IncidentStatusFlow";
import { IncidentChat } from "@/components/shared/IncidentChat";
import { useIncident } from "@/hooks/useIncidents";
import { useSession } from "@/hooks/useSession";
import { CATEGORY_LABELS, INSTITUTION_CONFIG, PRIORITY_CONFIG } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";

const minutesBetween = (from?: string, to?: string) =>
  from && to ? Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 60000)) : undefined;

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, refetch } = useIncident(id);
  const { user } = useSession();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const incident = data?.incident;
  if (!incident) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Incidente no encontrado.</p>
        <Link href="/incidencias"><Button variant="ghost" className="mt-2">Volver</Button></Link>
      </div>
    );
  }

  const unit = data?.unit;
  const responseMin = minutesBetween(incident.reportedAt, incident.acknowledgedAt);
  const arrivalMin = minutesBetween(incident.dispatchedAt, incident.arrivedAt);
  const totalMin = minutesBetween(incident.reportedAt, incident.closedAt);

  return (
    <div className="max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <Link href="/incidencias">
          <Button variant="ghost" size="sm" className="-ml-2 mb-3 gap-2 text-muted-foreground">
            <ArrowLeft className="size-4" /> Incidentes
          </Button>
        </Link>

        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{incident.code}</span>
              <StatusBadge status={incident.status} />
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `${PRIORITY_CONFIG[incident.priority].color}22`,
                  color: PRIORITY_CONFIG[incident.priority].color,
                }}
              >
                {PRIORITY_CONFIG[incident.priority].label}
              </span>
              {incident.source === "panico" && (
                <span className="rounded bg-red-950 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">
                  BOTÓN DE PÁNICO
                </span>
              )}
            </div>
            <h1 className="mt-1 text-xl font-semibold">{incident.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{incident.description}</p>
          </div>
          <SeverityDot severity={incident.severity} showLabel />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <IncidentStatusFlow current={incident.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <dl className="space-y-2 rounded-xl border border-border bg-card p-5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Tipo</dt>
            <dd className="font-medium">{CATEGORY_LABELS[incident.category]}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Ciudadano</dt>
            <dd className="font-medium">{incident.reportedByName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Zona</dt>
            <dd className="font-medium">{incident.zone}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Dirección</dt>
            <dd className="text-right font-medium">{incident.address}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Coordenadas</dt>
            <dd className="font-mono text-xs">
              {incident.location.lat.toFixed(5)}, {incident.location.lng.toFixed(5)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Reportado</dt>
            <dd className="font-medium">{formatDateTime(incident.reportedAt)}</dd>
          </div>
          {incident.closedAt && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Cerrado</dt>
              <dd className="font-medium">{formatDateTime(incident.closedAt)}</dd>
            </div>
          )}
        </dl>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Unidad asignada
            </h2>
            {unit ? (
              <div className="flex items-center gap-3">
                <span
                  className="flex size-9 items-center justify-center rounded-lg text-base"
                  style={{
                    background: `${INSTITUTION_CONFIG[unit.institution].color}22`,
                    color: INSTITUTION_CONFIG[unit.institution].color,
                  }}
                >
                  {INSTITUTION_CONFIG[unit.institution].icon}
                </span>
                <div>
                  <p className="font-mono text-sm font-semibold">{unit.callsign}</p>
                  <p className="text-xs text-muted-foreground">{unit.name}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin unidad asignada</p>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tiempos
            </h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Respuesta</dt>
                <dd className="font-medium tabular-nums">{responseMin !== undefined ? `${responseMin} min` : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Llegada</dt>
                <dd className="font-medium tabular-nums">{arrivalMin !== undefined ? `${arrivalMin} min` : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total del caso</dt>
                <dd className="font-medium tabular-nums">{totalMin !== undefined ? `${totalMin} min` : "En curso"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium">Comunicación del caso</h2>
        <IncidentChat
          incidentId={incident.id}
          messages={data?.messages ?? []}
          currentUserId={user?.id ?? ""}
          counterpartLabel="el ciudadano"
          onSent={() => refetch()}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium">Línea de tiempo</h2>
        <IncidentTimeline events={incident.timeline} />
      </div>
    </div>
  );
}
