// Modelo de dominio NASS — alineado con el flujo CIUDADANO → C4 → DESPACHO → CIERRE

/** Máquina de estados del incidente (10 estados del protocolo NASS). */
export type IncidentStatus =
  | "nueva"
  | "recibida"
  | "en_validacion"
  | "asignada"
  | "en_camino"
  | "en_sitio"
  | "atendiendo"
  | "resuelta"
  | "cerrada"
  | "cancelada";

/** Prioridad operativa. Determina el color y el orden en el centro de despacho. */
export type IncidentPriority = "critica" | "alta" | "media" | "baja";

/** Severidad numérica derivada de la prioridad (se conserva para gráficas y filtros). */
export type IncidentSeverity = 1 | 2 | 3 | 4 | 5;

export type IncidentCategory =
  | "emergencia_medica"
  | "robo"
  | "hurto"
  | "violencia"
  | "violencia_intrafamiliar"
  | "persona_sospechosa"
  | "accidente"
  | "incendio"
  | "amenaza"
  | "persona_desaparecida"
  | "emergencia_ambiental"
  | "riesgo_comunitario"
  | "agresion"
  | "disturbio"
  | "otro";

/** Origen de la alerta: botón de pánico, reporte manual o simulador. */
export type IncidentSource = "panico" | "reporte" | "simulador";

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
  /** Ubicación desde donde se registró el evento, cuando aplica. */
  location?: GeoPoint;
}

export interface IncidentMessage {
  id: string;
  incidentId: string;
  senderId: string;
  senderName: string;
  senderRole: "ciudadano" | "operador" | "unidad";
  body: string;
  createdAt: string;
}

export interface Evidence {
  id: string;
  incidentId: string;
  type: "foto" | "video" | "audio";
  fileUrl: string;
  /** Hash de integridad para cadena de custodia digital. */
  hash: string;
  uploaderId: string;
  createdAt: string;
  metadata?: Record<string, string | number>;
}

export interface Incident {
  id: string;
  /** Consecutivo legible para operación y radio: NASS-000123 */
  code: string;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  priority: IncidentPriority;
  severity: IncidentSeverity;
  source: IncidentSource;
  zone: QuibdoZone;
  location: GeoPoint;
  /** Precisión del GPS en metros reportada por el dispositivo. */
  accuracy?: number;
  address: string;
  reportedAt: string;
  updatedAt: string;
  /** Momento en que el operador toma el caso — base del KPI de tiempo de respuesta. */
  acknowledgedAt?: string;
  dispatchedAt?: string;
  arrivedAt?: string;
  closedAt?: string;
  reportedByUserId: string;
  reportedByName: string;
  reportedByPhone?: string;
  assignedUnitId?: string;
  operatorId?: string;
  timeline: TimelineEvent[];
  /** Rastro de posiciones del ciudadano mientras la emergencia está activa. */
  locationTrail: Array<GeoPoint & { timestamp: string }>;
}

/** Estados que ya no requieren atención operativa. */
export const CLOSED_STATUSES: IncidentStatus[] = ["cerrada", "cancelada", "resuelta"];

export function isActiveStatus(status: IncidentStatus): boolean {
  return status !== "cerrada" && status !== "cancelada";
}
