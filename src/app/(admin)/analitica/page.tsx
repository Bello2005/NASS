"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useHeatmap } from "@/hooks/useAnalytics";
import { CATEGORY_LABELS, PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import type { IncidentCategory, IncidentPriority } from "@/types/incident.types";

const GeoHeatmap = dynamic(
  () => import("@/components/analitica/GeoHeatmap").then((m) => ({ default: m.GeoHeatmap })),
  { ssr: false, loading: () => <Skeleton className="size-full rounded-none" /> },
);

const RANGES = [
  { days: 1, label: "Hoy" },
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
];

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const CHART_TOOLTIP = {
  contentStyle: { background: "oklch(0.14 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "oklch(0.97 0 0)" },
};

function Metric({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

export default function AnaliticaPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useAnalytics(days);
  const { data: heatmap } = useHeatmap(days);

  if (isLoading || !data) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-52" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((key) => <Skeleton key={key} className="h-24" />)}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const { kpis } = data;
  const maxCell = Math.max(1, ...data.grid.flat());
  const maxZone = Math.max(1, ...data.byZone.map((zone) => zone.count));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Analítica de incidentes"
        subtitle="Concentración, tiempos de respuesta y desempeño del territorio"
        actions={
          <div className="flex gap-1 rounded-lg bg-muted/40 p-1">
            {RANGES.map((range) => (
              <button
                key={range.days}
                type="button"
                onClick={() => setDays(range.days)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  days === range.days ? "bg-background text-foreground" : "text-muted-foreground"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Incidentes del periodo" value={kpis.totalPeriodo} />
        <Metric label="Activos ahora" value={kpis.activos} />
        <Metric label="Tiempo de respuesta" value={kpis.tiempoRespuestaMin} unit="min" />
        <Metric label="Tiempo de despacho" value={kpis.tiempoDespachoMin} unit="min" />
        <Metric label="Tasa de resolución" value={kpis.tasaResolucion} unit="%" />
      </div>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-medium">Concentración geográfica</h2>
          <div className="h-72 overflow-hidden rounded-lg border border-border">
            {heatmap ? <GeoHeatmap data={heatmap} /> : <Skeleton className="size-full" />}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Agregado en celdas de ~165 m. Azul: baja concentración · Rojo: zona crítica.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium">Incidentes por zona</h2>
          <ul className="space-y-2.5">
            {data.byZone.map((zone) => (
              <li key={zone.key}>
                <div className="flex justify-between text-xs">
                  <span>{zone.key}</span>
                  <span className="font-semibold tabular-nums">{zone.count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-red-500"
                    style={{ width: `${(zone.count / maxZone) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">Serie diaria</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.series} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "oklch(0.60 0 0)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.60 0 0)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="nuevas" name="Nuevas" stroke="#4a90d9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cerradas" name="Cerradas" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="criticas" name="Críticas" stroke="#dc2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">Horas pico</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.byHour} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: "oklch(0.60 0 0)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.60 0 0)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} labelFormatter={(hour) => `${hour}:00`} />
              <Bar dataKey="count" name="Incidentes" radius={[3, 3, 0, 0]}>
                {data.byHour.map((slot) => (
                  <Cell
                    key={slot.hour}
                    fill={slot.count > 0 && slot.count === Math.max(...data.byHour.map((h) => h.count)) ? "#dc2626" : "#4a90d9"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">Por categoría</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.byCategory.slice(0, 7).map((item) => ({
                  name: CATEGORY_LABELS[item.key as IncidentCategory] ?? item.key,
                  value: item.count,
                }))}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.byCategory.slice(0, 7).map((item, index) => (
                  <Cell key={item.key} fill={["#4a90d9", "#dc2626", "#ea580c", "#eab308", "#16a34a", "#a855f7", "#38bdf8"][index]} />
                ))}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium">Por prioridad</h2>
          <ul className="space-y-3">
            {data.byPriority.map((item) => {
              const config = PRIORITY_CONFIG[item.key as IncidentPriority];
              const total = data.byPriority.reduce((sum, entry) => sum + entry.count, 0) || 1;
              return (
                <li key={item.key}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: config?.color }}>{config?.label ?? item.key}</span>
                    <span className="font-semibold tabular-nums">
                      {item.count} · {Math.round((item.count / total) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(item.count / total) * 100}%`, background: config?.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <h2 className="mb-3 mt-6 text-sm font-medium">Por estado</h2>
          <ul className="space-y-1.5 text-xs">
            {data.byStatus.map((item) => (
              <li key={item.key} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: STATUS_CONFIG[item.key]?.color }} />
                  {STATUS_CONFIG[item.key]?.label ?? item.key}
                </span>
                <span className="font-semibold tabular-nums">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-1 text-sm font-medium">Mapa de calor semanal</h2>
          <p className="mb-4 text-xs text-muted-foreground">Día de la semana × hora del día</p>
          <div className="space-y-1">
            {data.grid.map((row, dayIndex) => (
              <div key={dayIndex} className="flex items-center gap-1">
                <span className="w-7 shrink-0 text-[10px] text-muted-foreground">{DAY_LABELS[dayIndex]}</span>
                <div className="flex flex-1 gap-[2px]">
                  {row.map((count, hour) => {
                    const ratio = count / maxCell;
                    return (
                      <span
                        key={hour}
                        title={`${DAY_LABELS[dayIndex]} ${hour}:00 · ${count}`}
                        className="h-4 flex-1 rounded-[2px]"
                        style={{
                          background:
                            count === 0
                              ? "oklch(0.22 0 0)"
                              : ratio > 0.75 ? "#dc2626"
                              : ratio > 0.45 ? "#ea580c"
                              : ratio > 0.2 ? "#eab308"
                              : "#4a90d9",
                          opacity: count === 0 ? 1 : 0.35 + ratio * 0.65,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Menos</span>
            {["oklch(0.22 0 0)", "#4a90d9", "#eab308", "#ea580c", "#dc2626"].map((color) => (
              <span key={color} className="size-3 rounded-[2px]" style={{ background: color }} />
            ))}
            <span>Más</span>
          </div>
        </div>
      </section>
    </div>
  );
}
