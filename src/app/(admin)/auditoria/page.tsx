"use client";

import { useState } from "react";
import { Lock, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleBadge } from "@/components/usuarios/RoleBadge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudit } from "@/hooks/useAudit";
import { formatDateTime } from "@/lib/date";
import type { AuditAction } from "@/types/audit.types";

const ACTION_LABELS: Record<AuditAction, string> = {
  "incident.created":        "Incidente creado",
  "incident.status_changed": "Cambio de estado",
  "incident.reclassified":   "Reclasificación",
  "incident.assigned":       "Unidad asignada",
  "incident.dispatched":     "Unidad despachada",
  "incident.cancelled":      "Incidente cancelado",
  "incident.closed":         "Incidente cerrado",
  "message.created":         "Mensaje enviado",
  "user.created":            "Usuario creado",
  "user.updated":            "Usuario actualizado",
  "user.suspended":          "Usuario suspendido",
  "user.reactivated":        "Usuario reactivado",
  "unit.position_updated":   "Posición de unidad",
  "unit.status_changed":     "Estado de unidad",
  "agent.position_updated":  "Posición de agente",
  "session.login":           "Inicio de sesión",
  "session.logout":          "Cierre de sesión",
};

const ACTION_COLORS: Partial<Record<AuditAction, string>> = {
  "incident.created":   "text-red-400",
  "incident.dispatched":"text-sky-400",
  "incident.reclassified": "text-amber-400",
  "incident.closed":    "text-emerald-400",
  "incident.cancelled": "text-muted-foreground",
  "session.login":      "text-muted-foreground",
  "session.logout":     "text-muted-foreground",
};

export default function AuditoriaPage() {
  const [search, setSearch] = useState("");
  const { data: entries, isLoading } = useAudit(search.trim() || undefined);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <PageHeader
        title="Historial de auditoría"
        subtitle="Registro inmutable de toda acción crítica del sistema"
        actions={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> Solo lectura
          </span>
        }
      />

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por actor, acción o recurso"
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((key) => <Skeleton key={key} className="h-11" />)}
        </div>
      ) : (entries ?? []).length === 0 ? (
        <EmptyState icon={ScrollText} title="Sin registros" description="No hay eventos que coincidan con la búsqueda." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-card text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Fecha y hora</th>
                <th className="px-3 py-2 font-medium">Actor</th>
                <th className="px-3 py-2 font-medium">Acción</th>
                <th className="px-3 py-2 font-medium">Recurso</th>
                <th className="px-3 py-2 font-medium">Detalle</th>
                <th className="px-3 py-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {(entries ?? []).map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-muted-foreground">
                    {formatDateTime(entry.timestamp)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap">{entry.actorName}</span>
                      <RoleBadge role={entry.actorRole} />
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2 font-medium ${ACTION_COLORS[entry.action] ?? ""}`}>
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{entry.resourceId}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {Object.entries(entry.metadata)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" · ") || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{entry.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
