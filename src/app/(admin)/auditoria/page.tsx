"use client";

import { useState } from "react";
import { Search, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleBadge } from "@/components/usuarios/RoleBadge";
import { useAuditLog } from "@/hooks/useAudit";
import { formatDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { AuditAction } from "@/types/audit.types";

const ACTION_LABELS: Record<AuditAction, string> = {
  "incident.created":       "Incidencia creada",
  "incident.status_changed":"Cambio de estado",
  "incident.assigned":      "Agente asignado",
  "incident.cancelled":     "Incidencia cancelada",
  "user.created":           "Usuario creado",
  "user.updated":           "Usuario actualizado",
  "user.suspended":         "Usuario suspendido",
  "user.reactivated":       "Usuario reactivado",
  "agent.position_updated": "Posición actualizada",
  "session.login":          "Inicio de sesión",
  "session.logout":         "Cierre de sesión",
};

const ACTION_COLORS: Partial<Record<AuditAction, string>> = {
  "incident.created":        "text-blue-400",
  "incident.status_changed": "text-yellow-400",
  "user.suspended":          "text-red-400",
  "user.created":            "text-green-400",
  "session.login":           "text-muted-foreground",
  "session.logout":          "text-muted-foreground",
};

export default function AuditoriaPage() {
  const { data: entries, isLoading } = useAuditLog();
  const [search, setSearch] = useState("");

  const filtered = (entries ?? []).filter((e) =>
    !search ||
    e.actorName.toLowerCase().includes(search.toLowerCase()) ||
    e.resourceId.toLowerCase().includes(search.toLowerCase()) ||
    ACTION_LABELS[e.action].toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="Historial de Auditoría"
        subtitle="Registro inmutable de todas las acciones del sistema"
        actions={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            Solo lectura
          </div>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar en auditoría..."
          className="pl-9 bg-card border-border h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Lock} title="Sin registros" description="No se encontraron entradas de auditoría" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-xs text-muted-foreground font-medium w-36">Timestamp</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Actor</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Acción</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium w-28">Recurso</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium w-28">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id} className="border-border hover:bg-accent/20">
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatDateTime(entry.timestamp)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {entry.actorName[0]}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{entry.actorName}</p>
                        <RoleBadge role={entry.actorRole} className="mt-0.5" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-xs font-medium", ACTION_COLORS[entry.action] ?? "text-foreground")}>
                      {ACTION_LABELS[entry.action]}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{entry.resourceId}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{entry.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      )}
    </div>
  );
}
