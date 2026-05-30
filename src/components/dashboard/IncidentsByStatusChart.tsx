"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useIncidents } from "@/hooks/useIncidents";
import { STATUS_CONFIG } from "@/lib/constants";
import type { IncidentStatus } from "@/types/incident.types";

const STATUS_ORDER: IncidentStatus[] = ["nueva", "aceptada", "en_camino", "atendiendo", "cerrada"];

export function IncidentsByStatusChart() {
  const { data: incidents } = useIncidents();

  const chartData = STATUS_ORDER.map((status) => ({
    status: STATUS_CONFIG[status].label,
    count: (incidents ?? []).filter((i) => i.status === status).length,
    color: STATUS_CONFIG[status].color,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" vertical={false} />
        <XAxis dataKey="status" tick={{ fill: "oklch(0.60 0 0)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "oklch(0.60 0 0)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "oklch(0.14 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: "8px", fontSize: 12 }}
          labelStyle={{ color: "oklch(0.97 0 0)" }}
          cursor={{ fill: "oklch(0.20 0 0)" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
