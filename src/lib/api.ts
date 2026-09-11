import type { AuditEntry } from "@/types/audit.types";
import type { Incident, IncidentMessage, IncidentStatus } from "@/types/incident.types";
import type { Unit, UnitAvailability } from "@/types/unit.types";
import type { User } from "@/types/user.types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "same-origin",
  });

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.error === "string") message = body.error;
    } catch {
      // Respuesta sin cuerpo JSON: se conserva el mensaje genérico.
    }
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
const patch = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });

export interface UnitWithDistance extends Unit {
  distanceMeters: number;
  /** La institución coincide con el protocolo de respuesta del tipo de incidente. */
  recommended: boolean;
}

export interface IncidentDetail {
  incident: Incident;
  unit: Unit | null;
  messages: IncidentMessage[];
  availableUnits?: UnitWithDistance[];
}

export const api = {
  // Autenticación
  login: (email: string, password: string) => post<{ user: User }>("/auth/login", { email, password }),
  register: (input: { name: string; email: string; password: string; phone?: string }) =>
    post<{ user: User }>("/auth/register", input),
  logout: () => post<{ ok: boolean }>("/auth/logout"),
  me: () => request<{ user: User | null; unit?: Unit | null }>("/auth/me"),

  // Incidentes
  listIncidents: (params?: { active?: boolean; status?: IncidentStatus }) => {
    const search = new URLSearchParams();
    if (params?.active) search.set("active", "true");
    if (params?.status) search.set("status", params.status);
    const qs = search.toString();
    return request<{ incidents: Incident[] }>(`/incidents${qs ? `?${qs}` : ""}`);
  },
  getIncident: (id: string) => request<IncidentDetail>(`/incidents/${id}`),
  createIncident: (input: {
    lat: number; lng: number; accuracy?: number; category: string;
    source?: "panico" | "reporte"; description?: string; title?: string; priority?: string;
  }) => post<{ incident: Incident }>("/incidents", input),
  setIncidentStatus: (id: string, status: IncidentStatus, note?: string) =>
    patch<{ incident: Incident }>(`/incidents/${id}/status`, { status, note }),
  reclassify: (id: string, changes: { category?: string; priority?: string }) =>
    patch<{ incident: Incident }>(`/incidents/${id}`, changes),
  dispatch: (id: string, unitId: string, note?: string) =>
    post<{ incident: Incident; unit: Unit }>(`/incidents/${id}/dispatch`, { unitId, note }),
  listMessages: (id: string) => request<{ messages: IncidentMessage[] }>(`/incidents/${id}/messages`),
  sendMessage: (id: string, body: string) =>
    post<{ message: IncidentMessage }>(`/incidents/${id}/messages`, { body }),
  shareLocation: (id: string, lat: number, lng: number) =>
    post<{ incident: Incident }>(`/incidents/${id}/location`, { lat, lng }),

  // Unidades
  listUnits: () => request<{ units: Unit[] }>("/units"),
  pushUnitLocation: (input: { lat: number; lng: number; unitId?: string; speed?: number; heading?: number }) =>
    post<{ unit: Unit }>("/units/location", input),
  setUnitAvailability: (id: string, availability: UnitAvailability) =>
    patch<{ unit: Unit }>(`/units/${id}/status`, { availability }),
  acceptDispatch: (id: string) => post<{ unit: Unit }>(`/units/${id}/accept`),

  // Analítica y auditoría
  summary: (days: number) => request<AnalyticsSummary>(`/analytics/summary?days=${days}`),
  heatmap: (days: number) => request<HeatmapResponse>(`/analytics/heatmap?days=${days}`),
  audit: (query?: string) => request<{ entries: AuditEntry[] }>(`/audit${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  users: () => request<{ users: User[] }>("/users"),
};

export interface AnalyticsSummary {
  range: { days: number };
  kpis: {
    activos: number;
    atendidos: number;
    totalPeriodo: number;
    tiempoRespuestaMin: number;
    tiempoDespachoMin: number;
    tiempoLlegadaMin: number;
    unidadesDisponibles: number;
    unidadesOcupadas: number;
    unidadesTotal: number;
    tasaResolucion: number;
    criticasActivas: number;
  };
  series: Array<{ date: string; label: string; nuevas: number; cerradas: number; criticas: number }>;
  byHour: Array<{ hour: number; count: number }>;
  byCategory: Array<{ key: string; count: number }>;
  byZone: Array<{ key: string; count: number }>;
  byStatus: Array<{ key: IncidentStatus; count: number }>;
  byPriority: Array<{ key: string; count: number }>;
  grid: number[][];
}

export interface HeatmapResponse {
  points: Array<{ lat: number; lng: number; weight: number }>;
  max: number;
  total: number;
}
