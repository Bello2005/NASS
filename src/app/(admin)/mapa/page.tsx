"use client";

import dynamic from "next/dynamic";
import { MapFiltersBar } from "@/components/map/MapFiltersBar";
import { IncidentDetailPanel } from "@/components/map/IncidentDetailPanel";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { Skeleton } from "@/components/ui/skeleton";

const RealtimeMap = dynamic(
  () => import("@/components/map/RealtimeMap").then((m) => ({ default: m.RealtimeMap })),
  {
    ssr: false,
    loading: () => <Skeleton className="flex-1 rounded-none" />,
  }
);

export default function MapaPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-border bg-background">
        <h1 className="text-sm font-medium text-foreground">Mapa en tiempo real</h1>
        <LiveIndicator />
      </div>
      <MapFiltersBar />
      <div className="flex-1 relative">
        <RealtimeMap />
      </div>
      <IncidentDetailPanel />
    </div>
  );
}
