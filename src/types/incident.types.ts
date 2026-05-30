export type IncidentStatus =
  | "nueva"
  | "aceptada"
  | "en_camino"
  | "atendiendo"
  | "cerrada"
  | "cancelada";

export type IncidentSeverity = 1 | 2 | 3 | 4 | 5;

export type IncidentCategory =
  | "robo"
  | "agresion"
  | "accidente"
  | "incendio"
  | "disturbio"
  | "hurto"
  | "otro";

export type QuibdoZone =
  | "Centro"
  | "Cristo Rey"
  | "Huapango"
  | "San Vicente"
  | "Kennedy"
  | "La Yesca"
  | "Chambacú";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: IncidentStatus;
  actorName: string;
  actorId: string;
  note?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  severity: IncidentSeverity;
  zone: QuibdoZone;
  location: GeoPoint;
  address: string;
  reportedAt: string;
  updatedAt: string;
  closedAt?: string;
  reportedByUserId: string;
  assignedAgentId?: string;
  timeline: TimelineEvent[];
}
