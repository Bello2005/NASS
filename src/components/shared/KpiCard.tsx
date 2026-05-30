import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: number;
  accentColor?: string;
  className?: string;
}

export function KpiCard({ title, value, unit, icon: Icon, trend, accentColor = "var(--primary)", className }: KpiCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-card p-5", className)}>
      {/* Accent glow */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-2xl"
        style={{ background: accentColor }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in oklch, ${accentColor} 15%, transparent)` }}
        >
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trendPositive && "text-green-400",
              trendNegative && "text-red-400",
              !trendPositive && !trendNegative && "text-muted-foreground"
            )}
          >
            {trendPositive ? <TrendingUp className="w-3 h-3" /> : trendNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-foreground tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
