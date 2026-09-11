"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Wifi, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":   "Dashboard",
  "/mapa":        "Mapa en tiempo real",
  "/incidencias": "Gestión de incidencias",
  "/usuarios":    "Gestión de usuarios",
  "/analitica":   "Analítica",
  "/auditoria":   "Auditoría",
};

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  // El reloj arranca vacío y se llena al montar: si se renderizara en el
  // servidor, la hora no coincidiría con la del navegador al hidratar.
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pageLabel =
    ROUTE_LABELS[pathname] ??
    ROUTE_LABELS[Object.keys(ROUTE_LABELS).find((k) => pathname.startsWith(k)) ?? ""] ??
    "Panel";

  const timeStr = time
    ? time.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";
  const dateStr = time
    ? time.toLocaleDateString("es-CO", { weekday: "short", day: "2-digit", month: "short" })
    : "";

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden text-muted-foreground hover:text-foreground p-1 -ml-1"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">NASS</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">/</span>
          <span className="text-sm font-medium text-foreground">{pageLabel}</span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* System status */}
        <div className="flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse")} />
          <span className="text-xs text-muted-foreground hidden lg:inline">Sistema operativo</span>
          <Wifi className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline" />
        </div>

        {/* Clock */}
        <div className="text-right hidden lg:block">
          <p className="text-xs font-mono font-medium text-foreground">{timeStr}</p>
          <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
        </div>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
        </button>
      </div>
    </header>
  );
}
