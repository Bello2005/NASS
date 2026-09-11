"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IncidentChat } from "@/components/shared/IncidentChat";
import { VoiceCallButton } from "@/components/shared/VoiceCallButton";
import { api, ApiError, type IncidentDetail } from "@/lib/api";
import { INSTITUTION_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import { formatTime } from "@/lib/date";
import type { Incident } from "@/types/incident.types";

interface ActiveAlertCardProps {
  incident: Incident;
  detail?: IncidentDetail;
  currentUserId: string;
  onChanged: () => void;
}

/** Pasos que el ciudadano ve durante su emergencia. */
const CITIZEN_STEPS = [
  { key: "nueva", label: "Alerta enviada" },
  { key: "recibida", label: "Recibida por el centro" },
  { key: "asignada", label: "Unidad asignada" },
  { key: "en_camino", label: "Unidad en camino" },
  { key: "en_sitio", label: "Unidad en el lugar" },
  { key: "atendiendo", label: "En atención" },
] as const;

export function ActiveAlertCard({ incident, detail, currentUserId, onChanged }: ActiveAlertCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const reached = new Set(incident.timeline.map((event) => event.status));
  const status = STATUS_CONFIG[incident.status];
  const unit = detail?.unit;

  async function cancel() {
    setCancelling(true);
    try {
      await api.setIncidentStatus(incident.id, "cancelada", "Cancelada por el ciudadano");
      toast.success("Alerta cancelada");
      onChanged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo cancelar");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-red-600/40 bg-red-950/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-red-400">Emergencia activa</p>
          <p className="font-mono text-lg font-semibold">{incident.code}</p>
          <p className="text-xs text-muted-foreground">Enviada a las {formatTime(incident.reportedAt)}</p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: `${status.color}22`, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      <p className="rounded-lg bg-background/50 px-3 py-2 text-xs text-muted-foreground">
        Tu ubicación está siendo compartida con el centro de atención mientras la emergencia está activa.
      </p>

      <ol className="space-y-2">
        {CITIZEN_STEPS.map((step) => {
          const done = reached.has(step.key);
          const current = incident.status === step.key;
          return (
            <li key={step.key} className="flex items-center gap-3 text-sm">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? "bg-emerald-500 text-black" : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? "✓" : ""}
              </span>
              <span className={current ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground"}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {unit && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <span
            className="flex size-10 items-center justify-center rounded-lg text-lg"
            style={{ background: `${INSTITUTION_CONFIG[unit.institution].color}22`, color: INSTITUTION_CONFIG[unit.institution].color }}
          >
            {INSTITUTION_CONFIG[unit.institution].icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{unit.callsign} · {unit.name}</p>
            <p className="text-xs text-muted-foreground">
              {INSTITUTION_CONFIG[unit.institution].label} · {unit.crew} tripulantes
              {unit.speed ? ` · ${unit.speed} km/h` : ""}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setChatOpen((open) => !open)}>
          {chatOpen ? "Ocultar chat" : "Chat de emergencia"}
        </Button>
        <VoiceCallButton incidentCode={incident.code} target="Centro de atención" />
      </div>

      {chatOpen && (
        <IncidentChat
          incidentId={incident.id}
          messages={detail?.messages ?? []}
          currentUserId={currentUserId}
          counterpartLabel="el centro de atención"
          onSent={onChanged}
          compact
        />
      )}

      <Button variant="outline" className="w-full" onClick={cancel} disabled={cancelling}>
        {cancelling ? "Cancelando…" : "Cancelar mi alerta"}
      </Button>
    </div>
  );
}
