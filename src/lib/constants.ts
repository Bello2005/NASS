import type {
  IncidentCategory,
  IncidentPriority,
  IncidentSeverity,
  IncidentStatus,
  QuibdoZone,
} from "@/types/incident.types";
import type { Institution, UnitAvailability } from "@/types/unit.types";
import type { UserRole } from "@/types/user.types";

export const QUIBDO_CENTER: [number, number] = [5.6919, -76.6583];

export const ZONE_LIST: QuibdoZone[] = [
  "Centro", "Cristo Rey", "Huapango", "San Vicente", "Kennedy", "La Yesca", "Chambacú",
];

export const ZONE_COORDS: Record<QuibdoZone, [number, number]> = {
  Centro:        [5.6942, -76.6601],
  "Cristo Rey":  [5.6870, -76.6520],
  Huapango:      [5.7010, -76.6480],
  "San Vicente": [5.6880, -76.6700],
  Kennedy:       [5.6960, -76.6640],
  "La Yesca":    [5.6830, -76.6560],
  Chambacú:      [5.7050, -76.6550],
};

/** Orden operativo de la máquina de estados. */
export const STATUS_ORDER: IncidentStatus[] = [
  "nueva", "recibida", "en_validacion", "asignada", "en_camino",
  "en_sitio", "atendiendo", "resuelta", "cerrada", "cancelada",
];

export const STATUS_CONFIG: Record<IncidentStatus, { label: string; short: string; color: string }> = {
  nueva:         { label: "Nueva",         short: "NUEVA",     color: "#ef4444" },
  recibida:      { label: "Recibida",      short: "RECIBIDA",  color: "#f97316" },
  en_validacion: { label: "En validación", short: "VALIDANDO", color: "#eab308" },
  asignada:      { label: "Asignada",      short: "ASIGNADA",  color: "#4a90d9" },
  en_camino:     { label: "En camino",     short: "EN CAMINO", color: "#38bdf8" },
  en_sitio:      { label: "En el sitio",   short: "EN SITIO",  color: "#a78bfa" },
  atendiendo:    { label: "En atención",   short: "ATENDIENDO",color: "#d97706" },
  resuelta:      { label: "Resuelta",      short: "RESUELTA",  color: "#22c55e" },
  cerrada:       { label: "Cerrada",       short: "CERRADA",   color: "#16a34a" },
  cancelada:     { label: "Cancelada",     short: "CANCELADA", color: "#6b7280" },
};

/** Estados que el centro de despacho vigila en el mapa. */
export const ACTIVE_STATUSES: IncidentStatus[] = [
  "nueva", "recibida", "en_validacion", "asignada", "en_camino", "en_sitio", "atendiendo",
];

export const PRIORITY_CONFIG: Record<IncidentPriority, { label: string; color: string; severity: IncidentSeverity }> = {
  critica: { label: "Crítica", color: "#dc2626", severity: 5 },
  alta:    { label: "Alta",    color: "#ea580c", severity: 4 },
  media:   { label: "Media",   color: "#ca8a04", severity: 3 },
  baja:    { label: "Baja",    color: "#16a34a", severity: 2 },
};

export const PRIORITY_LIST: IncidentPriority[] = ["critica", "alta", "media", "baja"];

export const SEVERITY_CONFIG: Record<IncidentSeverity, { label: string; color: string; cssVar: string }> = {
  1: { label: "Baja",    color: "#16a34a", cssVar: "var(--severity-1)" },
  2: { label: "Baja",    color: "#16a34a", cssVar: "var(--severity-1)" },
  3: { label: "Media",   color: "#ca8a04", cssVar: "var(--severity-2)" },
  4: { label: "Alta",    color: "#ea580c", cssVar: "var(--severity-3)" },
  5: { label: "Crítica", color: "#dc2626", cssVar: "var(--severity-4)" },
};

/** Catálogo de tipos de incidente. Configurable desde administración. */
export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  emergencia_medica:       "Emergencia médica",
  robo:                    "Robo",
  hurto:                   "Hurto",
  violencia:               "Violencia",
  violencia_intrafamiliar: "Violencia intrafamiliar",
  persona_sospechosa:      "Persona sospechosa",
  accidente:               "Accidente",
  incendio:                "Incendio",
  amenaza:                 "Amenaza",
  persona_desaparecida:    "Persona desaparecida",
  emergencia_ambiental:    "Emergencia ambiental",
  riesgo_comunitario:      "Riesgo comunitario",
  agresion:                "Agresión",
  disturbio:               "Disturbio",
  otro:                    "Otro",
};

/** Categorías ofrecidas al ciudadano al reportar, en orden de uso esperado. */
export const CITIZEN_CATEGORIES: IncidentCategory[] = [
  "emergencia_medica", "robo", "hurto", "violencia", "violencia_intrafamiliar",
  "persona_sospechosa", "accidente", "incendio", "amenaza",
  "persona_desaparecida", "emergencia_ambiental", "riesgo_comunitario", "otro",
];

export const ROLE_CONFIG: Record<UserRole, { label: string; cssVar: string }> = {
  super_admin: { label: "Super Admin", cssVar: "var(--role-admin)" },
  operador:    { label: "Operador C4", cssVar: "var(--role-lider)" },
  supervisor:  { label: "Supervisor",  cssVar: "var(--role-admin)" },
  unidad:      { label: "Unidad",      cssVar: "var(--role-lider)" },
  ciudadano:   { label: "Ciudadano",   cssVar: "var(--role-partner)" },
};

export const INSTITUTION_CONFIG: Record<Institution, { label: string; color: string; icon: string }> = {
  policia:    { label: "Policía",           color: "#3b82f6", icon: "🛡" },
  ambulancia: { label: "Ambulancia",        color: "#ef4444", icon: "✚" },
  bomberos:   { label: "Bomberos",          color: "#f97316", icon: "🔥" },
  seguridad:  { label: "Seguridad privada", color: "#a855f7", icon: "◆" },
};

export const AVAILABILITY_CONFIG: Record<UnitAvailability, { label: string; color: string }> = {
  disponible:     { label: "Disponible",     color: "#16a34a" },
  despachada:     { label: "Despachada",     color: "#4a90d9" },
  en_camino:      { label: "En camino",      color: "#38bdf8" },
  en_sitio:       { label: "En el sitio",    color: "#a78bfa" },
  ocupada:        { label: "Ocupada",        color: "#d97706" },
  fuera_servicio: { label: "Fuera servicio", color: "#6b7280" },
};

/** Duración de la cuenta regresiva del botón de pánico, en segundos. */
export const PANIC_COUNTDOWN_SECONDS = 5;
