import type { IncidentCategory, IncidentStatus, IncidentSeverity, QuibdoZone } from "@/types/incident.types";
import type { UserRole } from "@/types/user.types";
import type { AgentAvailability } from "@/types/agent.types";

export const QUIBDO_CENTER: [number, number] = [5.6919, -76.6583];

export const ZONE_LIST: QuibdoZone[] = [
  "Centro", "Cristo Rey", "Huapango", "San Vicente", "Kennedy", "La Yesca", "Chambacú",
];

export const ZONE_COORDS: Record<QuibdoZone, [number, number]> = {
  Centro:       [5.6942, -76.6601],
  "Cristo Rey": [5.6870, -76.6520],
  Huapango:     [5.7010, -76.6480],
  "San Vicente":[5.6880, -76.6700],
  Kennedy:      [5.6960, -76.6640],
  "La Yesca":   [5.6830, -76.6560],
  Chambacú:     [5.7050, -76.6550],
};

export const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string; cssVar: string }> = {
  nueva:      { label: "Nueva",      color: "#8a8a8a", cssVar: "var(--status-nueva)" },
  aceptada:   { label: "Aceptada",   color: "#4a90d9", cssVar: "var(--status-aceptada)" },
  en_camino:  { label: "En camino",  color: "#d4a017", cssVar: "var(--status-en-camino)" },
  atendiendo: { label: "Atendiendo", color: "#d97706", cssVar: "var(--status-atendiendo)" },
  cerrada:    { label: "Cerrada",    color: "#16a34a", cssVar: "var(--status-cerrada)" },
  cancelada:  { label: "Cancelada",  color: "#dc2626", cssVar: "var(--status-cancelada)" },
};

export const SEVERITY_CONFIG: Record<IncidentSeverity, { label: string; color: string; cssVar: string }> = {
  1: { label: "Baja",     color: "#16a34a", cssVar: "var(--severity-1)" },
  2: { label: "Media",    color: "#ca8a04", cssVar: "var(--severity-2)" },
  3: { label: "Alta",     color: "#d97706", cssVar: "var(--severity-3)" },
  4: { label: "Crítica",  color: "#dc2626", cssVar: "var(--severity-4)" },
  5: { label: "Extrema",  color: "#7f1d1d", cssVar: "var(--severity-5)" },
};

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  robo:     "Robo",
  agresion: "Agresión",
  accidente:"Accidente",
  incendio: "Incendio",
  disturbio:"Disturbio",
  hurto:    "Hurto",
  otro:     "Otro",
};

export const ROLE_CONFIG: Record<UserRole, { label: string; cssVar: string }> = {
  admin:   { label: "Administrador", cssVar: "var(--role-admin)" },
  lider:   { label: "Líder",        cssVar: "var(--role-lider)" },
  partner: { label: "Partner",      cssVar: "var(--role-partner)" },
};

export const AVAILABILITY_CONFIG: Record<AgentAvailability, { label: string; color: string }> = {
  disponible:    { label: "Disponible",    color: "#16a34a" },
  en_servicio:   { label: "En servicio",  color: "#d97706" },
  fuera_servicio:{ label: "Fuera servicio",color: "#8a8a8a" },
};
