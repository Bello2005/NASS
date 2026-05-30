import type { GeoPoint } from "./incident.types";
import type { UserRole } from "./user.types";

export type AgentAvailability = "disponible" | "en_servicio" | "fuera_servicio";

export interface Agent {
  id: string;
  name: string;
  badge: string;
  role: UserRole;
  availability: AgentAvailability;
  currentLocation: GeoPoint;
  assignedIncidentId?: string;
  lastUpdated: string;
}
