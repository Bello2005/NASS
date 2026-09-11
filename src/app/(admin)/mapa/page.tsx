"use client";

import dynamic from "next/dynamic";
import { MapFiltersBar } from "@/components/map/MapFiltersBar";
import { DispatchPanel } from "@/components/map/DispatchPanel";
import { IncidentQueue } from "@/components/map/IncidentQueue";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { UnitStatusBar } from "@/components/map/UnitStatusBar";
import { Skeleton } from "@/components/ui/skeleton";

const RealtimeMap = dynamic(
  () => import("@/components/map/RealtimeMap").then((m) => ({ default: m.RealtimeMap })),
  { ssr: false, loading: () => <Skeleton className="flex-1 rounded-none" /> },
);

export default function MapaPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border bg-background px-3 py-2 md:px-4">
        <h1 className="text-sm font-medium">Centro de despacho · mapa en tiempo real</h1>
        <LiveIndicator />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 md:block">
          <IncidentQueue />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <MapFiltersBar />
          <div className="relative min-h-0 flex-1">
            <RealtimeMap />
          </div>
          <UnitStatusBar />
        </div>
      </div>

      <DispatchPanel />
    </div>
  );
}
