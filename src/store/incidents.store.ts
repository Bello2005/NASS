import { create } from "zustand";
import { mockIncidents } from "@/mocks/incidents.mock";
import type { Incident, IncidentStatus } from "@/types/incident.types";

interface IncidentsState {
  incidents: Incident[];
  updateIncidentStatus: (id: string, status: IncidentStatus, actorName: string, actorId: string, note?: string) => void;
  assignAgent: (incidentId: string, agentId: string) => void;
}

export const useIncidentsStore = create<IncidentsState>((set) => ({
  incidents: mockIncidents,

  updateIncidentStatus: (id, status, actorName, actorId, note) =>
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id !== id
          ? inc
          : {
              ...inc,
              status,
              updatedAt: new Date().toISOString(),
              closedAt: status === "cerrada" ? new Date().toISOString() : inc.closedAt,
              timeline: [
                ...inc.timeline,
                {
                  id: `TL-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  status,
                  actorName,
                  actorId,
                  note,
                },
              ],
            }
      ),
    })),

  assignAgent: (incidentId, agentId) =>
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId ? { ...inc, assignedAgentId: agentId } : inc
      ),
    })),
}));
