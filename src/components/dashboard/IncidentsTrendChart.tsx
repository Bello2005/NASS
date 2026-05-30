"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Lun",  incidencias: 8  },
  { day: "Mar",  incidencias: 12 },
  { day: "Mié",  incidencias: 7  },
  { day: "Jue",  incidencias: 15 },
  { day: "Vie",  incidencias: 11 },
  { day: "Sáb",  incidencias: 18 },
  { day: "Dom",  incidencias: 9  },
];

export function IncidentsTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.60 0.20 250)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="oklch(0.60 0.20 250)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: "oklch(0.60 0 0)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "oklch(0.60 0 0)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "oklch(0.14 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: "8px", fontSize: 12 }}
          labelStyle={{ color: "oklch(0.97 0 0)" }}
          itemStyle={{ color: "oklch(0.60 0.20 250)" }}
        />
        <Area
          type="monotone"
          dataKey="incidencias"
          stroke="oklch(0.60 0.20 250)"
          strokeWidth={2}
          fill="url(#colorInc)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
