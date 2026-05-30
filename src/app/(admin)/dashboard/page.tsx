"use client";

import { AlertTriangle, Users, Clock, Activity } from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { CriticalAlertsList } from "@/components/dashboard/CriticalAlertsList";
import { IncidentsTrendChart } from "@/components/dashboard/IncidentsTrendChart";
import { IncidentsByStatusChart } from "@/components/dashboard/IncidentsByStatusChart";
import { useIncidents } from "@/hooks/useIncidents";
import { useAgents } from "@/hooks/useAgents";

export default function DashboardPage() {
  const { data: incidents } = useIncidents();
  const { data: agents } = useAgents();

  const active = (incidents ?? []).filter((i) => !["cerrada", "cancelada"].includes(i.status)).length;
  const today = (incidents ?? []).filter((i) => new Date(i.reportedAt).toDateString() === new Date().toDateString()).length;
  const available = (agents ?? []).filter((a) => a.availability === "disponible").length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Vista general del sistema en tiempo real"
        actions={<LiveIndicator />}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Incidencias activas"
          value={active}
          icon={AlertTriangle}
          accentColor="oklch(0.70 0.18 45)"
          trend={12}
        />
        <KpiCard
          title="Reportadas hoy"
          value={today}
          icon={Activity}
          accentColor="oklch(0.60 0.20 250)"
          trend={-5}
        />
        <KpiCard
          title="Agentes disponibles"
          value={available}
          unit={`/ ${(agents ?? []).length}`}
          icon={Users}
          accentColor="oklch(0.65 0.18 145)"
        />
        <KpiCard
          title="T. promedio respuesta"
          value="8.4"
          unit="min"
          icon={Clock}
          accentColor="oklch(0.60 0.20 290)"
          trend={-3}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">Tendencia últimos 7 días</h2>
          <IncidentsTrendChart />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">Incidencias por estado</h2>
          <IncidentsByStatusChart />
        </div>
      </div>

      {/* Critical alerts */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">Alertas críticas activas</h2>
          <span className="text-xs text-muted-foreground">Gravedad ≥ 4</span>
        </div>
        <CriticalAlertsList />
      </div>
    </div>
  );
}
