"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SeverityDot } from "@/components/shared/SeverityDot";
import { formatRelative } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

export function CriticalAlertsList() {
  const { data: incidents, isLoading } = useIncidents();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  const critical = (incidents ?? [])
    .filter((i) => i.severity >= 4 && i.status !== "cerrada" && i.status !== "cancelada")
    .sort((a, b) => b.severity - a.severity || new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
    .slice(0, 5);

  if (critical.length === 0) {
    return <EmptyState icon={AlertTriangle} title="Sin alertas críticas" description="No hay incidencias críticas activas" />;
  }

  return (
    <div className="space-y-2">
      {critical.map((inc) => (
        <Link key={inc.id} href={`/incidencias/${inc.id}`}>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/40 hover:bg-accent transition-colors cursor-pointer group">
            <SeverityDot severity={inc.severity} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{inc.title}</p>
              <p className="text-xs text-muted-foreground">{inc.zone} · {formatRelative(inc.reportedAt)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={inc.status} />
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
