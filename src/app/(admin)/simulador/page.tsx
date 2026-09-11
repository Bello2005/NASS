"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import {
  CATEGORY_LABELS, CITIZEN_CATEGORIES, PRIORITY_CONFIG, PRIORITY_LIST, QUIBDO_CENTER, ZONE_COORDS, ZONE_LIST,
} from "@/lib/constants";
import { useUnits } from "@/hooks/useUnits";
import { useRefreshOperations } from "@/hooks/useIncidents";
import type { IncidentCategory, IncidentPriority, QuibdoZone } from "@/types/incident.types";

const PickerMap = dynamic(
  () => import("@/components/simulador/PickerMap").then((m) => ({ default: m.PickerMap })),
  { ssr: false, loading: () => <Skeleton className="size-full rounded-none" /> },
);

/**
 * Simulador de emergencias (§26).
 * Genera incidentes ficticios en cualquier punto del territorio para hacer
 * demostraciones sin depender de un teléfono real en la calle.
 */
export default function SimuladorPage() {
  const [point, setPoint] = useState<{ lat: number; lng: number }>({
    lat: QUIBDO_CENTER[0],
    lng: QUIBDO_CENTER[1],
  });
  const [category, setCategory] = useState<IncidentCategory>("emergencia_medica");
  const [priority, setPriority] = useState<IncidentPriority>("critica");
  const [sending, setSending] = useState(false);
  const { data: units } = useUnits();
  const refresh = useRefreshOperations();

  async function createIncident() {
    setSending(true);
    try {
      const { incident } = await api.createIncident({
        lat: point.lat,
        lng: point.lng,
        accuracy: 10,
        category,
        priority,
        source: "reporte",
        title: `[SIMULACIÓN] ${CATEGORY_LABELS[category]}`,
        description: "Incidente generado desde el simulador NASS para demostración.",
      });
      toast.success(`Incidente ${incident.code} generado`);
      refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo generar el incidente");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <PageHeader
        title="Simulador de emergencias"
        subtitle="Genera incidentes de prueba para demostraciones y entrenamiento"
      />

      <div className="rounded-lg border border-yellow-700/40 bg-yellow-950/20 px-4 py-2.5 text-xs text-yellow-200">
        Los incidentes creados aquí son reales dentro del sistema: aparecen en el mapa, se pueden
        despachar y quedan en la auditoría. Se marcan con el prefijo <b>[SIMULACIÓN]</b>.
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de incidente
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {CITIZEN_CATEGORIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    category === option
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridad</h2>
            <div className="flex gap-2">
              {PRIORITY_LIST.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPriority(option)}
                  className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition"
                  style={
                    priority === option
                      ? { borderColor: PRIORITY_CONFIG[option].color, background: `${PRIORITY_CONFIG[option].color}22`, color: PRIORITY_CONFIG[option].color }
                      : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                  }
                >
                  {PRIORITY_CONFIG[option].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ubicación
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
            </p>
            <p className="text-xs text-muted-foreground">Toca el mapa para mover el punto.</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ZONE_LIST.map((zone: QuibdoZone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setPoint({ lat: ZONE_COORDS[zone][0], lng: ZONE_COORDS[zone][1] })}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={createIncident} disabled={sending}>
            {sending ? "Generando…" : "Generar incidente"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Unidades disponibles ahora:{" "}
            <b className="text-foreground">
              {(units ?? []).filter((unit) => unit.availability === "disponible").length}
            </b>{" "}
            de {(units ?? []).length}. Al despacharlas desde el mapa, el GPS simulado las mueve
            hacia el lugar en tiempo real.
          </p>
        </div>

        <div className="h-[28rem] overflow-hidden rounded-xl border border-border lg:col-span-3">
          <PickerMap point={point} onPick={setPoint} />
        </div>
      </div>
    </div>
  );
}
