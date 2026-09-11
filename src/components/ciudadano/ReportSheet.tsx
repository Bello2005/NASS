"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import { CATEGORY_LABELS, CITIZEN_CATEGORIES } from "@/lib/constants";
import type { GeoPoint, IncidentCategory } from "@/types/incident.types";

interface ReportSheetProps {
  getLocation: () => Promise<GeolocationPosition>;
  fallback?: GeoPoint;
  onCreated: () => void;
}

/** Reporte no urgente: el ciudadano elige el tipo y describe la situación. */
export function ReportSheet({ getLocation, fallback, onCreated }: ReportSheetProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!category) {
      toast.error("Elige el tipo de incidente");
      return;
    }
    setSending(true);
    try {
      let point = fallback;
      try {
        const position = await getLocation();
        point = { lat: position.coords.latitude, lng: position.coords.longitude };
      } catch {
        // Se usa la última ubicación conocida.
      }
      if (!point) {
        toast.error("Necesitamos tu ubicación para enviar el reporte");
        return;
      }

      const { incident } = await api.createIncident({
        ...point,
        category,
        source: "reporte",
        title: CATEGORY_LABELS[category],
        description: description.trim() || undefined,
      });
      toast.success(`Reporte ${incident.code} enviado`);
      setOpen(false);
      setCategory(null);
      setDescription("");
      onCreated();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo enviar el reporte");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        Reportar un incidente
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Reportar un incidente</p>
        <button type="button" className="text-xs text-muted-foreground" onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CITIZEN_CATEGORIES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setCategory(option)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              category === option
                ? "border-sky-500 bg-sky-500/15 text-sky-200"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            {CATEGORY_LABELS[option]}
          </button>
        ))}
      </div>

      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Describe brevemente lo que ocurre (opcional)"
        maxLength={1000}
        rows={3}
      />

      <Button className="w-full" onClick={submit} disabled={sending}>
        {sending ? "Enviando…" : "Enviar reporte"}
      </Button>
    </div>
  );
}
