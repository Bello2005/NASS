"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIncidentsStore } from "@/store/incidents.store";
import type { IncidentStatus } from "@/types/incident.types";

export const incidentKeys = {
  all: ["incidents"] as const,
  detail: (id: string) => ["incidents", id] as const,
};

export function useIncidents() {
  const incidents = useIncidentsStore((s) => s.incidents);
  return useQuery({
    queryKey: incidentKeys.all,
    queryFn: () => Promise.resolve(incidents),
    staleTime: 30_000,
  });
}

export function useIncident(id: string) {
  const incidents = useIncidentsStore((s) => s.incidents);
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => Promise.resolve(incidents.find((i) => i.id === id) ?? null),
    staleTime: 30_000,
  });
}

export function useUpdateIncidentStatus() {
  const updateStatus = useIncidentsStore((s) => s.updateIncidentStatus);
  const queryClient = useQueryClient();
  return (id: string, status: IncidentStatus, actorName: string, actorId: string, note?: string) => {
    updateStatus(id, status, actorName, actorId, note);
    queryClient.invalidateQueries({ queryKey: incidentKeys.all });
    queryClient.invalidateQueries({ queryKey: incidentKeys.detail(id) });
  };
}
