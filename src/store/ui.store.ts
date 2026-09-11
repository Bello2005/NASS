import { create } from "zustand";
import type { IncidentStatus } from "@/types/incident.types";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;

  mapActiveFilters: IncidentStatus[];
  setMapActiveFilters: (filters: IncidentStatus[]) => void;

  /** Estado de la conexión de tiempo real, alimentado por RealtimeAlerts. */
  realtimeConnected: boolean;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  selectedIncidentId: null,
  setSelectedIncidentId: (id) => set({ selectedIncidentId: id }),

  mapActiveFilters: ["nueva", "recibida", "asignada", "en_camino", "en_sitio", "atendiendo"],
  setMapActiveFilters: (filters) => set({ mapActiveFilters: filters }),

  realtimeConnected: false,
}));
