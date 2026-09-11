"use client";

import { Activity, AlertTriangle, Clock, Radio, ShieldCheck, Timer } from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { CriticalAlertsList } from "@/components/dashboard/CriticalAlertsList";
import { IncidentsTrendChart } from "@/components/dashboard/IncidentsTrendChart";
import { IncidentsByStatusChart } from "@/components/dashboard/IncidentsByStatusChart";
import { UnitFleetTable } from "@/components/dashboard/UnitFleetTable";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useIncidents } from "@/hooks/useIncidents";

export default function DashboardPage() {
  const { data: incidents } = useIncidents();
  const { data: summary } = useAnalytics(7);

  const kpis = summary?.kpis;
  const today = (incidents ?? []).filter(
    (incident) => new Date(incident.reportedAt).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Dashboard operativo"
        subtitle="Estado del territorio en tiempo real · Quibdó, Chocó"
        actions={<LiveIndicator />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Incidentes activos"
          value={kpis?.activos ?? "—"}
          icon={AlertTriangle}
          accentColor="oklch(0.70 0.18 45)"
        />
        <KpiCard
          title="Críticos sin resolver"
          value={kpis?.criticasActivas ?? "—"}
          icon={Radio}
          accentColor="oklch(0.55 0.22 25)"
        />
        <KpiCard
          title="Reportados hoy"
          value={today}
          icon={Activity}
          accentColor="oklch(0.60 0.20 250)"
        />
        <KpiCard
          title="Tiempo de respuesta"
          value={kpis?.tiempoRespuestaMin ?? "—"}
          unit="min"
          icon={Clock}
          accentColor="oklch(0.60 0.20 290)"
        />
        <KpiCard
          title="Tiempo de llegada"
          value={kpis?.tiempoLlegadaMin ?? "—"}
          unit="min"
          icon={Timer}
          accentColor="oklch(0.75 0.18 85)"
        />
        <KpiCard
          title="Unidades disponibles"
          value={kpis?.unidadesDisponibles ?? "—"}
          unit={`/ ${kpis?.unidadesTotal ?? 0}`}
          icon={ShieldCheck}
          accentColor="oklch(0.65 0.18 145)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">Tendencia últimos 7 días</h2>
          <IncidentsTrendChart />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">Incidentes por estado</h2>
          <IncidentsByStatusChart />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium">Alertas críticas activas</h2>
          <span className="text-xs text-muted-foreground">Prioridad crítica y alta</span>
        </div>
        <CriticalAlertsList />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-medium">Flota de respuesta</h2>
        <UnitFleetTable />
      </div>
    </div>
  );
}
