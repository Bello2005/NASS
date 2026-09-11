"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PanicButton } from "@/components/ciudadano/PanicButton";
import { ReportSheet } from "@/components/ciudadano/ReportSheet";
import { ActiveAlertCard } from "@/components/ciudadano/ActiveAlertCard";
import { AlertHistory } from "@/components/ciudadano/AlertHistory";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRealtime } from "@/hooks/useRealtime";
import { useSession } from "@/hooks/useSession";
import { isActiveStatus } from "@/types/incident.types";

const CitizenMap = dynamic(
  () => import("@/components/ciudadano/CitizenMap").then((m) => ({ default: m.CitizenMap })),
  { ssr: false, loading: () => <Skeleton className="size-full rounded-none" /> },
);

/** Cada cuánto se comparte la ubicación mientras la emergencia está activa. */
const LOCATION_PUSH_MS = 15_000;

export default function CiudadanoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: sessionLoading } = useSession();
  const geo = useGeolocation({ watch: true });
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"inicio" | "alertas">("inicio");

  useEffect(() => {
    if (!sessionLoading && !user) router.replace("/entrar");
  }, [sessionLoading, user, router]);

  useEffect(() => {
    geo.start();
    // Solo al montar: el navegador pide el permiso una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const incidentsQuery = useQuery({
    queryKey: ["mis-incidentes"],
    queryFn: () => api.listIncidents(),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const incidents = incidentsQuery.data?.incidents ?? [];
  const activeIncident = useMemo(
    () => incidents.find((incident) => isActiveStatus(incident.status)),
    [incidents],
  );

  const detailQuery = useQuery({
    queryKey: ["mi-incidente", activeIncident?.id],
    queryFn: () => api.getIncident(activeIncident!.id),
    enabled: !!activeIncident,
    refetchInterval: 10_000,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["mis-incidentes"] });
    if (activeIncident) void queryClient.invalidateQueries({ queryKey: ["mi-incidente", activeIncident.id] });
  }, [queryClient, activeIncident]);

  useRealtime((event) => {
    if (event.type === "unit.location.updated" && detailQuery.data?.unit?.id !== event.unit.id) return;
    refresh();
    if (event.type === "incident.assigned" && event.incident.reportedByUserId === user?.id) {
      toast.success(`Unidad ${event.unit.callsign} asignada a tu emergencia`);
    }
  }, !!user);

  // Compartir ubicación periódicamente mientras hay emergencia activa.
  useEffect(() => {
    if (!activeIncident) return;
    const id = setInterval(async () => {
      try {
        const position = await geo.getOnce();
        await api.shareLocation(activeIncident.id, position.coords.latitude, position.coords.longitude);
      } catch {
        // Sin señal: se reintenta en el siguiente ciclo sin molestar al usuario.
      }
    }, LOCATION_PUSH_MS);
    return () => clearInterval(id);
  }, [activeIncident, geo]);

  async function triggerPanic() {
    setSending(true);
    try {
      let lat = geo.lat;
      let lng = geo.lng;
      let accuracy = geo.accuracy;
      try {
        const position = await geo.getOnce();
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        accuracy = Math.round(position.coords.accuracy);
      } catch {
        // Se usa la última ubicación conocida si el GPS tarda.
      }
      if (lat === undefined || lng === undefined) {
        toast.error("Necesitamos tu ubicación para enviar la alerta. Autoriza el permiso e intenta de nuevo.");
        return;
      }

      const { incident } = await api.createIncident({
        lat, lng, accuracy,
        category: "otro",
        source: "panico",
        title: "Botón de pánico activado",
        priority: "critica",
      });
      toast.success(`Alerta ${incident.code} enviada al centro de atención`);
      refresh();
      setTab("inicio");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo enviar la alerta");
    } finally {
      setSending(false);
    }
  }

  if (sessionLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  const locationLabel =
    geo.status === "activa"
      // Algunos dispositivos no reportan precisión: mejor omitirla que mostrar "0 m".
      ? geo.accuracy
        ? `Ubicación activa · precisión ${geo.accuracy} m`
        : "Ubicación activa"
      : geo.status === "denegada"
        ? "Permiso de ubicación denegado"
        : geo.status === "solicitando"
          ? "Obteniendo ubicación…"
          : "Ubicación sin autorizar";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-red-600/15 ring-1 ring-red-600/40">
            <span className="text-lg font-bold tracking-tighter text-red-500">N</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">NASS Ciudadano</p>
            <h1 className="text-lg font-semibold leading-tight">
              Hola, {user.name.split(" ")[0]}
            </h1>
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

      <button
        type="button"
        onClick={() => geo.start()}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left"
      >
        <span
          className={`size-2 rounded-full ${
            geo.status === "activa" ? "bg-emerald-500" : geo.status === "denegada" ? "bg-red-500" : "bg-yellow-500"
          }`}
        />
        <span className="flex-1 text-xs text-muted-foreground">{locationLabel}</span>
        {geo.status !== "activa" && <span className="text-xs text-sky-400">Compartir ubicación</span>}
      </button>

      <div className="flex gap-1 rounded-xl bg-muted/40 p-1 text-sm">
        {([["inicio", "Inicio"], ["alertas", "Mis alertas"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition ${
              tab === key ? "bg-background text-foreground" : "text-muted-foreground"
            }`}
          >
            {label}
            {key === "alertas" && incidents.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">{incidents.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "alertas" ? (
        <AlertHistory incidents={incidents} loading={incidentsQuery.isLoading} />
      ) : (
        <>
          <div className="h-44 overflow-hidden rounded-2xl border border-border">
            <CitizenMap
              position={geo.lat !== undefined && geo.lng !== undefined ? { lat: geo.lat, lng: geo.lng } : undefined}
              accuracy={geo.accuracy}
              unit={detailQuery.data?.unit ?? null}
              emergencyActive={!!activeIncident}
            />
          </div>

          {activeIncident ? (
            <ActiveAlertCard
              detail={detailQuery.data}
              incident={activeIncident}
              currentUserId={user.id}
              onChanged={refresh}
            />
          ) : (
            <>
              <div className="flex justify-center py-4">
                <PanicButton onTrigger={triggerPanic} sending={sending} />
              </div>
              <ReportSheet
                getLocation={geo.getOnce}
                fallback={geo.lat !== undefined && geo.lng !== undefined ? { lat: geo.lat, lng: geo.lng } : undefined}
                onCreated={refresh}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
