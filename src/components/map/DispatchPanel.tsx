"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { IncidentChat } from "@/components/shared/IncidentChat";
import { VoiceCallButton } from "@/components/shared/VoiceCallButton";
import { useIncident, useDispatchUnit, useUpdateIncidentStatus } from "@/hooks/useIncidents";
import { useSession } from "@/hooks/useSession";
import { useUIStore } from "@/store/ui.store";
import {
  AVAILABILITY_CONFIG,
  CATEGORY_LABELS,
  INSTITUTION_CONFIG,
  PRIORITY_CONFIG,
} from "@/lib/constants";
import { formatDateTime, formatTime } from "@/lib/date";
import type { IncidentStatus } from "@/types/incident.types";

const formatDistance = (meters: number) =>
  meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;

/** Acciones de estado disponibles para el operador, en orden operativo. */
const OPERATOR_ACTIONS: Array<{ status: IncidentStatus; label: string; variant?: "default" | "secondary" | "outline" }> = [
  { status: "recibida", label: "Tomar caso" },
  { status: "en_validacion", label: "En validación", variant: "secondary" },
  { status: "atendiendo", label: "En atención", variant: "secondary" },
  { status: "resuelta", label: "Marcar resuelta", variant: "secondary" },
  { status: "cerrada", label: "Cerrar incidente" },
  { status: "cancelada", label: "Cancelar", variant: "outline" },
];

export function DispatchPanel() {
  const selectedIncidentId = useUIStore((state) => state.selectedIncidentId);
  const setSelectedIncidentId = useUIStore((state) => state.setSelectedIncidentId);
  const { user } = useSession();
  const detail = useIncident(selectedIncidentId ?? "");
  const dispatchUnit = useDispatchUnit();
  const updateStatus = useUpdateIncidentStatus();
  const [working, setWorking] = useState(false);

  const incident = detail.data?.incident;
  const unit = detail.data?.unit;
  const availableUnits = detail.data?.availableUnits ?? [];

  async function run(action: () => Promise<unknown>) {
    setWorking(true);
    try {
      await action();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Sheet open={!!selectedIncidentId} onOpenChange={(open) => !open && setSelectedIncidentId(null)}>
      <SheetContent side="right" className="z-1002 w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        {!incident ? (
          <div className="p-6 text-sm text-muted-foreground">
            {detail.isLoading ? "Cargando incidente…" : "Selecciona un incidente en el mapa."}
          </div>
        ) : (
          <>
            <SheetHeader className="border-b border-border p-4">
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: `${PRIORITY_CONFIG[incident.priority].color}22`,
                    color: PRIORITY_CONFIG[incident.priority].color,
                  }}
                >
                  {PRIORITY_CONFIG[incident.priority].label}
                </span>
                <StatusBadge status={incident.status} />
                {incident.source === "panico" && (
                  <span className="rounded bg-red-950 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">
                    BOTÓN DE PÁNICO
                  </span>
                )}
              </div>
              <SheetTitle className="mt-1 font-mono text-base">{incident.code}</SheetTitle>
              <p className="text-sm text-foreground">{incident.title}</p>
            </SheetHeader>

            <div className="space-y-5 p-4">
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Tipo</dt>
                  <dd className="font-medium">{CATEGORY_LABELS[incident.category]}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Reportado</dt>
                  <dd className="font-medium">{formatDateTime(incident.reportedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ciudadano</dt>
                  <dd className="font-medium">{incident.reportedByName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Teléfono</dt>
                  <dd className="font-medium">{incident.reportedByPhone ?? "No registrado"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Ubicación</dt>
                  <dd className="font-medium">{incident.address} · {incident.zone}</dd>
                  <dd className="font-mono text-[11px] text-muted-foreground">
                    {incident.location.lat.toFixed(5)}, {incident.location.lng.toFixed(5)}
                    {incident.accuracy ? ` · ±${incident.accuracy} m` : ""}
                  </dd>
                </div>
              </dl>

              {/* Despacho */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {unit ? "Unidad asignada" : "Unidades disponibles"}
                </h3>

                {unit ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <span
                      className="flex size-9 items-center justify-center rounded-lg text-base"
                      style={{
                        background: `${INSTITUTION_CONFIG[unit.institution].color}22`,
                        color: INSTITUTION_CONFIG[unit.institution].color,
                      }}
                    >
                      {INSTITUTION_CONFIG[unit.institution].icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{unit.callsign}</p>
                      <p className="text-xs text-muted-foreground">
                        {AVAILABILITY_CONFIG[unit.availability].label}
                        {unit.speed ? ` · ${unit.speed} km/h` : ""}
                        {` · GPS ${formatTime(unit.lastUpdated)}`}
                      </p>
                    </div>
                  </div>
                ) : availableUnits.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hay unidades disponibles en este momento.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {availableUnits.map((candidate) => (
                      <li
                        key={candidate.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
                      >
                        <span
                          className="flex size-7 items-center justify-center rounded text-xs"
                          style={{
                            background: `${INSTITUTION_CONFIG[candidate.institution].color}22`,
                            color: INSTITUTION_CONFIG[candidate.institution].color,
                          }}
                        >
                          {INSTITUTION_CONFIG[candidate.institution].icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{candidate.callsign}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {INSTITUTION_CONFIG[candidate.institution].label} · {formatDistance(candidate.distanceMeters)}
                            {candidate.recommended && (
                              <span className="ml-1.5 font-semibold text-emerald-400">Protocolo</span>
                            )}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={working}
                          onClick={() => run(() => dispatchUnit(incident.id, candidate.id))}
                        >
                          Despachar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Estados */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cambiar estado
                </h3>
                <div className="flex flex-wrap gap-2">
                  {OPERATOR_ACTIONS.filter((action) => action.status !== incident.status).map((action) => (
                    <Button
                      key={action.status}
                      size="sm"
                      variant={action.variant ?? "default"}
                      disabled={working}
                      onClick={() =>
                        run(async () => {
                          const done = await updateStatus(incident.id, action.status);
                          if (done) toast.success(`${incident.code} → ${action.label}`);
                        })
                      }
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </section>

              {/* Comunicación */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Comunicación
                  </h3>
                  <VoiceCallButton incidentCode={incident.code} target={incident.reportedByName} />
                </div>
                <IncidentChat
                  incidentId={incident.id}
                  messages={detail.data?.messages ?? []}
                  currentUserId={user?.id ?? ""}
                  counterpartLabel="el ciudadano"
                  onSent={() => detail.refetch()}
                  compact
                />
              </section>

              {/* Trazabilidad */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trazabilidad
                </h3>
                <ol className="space-y-2 border-l border-border pl-3">
                  {incident.timeline.map((event) => (
                    <li key={event.id} className="relative text-xs">
                      <span className="absolute -left-[17px] top-1 size-2 rounded-full bg-muted-foreground" />
                      <p className="font-medium">{event.status.replace(/_/g, " ")}</p>
                      <p className="text-muted-foreground">
                        {formatTime(event.timestamp)} · {event.actorName}
                      </p>
                      {event.note && <p className="text-muted-foreground/80">{event.note}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
