"use client";

import { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  ComposedChart, Line, ReferenceLine,
} from "recharts";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown,
  Activity, Zap, Shield, Target, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";
import { useAgents } from "@/hooks/useAgents";
import { ZONE_LIST, CATEGORY_LABELS, STATUS_CONFIG, SEVERITY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { IncidentSeverity, IncidentStatus } from "@/types/incident.types";

/* ── Constants ─────────────────────────────────────────────── */
const C = {
  blue:   "#4a90d9",
  green:  "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red:    "#ef4444",
  purple: "#a855f7",
  cyan:   "#06b6d4",
  grid:   "oklch(0.22 0 0)",
  muted:  "oklch(0.50 0 0)",
  card:   "oklch(0.14 0 0)",
  border: "oklch(0.25 0 0)",
};

const CAT_COLORS: Record<string, string> = {
  robo: C.blue, agresion: C.red, accidente: C.orange,
  incendio: "#f59e0b", disturbio: C.purple, hurto: C.cyan, otro: "#6b7280",
};

const SEV_COLORS: Record<number, string> = {
  1: C.green, 2: C.yellow, 3: C.orange, 4: C.red, 5: "#7f1d1d",
};

const STATUS_COLORS: Record<IncidentStatus, string> = {
  nueva: "#6b7280", aceptada: C.blue, en_camino: C.yellow,
  atendiendo: C.orange, cerrada: C.green, cancelada: C.red,
};

const DAYS    = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const RANGES  = ["7D","14D","30D"] as const;
type Range    = typeof RANGES[number];

/* ── Shared tooltip style ──────────────────────────────────── */
const TT = {
  contentStyle: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, padding: "8px 12px" },
  cursor: { fill: "oklch(0.20 0 0)" },
  labelStyle: { color: "oklch(0.97 0 0)", fontWeight: 600, marginBottom: 4 },
};

/* ── Mini Sparkline ────────────────────────────────────────── */
function Spark({ data, color = C.blue }: { data: number[]; color?: string }) {
  const points = data.map((v, i) => ({ v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${color})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Metric Card with sparkline ────────────────────────────── */
function MetricCard({
  title, value, unit, trend, trendLabel, spark, color, icon: Icon,
}: {
  title: string; value: string | number; unit?: string;
  trend?: number; trendLabel?: string; spark: number[];
  color: string; icon: React.ElementType;
}) {
  const up = trend !== undefined && trend > 0;
  const dn = trend !== undefined && trend < 0;
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div
        className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.07] blur-2xl"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-foreground tabular-nums leading-none">{value}</span>
        {unit && <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>}
      </div>
      <Spark data={spark} color={color} />
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", up && "text-green-400", dn && "text-red-400", !up && !dn && "text-muted-foreground")}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : dn ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trend > 0 ? "+" : ""}{trend}% {trendLabel ?? "vs semana anterior"}
        </div>
      )}
    </div>
  );
}

/* ── Section header ────────────────────────────────────────── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ── Card wrapper ──────────────────────────────────────────── */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      {children}
    </div>
  );
}

/* ── Generate 30-day trend data ────────────────────────────── */
const BASE_DAILY = [4,6,8,11,9,5,3, 7,10,12,14,11,6,4, 8,13,15,18,14,7,5, 9,12,16,13,10,6,3, 11,14];
const CLOSED_DAILY = BASE_DAILY.map((v, i) => Math.max(0, Math.round(v * 0.65 + Math.sin(i) * 1.5)));
const CRITICAL_DAILY = BASE_DAILY.map((v) => Math.max(0, Math.round(v * 0.25)));

function buildTrend(range: Range) {
  const n = range === "7D" ? 7 : range === "14D" ? 14 : 30;
  const offset = 30 - n;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(2024, 4, 1 + offset + i);
    return {
      day: d.toLocaleDateString("es-CO", { day:"2-digit", month:"short" }),
      nuevas:   BASE_DAILY[offset + i],
      cerradas: CLOSED_DAILY[offset + i],
      criticas: CRITICAL_DAILY[offset + i],
    };
  });
}

/* ════════════════════════════════════════════════════════════ */
export default function AnaliticaPage() {
  const { data: incidents } = useIncidents();
  const { data: agents }    = useAgents();
  const [range, setRange]   = useState<Range>("30D");

  const all    = incidents ?? [];
  const closed = all.filter(i => i.status === "cerrada");
  const active = all.filter(i => !["cerrada","cancelada"].includes(i.status));
  const total  = all.length;

  const resolutionRate = total ? Math.round(closed.length / total * 100) : 0;
  const avgSeverity    = total ? (all.reduce((s,i) => s + i.severity, 0) / total).toFixed(1) : "—";
  const available      = (agents ?? []).filter(a => a.availability === "disponible").length;

  /* Sparkline seeds (7-day window) */
  const spark7D = BASE_DAILY.slice(-7);
  const sparkRes = CLOSED_DAILY.slice(-7).map((v, i) => Math.round(v / Math.max(BASE_DAILY.slice(-7)[i], 1) * 100));
  const sparkSev = [3.1, 2.9, 3.3, 3.0, 3.2, 2.8, 3.1];
  const sparkTime = [7.2, 8.1, 7.8, 9.0, 8.4, 7.5, 8.2];

  /* Charts data */
  const trendData = useMemo(() => buildTrend(range), [range]);

  const byCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    all.forEach(i => { cats[i.category] = (cats[i.category] ?? 0) + 1; });
    return Object.entries(cats)
      .map(([cat, count]) => ({ cat, name: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat, count, pct: Math.round(count / total * 100) }))
      .sort((a,b) => b.count - a.count);
  }, [all, total]);

  const bySeverity = useMemo(() =>
    ([1,2,3,4,5] as IncidentSeverity[]).map(sv => ({
      name: `Gravedad ${sv}`,
      value: all.filter(i => i.severity === sv).length,
      fill: SEV_COLORS[sv],
    })).filter(x => x.value > 0).reverse(),
  [all]);

  const byZone = useMemo(() =>
    ZONE_LIST.map(z => {
      const count = all.filter(i => i.zone === z).length;
      return { zone: z, count, pct: total ? Math.round(count / total * 100) : 0 };
    }).sort((a,b) => b.count - a.count),
  [all, total]);

  const maxZone = byZone[0]?.count ?? 1;

  const byHour = useMemo(() =>
    HOURS.map(h => ({
      h,
      hour: `${String(h).padStart(2,"0")}`,
      count: all.filter(i => new Date(i.reportedAt).getHours() === h).length,
    })),
  [all]);
  const maxHour = Math.max(...byHour.map(x => x.count), 1);

  const byStatus = useMemo(() =>
    (Object.keys(STATUS_CONFIG) as IncidentStatus[])
      .filter(s => s !== "cancelada")
      .map(s => ({
        status: STATUS_CONFIG[s].label,
        count: all.filter(i => i.status === s).length,
        color: STATUS_COLORS[s],
      })),
  [all]);

  const heatmap = useMemo(() => {
    /* synthetic weekly data — more realistic than the sparse mocks */
    const pattern = [
      [1,0,0,0,1,2,1,3,4,5,4,5,4,3,4,5,4,3,2,3,4,3,2,1],
      [1,0,0,0,1,2,2,4,5,6,5,6,5,4,5,6,5,4,3,4,5,4,2,1],
      [0,0,0,0,1,1,1,3,4,5,5,5,4,4,5,6,5,4,3,3,4,3,2,1],
      [1,0,0,0,1,2,2,4,5,7,6,6,5,5,6,7,6,5,4,4,5,4,2,1],
      [2,1,0,0,1,2,2,5,6,7,6,7,6,5,6,7,7,6,5,5,6,5,3,2],
      [1,1,1,0,0,1,2,3,4,4,4,4,4,4,4,4,4,4,3,3,3,2,2,1],
      [0,0,0,0,0,1,1,2,3,3,3,3,3,3,3,3,3,2,2,2,2,1,1,0],
    ];
    const max = Math.max(...pattern.flat(), 1);
    return { grid: pattern, max };
  }, []);

  /* Response time mock per category */
  const responseByCategory = [
    { name: "Incendio",   avg: 5.2,  prev: 6.1 },
    { name: "Agresión",   avg: 6.8,  prev: 7.4 },
    { name: "Robo",       avg: 8.4,  prev: 7.9 },
    { name: "Accidente",  avg: 9.1,  prev: 10.3 },
    { name: "Disturbio",  avg: 10.5, prev: 9.8 },
    { name: "Hurto",      avg: 12.3, prev: 13.1 },
  ];

  /* Funnel mock */
  const funnelTotal = 120;
  const funnel = [
    { label: "Reportadas",  value: 120, color: C.blue },
    { label: "Aceptadas",   value: 104, color: "#6366f1" },
    { label: "Despachadas", value: 98,  color: C.yellow },
    { label: "Atendidas",   value: 91,  color: C.orange },
    { label: "Cerradas",    value: 83,  color: C.green },
  ];

  return (
    <div className="p-4 md:p-6 space-y-10 max-w-[1400px]">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Analítica</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Panel de inteligencia operacional — Quibdó, Chocó
          </p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5 self-start sm:self-auto">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                range === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >{r}</button>
          ))}
        </div>
      </div>

      {/* ── KPIs con sparklines ─────────────────────────────── */}
      <section>
        <SectionHeader title="Métricas clave" subtitle="últimos 7 días" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Total incidencias"   value={total}             icon={AlertTriangle}  color={C.blue}   spark={spark7D}   trend={12} />
          <MetricCard title="Tasa de resolución"  value={resolutionRate} unit="%" icon={CheckCircle} color={C.green}  spark={sparkRes}  trend={5}  trendLabel="vs anterior" />
          <MetricCard title="T. promedio respuesta" value="8.4" unit="min"  icon={Clock}          color={C.orange} spark={sparkTime}  trend={-3} />
          <MetricCard title="Gravedad promedio"   value={avgSeverity}       icon={Zap}            color={C.purple} spark={sparkSev}   trend={-2} />
        </div>
      </section>

      {/* ── Tendencia multi-series ──────────────────────────── */}
      <section>
        <SectionHeader title="Tendencia de incidencias" subtitle={`últimos ${range}`} />
        <Card>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {[
              { key: "nuevas",   label: "Nuevas",   color: C.blue   },
              { key: "cerradas", label: "Cerradas", color: C.green  },
              { key: "criticas", label: "Críticas", color: C.red    },
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded-full" style={{ background: color }} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                {[{id:"aN",c:C.blue},{id:"aC",c:C.green},{id:"aR",c:C.red}].map(({id,c})=>(
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c} stopOpacity={0}    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
                interval={range === "30D" ? 5 : range === "14D" ? 2 : 0} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Area type="monotone" dataKey="nuevas"   name="Nuevas"   stroke={C.blue}  strokeWidth={2} fill="url(#aN)" />
              <Area type="monotone" dataKey="cerradas" name="Cerradas" stroke={C.green} strokeWidth={2} fill="url(#aC)" />
              <Area type="monotone" dataKey="criticas" name="Críticas" stroke={C.red}   strokeWidth={1.5} fill="url(#aR)" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* ── Categorías + Gravedad ───────────────────────────── */}
      <section>
        <SectionHeader title="Composición" subtitle="distribución por tipo y gravedad" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Donut + legend */}
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Por tipo de incidente</h3>
            <div className="flex items-center gap-4">
              <div className="shrink-0" style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="count" nameKey="name"
                      cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} startAngle={90} endAngle={-270}>
                      {byCategory.map(({ cat }) => (
                        <Cell key={cat} fill={CAT_COLORS[cat] ?? "#6b7280"} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip {...TT} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {byCategory.map(({ cat, name, count, pct }) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLORS[cat] ?? "#6b7280" }} />
                    <span className="text-xs text-foreground flex-1 truncate">{name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                    <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden shrink-0">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CAT_COLORS[cat] ?? "#6b7280" }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-7 text-right tabular-nums">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Severity radial + stats */}
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Distribución de gravedad</h3>
            <div className="flex items-center gap-4">
              <div className="shrink-0" style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius={22} outerRadius={72}
                    data={bySeverity} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "oklch(0.20 0 0)" }} />
                    <Tooltip {...TT} formatter={(v, n) => [v, n]} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {([5,4,3,2,1] as IncidentSeverity[]).map(sv => {
                  const count = all.filter(i => i.severity === sv).length;
                  const pct = total ? Math.round(count / total * 100) : 0;
                  return (
                    <div key={sv} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          <span className="font-medium" style={{ color: SEV_COLORS[sv] }}>G{sv}</span>
                          {" "}{SEVERITY_CONFIG[sv].label}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: SEV_COLORS[sv] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Ranking de zonas ────────────────────────────────── */}
      <section>
        <SectionHeader title="Actividad por zona" subtitle="Quibdó — ranking de incidencias" />
        <Card>
          <div className="space-y-4">
            {byZone.map(({ zone, count, pct }, idx) => (
              <div key={zone} className="flex items-center gap-4">
                <span className="w-5 text-xs text-muted-foreground tabular-nums text-right shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-foreground w-28 shrink-0 truncate">{zone}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(count / maxZone * 100)}%`,
                      background: `linear-gradient(to right, ${C.blue}, ${idx === 0 ? C.purple : C.blue})`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-6 text-right shrink-0">{count}</span>
                <span className="text-xs text-muted-foreground tabular-nums w-8 text-right shrink-0">{pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── Horas pico + Tiempo de respuesta ────────────────── */}
      <section>
        <SectionHeader title="Operaciones" subtitle="distribución temporal y tiempos de respuesta" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Horas pico mejorado */}
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Distribución por hora del día</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byHour} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} formatter={(v) => [v, "Incidencias"]} />
                <ReferenceLine x="14" stroke={C.red} strokeDasharray="3 2" opacity={0.4} />
                {byHour.map((entry, i) => null)}
                <Bar dataKey="count" radius={[3, 3, 0, 0]} name="Incidencias">
                  {byHour.map((entry, i) => (
                    <Cell key={i} fill={entry.count >= maxHour * 0.7 ? C.red : entry.count >= maxHour * 0.4 ? C.orange : C.blue} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              {[{ c: C.red, l: "Alto" }, { c: C.orange, l: "Medio" }, { c: C.blue, l: "Bajo" }].map(({ c, l }) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
                  <span className="text-xs text-muted-foreground">{l}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Tiempo de respuesta por categoría */}
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Tiempo promedio de respuesta <span className="normal-case font-normal">(min)</span>
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={responseByCategory} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 16]} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
                <Tooltip {...TT} formatter={(v, n) => [`${v} min`, n === "avg" ? "Actual" : "Anterior"]} />
                <Bar dataKey="prev" name="Anterior" fill="oklch(0.25 0 0)" radius={[0, 3, 3, 0]} barSize={6} />
                <Bar dataKey="avg"  name="Actual"   radius={[0, 3, 3, 0]} barSize={6}>
                  {responseByCategory.map((e, i) => (
                    <Cell key={i} fill={e.avg < e.prev ? C.green : C.orange} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="avg" stroke="transparent" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5"><span className="w-6 h-1 rounded-full bg-green-500" /><span className="text-xs text-muted-foreground">Mejoró</span></div>
              <div className="flex items-center gap-1.5"><span className="w-6 h-1 rounded-full bg-orange-500" /><span className="text-xs text-muted-foreground">Aumentó</span></div>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Mapa de calor ───────────────────────────────────── */}
      <section>
        <SectionHeader title="Mapa de calor semanal" subtitle="frecuencia por día y hora" />
        <Card className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="flex gap-1.5">
              {/* Day labels */}
              <div className="flex flex-col justify-around" style={{ paddingTop: 22 }}>
                {DAYS.map(d => (
                  <span key={d} className="text-xs text-muted-foreground w-7 text-right pr-1 leading-5">{d}</span>
                ))}
              </div>
              {/* Grid */}
              <div className="flex-1">
                {/* Hour labels */}
                <div className="flex mb-1">
                  {HOURS.map(h => (
                    <div key={h} className="flex-1 text-center" style={{ fontSize: 8, color: C.muted }}>
                      {h % 3 === 0 ? String(h).padStart(2,"0") : ""}
                    </div>
                  ))}
                </div>
                {/* Cells */}
                <div className="space-y-1">
                  {heatmap.grid.map((row, d) => (
                    <div key={d} className="flex gap-0.5">
                      {row.map((count, h) => {
                        const intensity = count === 0 ? 0.04 : (count / heatmap.max) * 0.85 + 0.12;
                        return (
                          <div
                            key={h}
                            className="flex-1 rounded-sm cursor-default transition-transform hover:scale-110"
                            style={{
                              height: 18,
                              background: count === 0
                                ? "oklch(0.20 0 0)"
                                : count >= heatmap.max * 0.75
                                ? `oklch(0.55 0.22 25 / ${intensity})`
                                : count >= heatmap.max * 0.45
                                ? `oklch(0.70 0.18 45 / ${intensity})`
                                : `oklch(0.60 0.20 250 / ${intensity})`,
                            }}
                            title={`${DAYS[d]} ${String(h).padStart(2,"0")}:00 — ${count} incidencias`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-end gap-1 mt-3">
                  <span className="text-xs text-muted-foreground mr-1">Menos</span>
                  {[0.04, 0.2, 0.4, 0.65, 0.85].map((op, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{ background: `oklch(0.60 0.20 250 / ${op})` }} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">Más</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Estados + Embudo ────────────────────────────────── */}
      <section>
        <SectionHeader title="Flujo operacional" subtitle="distribución de estados y embudo de resolución" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Estados actual */}
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Estado actual del sistema</h3>
            <div className="space-y-3">
              {byStatus.map(({ status, count, color }) => {
                const pct = total ? Math.round(count / total * 100) : 0;
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-xs text-foreground">{status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground tabular-nums">{count}</span>
                        <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Embudo de resolución */}
          <Card>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">
              Embudo de resolución
              <span className="normal-case font-normal ml-1">(últimos 30 días)</span>
            </h3>
            <div className="space-y-2">
              {funnel.map(({ label, value, color }, i) => {
                const pct = Math.round(value / funnelTotal * 100);
                const drop = i > 0 ? funnel[i-1].value - value : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <div className="flex items-center gap-2">
                        {drop > 0 && (
                          <span className="text-xs text-red-400 tabular-nums">-{drop}</span>
                        )}
                        <span className="text-xs font-semibold text-foreground tabular-nums">{value}</span>
                      </div>
                    </div>
                    <div
                      className="h-7 rounded-lg flex items-center px-3 transition-all"
                      style={{
                        width: `${pct}%`,
                        minWidth: 80,
                        background: `${color}22`,
                        border: `1px solid ${color}44`,
                      }}
                    >
                      <span className="text-xs font-medium tabular-nums" style={{ color }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      {/* ── Tendencia por categoría ─────────────────────────── */}
      <section>
        <SectionHeader title="Tendencia por categoría" subtitle="evolución semanal de los tipos más frecuentes" />
        <Card>
          <div className="flex flex-wrap gap-4 mb-5">
            {[
              { key: "robo",     label: "Robo",     color: C.blue   },
              { key: "agresion", label: "Agresión", color: C.red    },
              { key: "hurto",    label: "Hurto",    color: C.cyan   },
              { key: "otro",     label: "Otro",     color: "#6b7280"},
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded-full" style={{ background: color }} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart
              data={[
                { day:"Lun", robo:3, agresion:2, hurto:1, otro:1 },
                { day:"Mar", robo:5, agresion:3, hurto:2, otro:2 },
                { day:"Mié", robo:4, agresion:2, hurto:2, otro:1 },
                { day:"Jue", robo:6, agresion:4, hurto:3, otro:2 },
                { day:"Vie", robo:5, agresion:3, hurto:2, otro:3 },
                { day:"Sáb", robo:3, agresion:2, hurto:2, otro:2 },
                { day:"Dom", robo:2, agresion:1, hurto:1, otro:1 },
              ]}
              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Line type="monotone" dataKey="robo"     name="Robo"     stroke={C.blue}   strokeWidth={2} dot={{ r: 3, fill: C.blue   }} />
              <Line type="monotone" dataKey="agresion" name="Agresión" stroke={C.red}    strokeWidth={2} dot={{ r: 3, fill: C.red    }} />
              <Line type="monotone" dataKey="hurto"    name="Hurto"    stroke={C.cyan}   strokeWidth={2} dot={{ r: 3, fill: C.cyan   }} />
              <Line type="monotone" dataKey="otro"     name="Otro"     stroke="#6b7280"  strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Datos actualizados · NASS v2.0 · Quibdó, Chocó
        </span>
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Sistema operativo
        </div>
      </div>

    </div>
  );
}
