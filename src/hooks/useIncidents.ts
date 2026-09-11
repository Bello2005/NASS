"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { IncidentStatus } from "@/types/incident.types";

export const incidentKeys = {
  all: ["incidents"] as const,
  detail: (id: string) => ["incidents", id] as const,
};

export function useIncidents() {
  const query = useQuery({
    queryKey: incidentKeys.all,
    queryFn: async () => (await api.listIncidents()).incidents,
    staleTime: 15_000,
  });
  return query;
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => api.getIncident(id),
    enabled: !!id,
    staleTime: 5_000,
  });
}

/** Invalida incidentes y unidades: cualquier cambio de estado afecta a ambos. */
export function useRefreshOperations() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: incidentKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["units"] });
    void queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };
}

export function useUpdateIncidentStatus() {
  const refresh = useRefreshOperations();
  const queryClient = useQueryClient();

  return async (id: string, status: IncidentStatus, note?: string) => {
    try {
      await api.setIncidentStatus(id, status, note);
      refresh();
      void queryClient.invalidateQueries({ queryKey: incidentKeys.detail(id) });
      return true;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo cambiar el estado");
      return false;
    }
  };
}

export function useDispatchUnit() {
  const refresh = useRefreshOperations();
  const queryClient = useQueryClient();

  return async (incidentId: string, unitId: string) => {
    try {
      const { unit } = await api.dispatch(incidentId, unitId);
      toast.success(`Unidad ${unit.callsign} despachada`);
      refresh();
      void queryClient.invalidateQueries({ queryKey: incidentKeys.detail(incidentId) });
      return true;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo despachar la unidad");
      return false;
    }
  };
}
