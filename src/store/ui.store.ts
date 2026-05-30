import { create } from "zustand";
import type { IncidentStatus } from "@/types/incident.types";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;

  mapActiveFilters: IncidentStatus[];
  setMapActiveFilters: (filters: IncidentStatus[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  selectedIncidentId: null,
  setSelectedIncidentId: (id) => set({ selectedIncidentId: id }),

  mapActiveFilters: ["nueva", "aceptada", "en_camino", "atendiendo"],
  setMapActiveFilters: (filters) => set({ mapActiveFilters: filters }),
}));
