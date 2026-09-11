"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IncidentChat } from "@/components/shared/IncidentChat";
import { api, ApiError } from "@/lib/api";
import { AVAILABILITY_CONFIG, CATEGORY_LABELS, INSTITUTION_CONFIG, PRIORITY_CONFIG } from "@/lib/constants";
import { formatTime } from "@/lib/date";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRealtime } from "@/hooks/useRealtime";
import { useSession } from "@/hooks/useSession";
import { isActiveStatus } from "@/types/incident.types";

/** Cada cuánto la unidad publica su posición real cuando comparte GPS. */
const GPS_PUSH_MS = 5000;

export default function UnidadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, unit, isLoading } = useSession();
  const geo = useGeolocation({ watch: true });
  const [sharingGps, setSharingGps] = useState(false);
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.replace("/entrar");
  }, [isLoading, user, router]);

  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: async () => (await api.listUnits()).units,
    enabled: !!user,
    refetchInterval: 8000,
  });

  const myUnit = useMemo(
    () => unitsQuery.data?.find((item) => item.id === unit?.id) ?? unit ?? null,
    [unitsQuery.data, unit],
  );

  const incidentsQuery = useQuery({
    queryKey: ["unidad-incidentes"],
    queryFn: () => api.listIncidents(),
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const service = incidentsQuery.data?.incidents.find((incident) => isActiveStatus(incident.status));

  const detailQuery = useQuery({
    queryKey: ["unidad-incidente", service?.id],
    queryFn: () => api.getIncident(service!.id),
    enabled: !!service,
    refetchInterval: 8000,
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["unidad-incidentes"] });
    void queryClient.invalidateQueries({ queryKey: ["units"] });
    if (service) void queryClient.invalidateQueries({ queryKey: ["unidad-incidente", service.id] });
  }

  useRealtime(() => refresh(), !!user);

  // Publica la posición real del dispositivo mientras el GPS esté compartido.
  useEffect(() => {
    if (!sharingGps || !myUnit) return;
    const id = setInterval(async () => {
      try {
        const position = await geo.getOnce();
        await api.pushUnitLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : undefined,
          heading: position.coords.heading ?? undefined,
        });
      } catch {
        // Sin señal: se reintenta en el siguiente ciclo.
      }
    }, GPS_PUSH_MS);
    return () => clearInterval(id);
  }, [sharingGps, myUnit, geo]);

  async function act(label: string, action: () => Promise<unknown>) {
    setWorking(true);
    try {
      await action();
      toast.success(label);
      setNote("");
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo completar la acción");
    } finally {
      setWorking(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Cargando…</div>
    );
  }

  if (!myUnit) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-muted-foreground">
          Esta cuenta no tiene una unidad de respuesta asociada.
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            await api.logout();
            router.replace("/entrar");
          }}
        >
          Salir
        </Button>
      </div>
    );
  }

  const institution = INSTITUTION_CONFIG[myUnit.institution];
  const availability = AVAILABILITY_CONFIG[myUnit.availability];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-xl text-lg"
            style={{ background: `${institution.color}22`, color: institution.color }}
          >
            {institution.icon}
          </span>
          <div>
            <p className="font-mono text-sm font-bold">{myUnit.callsign}</p>
            <p className="text-xs text-muted-foreground">{institution.label} · {myUnit.zone}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await api.logout();
            router.replace("/entrar");
          }}
        >
          Salir
        </Button>
      </header>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <span className="flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full" style={{ background: availability.color }} />
          {availability.label}
        </span>
        <Button
          size="sm"
          variant={myUnit.availability === "fuera_servicio" ? "default" : "outline"}
          disabled={working || !!myUnit.assignedIncidentId}
          onClick={() =>
            act(
              myUnit.availability === "fuera_servicio" ? "Unidad disponible" : "Unidad fuera de servicio",
              () =>
                api.setUnitAvailability(
                  myUnit.id,
                  myUnit.availability === "fuera_servicio" ? "disponible" : "fuera_servicio",
                ),
            )
          }
        >
          {myUnit.availability === "fuera_servicio" ? "Activar disponibilidad" : "Fuera de servicio"}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => {
          geo.start();
          setSharingGps((value) => !value);
        }}
        className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left"
      >
        <span className="text-sm">Compartir GPS del dispositivo</span>
        <span className={`text-xs font-semibold ${sharingGps ? "text-emerald-400" : "text-muted-foreground"}`}>
          {sharingGps ? `Activo · ±${geo.accuracy ?? "?"} m` : "Inactivo"}
        </span>
      </button>

      {!service ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm font-medium">Sin servicio asignado</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cuando el centro de despacho te asigne un incidente aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-sky-700/50 bg-sky-950/20 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-sky-400">Servicio asignado</p>
              <p className="font-mono text-lg font-semibold">{service.code}</p>
            </div>
            <span
              className="rounded px-2 py-1 text-[10px] font-bold uppercase"
              style={{
                background: `${PRIORITY_CONFIG[service.priority].color}22`,
                color: PRIORITY_CONFIG[service.priority].color,
              }}
            >
              {PRIORITY_CONFIG[service.priority].label}
            </span>
          </div>

          <dl className="space-y-1 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="font-medium">{CATEGORY_LABELS[service.category]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Dirección</dt>
              <dd className="text-right font-medium">{service.address}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Reportado</dt>
              <dd className="font-medium">{formatTime(service.reportedAt)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Coordenadas</dt>
              <dd className="font-mono">{service.location.lat.toFixed(5)}, {service.location.lng.toFixed(5)}</dd>
            </div>
          </dl>

          <a
            href={`https://www.openstreetmap.org/directions?to=${service.location.lat},${service.location.lng}`}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-border bg-background py-2.5 text-center text-sm font-medium"
          >
            Navegar al lugar
          </a>

          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Novedad (opcional)"
            maxLength={500}
            aria-label="Novedad"
          />

          <div className="grid grid-cols-2 gap-2">
            {myUnit.availability === "despachada" && (
              <Button
                className="col-span-2"
                disabled={working}
                onClick={() => act("Servicio aceptado", () => api.acceptDispatch(myUnit.id))}
              >
                Aceptar servicio
              </Button>
            )}
            {myUnit.availability === "en_camino" && (
              <Button
                className="col-span-2"
                disabled={working}
                onClick={() => act("Llegada reportada", () => api.setIncidentStatus(service.id, "en_sitio", note.trim() || "Unidad en el lugar"))}
              >
                Reportar llegada
              </Button>
            )}
            {service.status === "en_sitio" && (
              <Button
                className="col-span-2"
                disabled={working}
                onClick={() => act("Atención iniciada", () => api.setIncidentStatus(service.id, "atendiendo", note.trim() || undefined))}
              >
                Iniciar atención
              </Button>
            )}
            {service.status === "atendiendo" && (
              <Button
                className="col-span-2"
                disabled={working}
                onClick={() => act("Servicio finalizado", () => api.setIncidentStatus(service.id, "resuelta", note.trim() || "Atención finalizada por la unidad"))}
              >
                Finalizar servicio
              </Button>
            )}
          </div>

          <IncidentChat
            incidentId={service.id}
            messages={detailQuery.data?.messages ?? []}
            currentUserId={user.id}
            counterpartLabel="el centro de despacho"
            onSent={refresh}
            compact
          />
        </div>
      )}
    </div>
  );
}
