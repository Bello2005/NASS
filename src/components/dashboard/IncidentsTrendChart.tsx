"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

export function IncidentsTrendChart() {
  const { data, isLoading } = useAnalytics(7);

  if (isLoading || !data) return <Skeleton className="h-[180px] w-full" />;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data.series} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="nassNuevas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.60 0.20 250)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="oklch(0.60 0.20 250)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="nassCerradas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.65 0.18 145)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="oklch(0.65 0.18 145)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "oklch(0.60 0 0)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "oklch(0.60 0 0)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "oklch(0.14 0 0)", border: "1px solid oklch(0.25 0 0)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "oklch(0.97 0 0)" }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="nuevas" name="Nuevas" stroke="oklch(0.60 0.20 250)" strokeWidth={2} fill="url(#nassNuevas)" />
        <Area type="monotone" dataKey="cerradas" name="Cerradas" stroke="oklch(0.65 0.18 145)" strokeWidth={2} fill="url(#nassCerradas)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
