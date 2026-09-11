import { emit } from "./bus";
import { distanceMeters, zoneForPoint } from "./geo";
import { buildSeed } from "./seed";
import type { PasswordHash } from "./auth";
import type { AuditAction, AuditEntry } from "@/types/audit.types";
import type {
  GeoPoint,
  Incident,
  IncidentCategory,
  IncidentMessage,
  IncidentPriority,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
} from "@/types/incident.types";
import type { Institution, Unit, UnitAvailability } from "@/types/unit.types";
import type { Session, User, UserRole } from "@/types/user.types";

/**
 * Almacén de datos en memoria.
 *
 * PUNTO DE INTEGRACIÓN: este módulo es la única frontera con la persistencia.
 * Para pasar a PostgreSQL basta reimplementar estas funciones contra el motor
 * real; las rutas de la API y el frontend no cambian.
 */
export interface NassDb {
  users: User[];
  credentials: Record<string, PasswordHash>;
  units: Unit[];
  incidents: Incident[];
  messages: IncidentMessage[];
  audit: AuditEntry[];
  sequence: number;
  settings: {
    /** Segundos sin atender antes de notificar al supervisor (escalamiento). */
    escalationCriticalSeconds: number;
    countdownSeconds: number;
  };
}

export function getDb(): NassDb {
  const g = globalThis as typeof globalThis & { __nassDb?: NassDb };
  if (!g.__nassDb) {
    const seed = buildSeed();
    g.__nassDb = {
      users: seed.users,
      credentials: seed.credentials,
      units: seed.units,
      incidents: seed.incidents,
      messages: [],
      audit: [],
      sequence: seed.sequence,
      settings: { escalationCriticalSeconds: 120, countdownSeconds: 5 },
    };
    seedAuditTrail(g.__nassDb);
  }
  return g.__nassDb;
}

function seedAuditTrail(db: NassDb) {
  // La auditoría histórica se deriva de la línea de tiempo real de cada incidente.
  const recent = db.incidents.slice(0, 40);
  for (const incident of recent) {
    for (const event of incident.timeline) {
      const actor = db.users.find((u) => u.id === event.actorId);
      db.audit.push({
        id: `AUD-${db.audit.length + 1}`,
        timestamp: event.timestamp,
        actorId: event.actorId,
        actorName: event.actorName,
        actorRole: actor?.role ?? "unidad",
        action: event.status === "nueva" ? "incident.created" : "incident.status_changed",
        resourceType: "incident",
        resourceId: incident.code,
        metadata: { estado: event.status, zona: incident.zone },
        ipAddress: "10.0.1.24",
      });
    }
  }
  db.audit.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// --- Auditoría --------------------------------------------------------------

export function recordAudit(params: {
  actor: Session | { userId: string; name: string; role: UserRole };
  action: AuditAction;
  resourceType: AuditEntry["resourceType"];
  resourceId: string;
  metadata?: Record<string, string | number>;
  ipAddress?: string;
}): void {
  const db = getDb();
  db.audit.unshift({
    id: `AUD-${Date.now()}-${db.audit.length}`,
    timestamp: new Date().toISOString(),
    actorId: params.actor.userId,
    actorName: params.actor.name,
    actorRole: params.actor.role,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    metadata: params.metadata ?? {},
    ipAddress: params.ipAddress ?? "127.0.0.1",
  });
  if (db.audit.length > 2000) db.audit.length = 2000;
}

// --- Usuarios ---------------------------------------------------------------

export const findUserByEmail = (email: string): User | undefined =>
  getDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

export const findUserById = (id: string): User | undefined =>
  getDb().users.find((u) => u.id === id);

export function listUsers(role?: UserRole): User[] {
  const users = getDb().users;
  return role ? users.filter((u) => u.role === role) : users;
}

// --- Unidades ---------------------------------------------------------------

export const listUnits = (): Unit[] => getDb().units;
export const findUnit = (id: string): Unit | undefined => getDb().units.find((u) => u.id === id);

export function updateUnitLocation(
  unitId: string,
  ping: { lat: number; lng: number; speed?: number; heading?: number; accuracy?: number },
): Unit | undefined {
  const unit = findUnit(unitId);
  if (!unit) return undefined;
  unit.currentLocation = { lat: ping.lat, lng: ping.lng };
  unit.speed = ping.speed ?? unit.speed;
  unit.heading = ping.heading ?? unit.heading;
  unit.accuracy = ping.accuracy ?? unit.accuracy;
  unit.lastUpdated = new Date().toISOString();
  unit.online = true;
  emit({ type: "unit.location.updated", unit });
  return unit;
}

export function setUnitAvailability(unitId: string, availability: UnitAvailability): Unit | undefined {
  const unit = findUnit(unitId);
  if (!unit) return undefined;
  unit.availability = availability;
  unit.lastUpdated = new Date().toISOString();
  if (availability === "disponible") {
    unit.assignedIncidentId = undefined;
    unit.speed = 0;
  }
  emit({ type: "unit.status.changed", unit });
  return unit;
}

/**
 * Protocolos de respuesta (§33): qué institución atiende cada tipo de incidente.
 * Configurable desde administración — no hay lógica de despacho escrita a mano.
 */
export const RESPONSE_PROTOCOLS: Partial<Record<IncidentCategory, Institution>> = {
  emergencia_medica: "ambulancia",
  accidente: "ambulancia",
  incendio: "bomberos",
  emergencia_ambiental: "bomberos",
  robo: "policia",
  hurto: "policia",
  violencia: "policia",
  violencia_intrafamiliar: "policia",
  amenaza: "policia",
  persona_sospechosa: "policia",
  persona_desaparecida: "policia",
  agresion: "policia",
  disturbio: "policia",
  riesgo_comunitario: "seguridad",
};

/**
 * Unidades disponibles ordenadas por protocolo y luego por cercanía:
 * una emergencia médica ofrece primero la ambulancia, aunque una patrulla
 * esté algo más cerca. El operador siempre puede elegir otra.
 */
export function availableUnitsNear(
  point: GeoPoint,
  category?: IncidentCategory,
): Array<Unit & { distanceMeters: number; recommended: boolean }> {
  const preferred = category ? RESPONSE_PROTOCOLS[category] : undefined;
  return listUnits()
    .filter((unit) => unit.availability === "disponible" && unit.online)
    .map((unit) => ({
      ...unit,
      distanceMeters: Math.round(distanceMeters(unit.currentLocation, point)),
      recommended: !!preferred && unit.institution === preferred,
    }))
    .sort((a, b) => {
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
      return a.distanceMeters - b.distanceMeters;
    });
}

// --- Incidentes -------------------------------------------------------------

const PRIORITY_SEVERITY: Record<IncidentPriority, IncidentSeverity> = {
  critica: 5, alta: 4, media: 3, baja: 2,
};

export const listIncidents = (): Incident[] => getDb().incidents;
export const findIncident = (id: string): Incident | undefined =>
  getDb().incidents.find((i) => i.id === id || i.code === id);

export interface CreateIncidentInput {
  citizen: { id: string; name: string; phone?: string };
  category: IncidentCategory;
  priority: IncidentPriority;
  source: IncidentSource;
  location: GeoPoint;
  accuracy?: number;
  title?: string;
  description?: string;
  address?: string;
}

export function createIncident(input: CreateIncidentInput): Incident {
  const db = getDb();
  db.sequence += 1;
  const now = new Date().toISOString();
  const zone = zoneForPoint(input.location);

  const incident: Incident = {
    id: `INC-${String(db.sequence).padStart(6, "0")}`,
    code: `NASS-${String(db.sequence).padStart(6, "0")}`,
    title: input.title ?? (input.source === "panico" ? "Botón de pánico activado" : "Reporte ciudadano"),
    description: input.description ?? (input.source === "panico"
      ? "Alerta generada desde el botón de pánico de la app ciudadana."
      : "Reporte enviado por el ciudadano."),
    category: input.category,
    status: "nueva",
    priority: input.priority,
    severity: PRIORITY_SEVERITY[input.priority],
    source: input.source,
    zone,
    location: input.location,
    accuracy: input.accuracy,
    address: input.address ?? `Zona ${zone} · coordenadas capturadas por GPS`,
    reportedAt: now,
    updatedAt: now,
    reportedByUserId: input.citizen.id,
    reportedByName: input.citizen.name,
    reportedByPhone: input.citizen.phone,
    timeline: [
      {
        id: `TL-${Date.now()}`,
        timestamp: now,
        status: "nueva",
        actorId: input.citizen.id,
        actorName: input.citizen.name,
        note: input.source === "panico" ? "Botón de pánico activado" : "Reporte enviado",
        location: input.location,
      },
    ],
    locationTrail: [{ ...input.location, timestamp: now }],
  };

  db.incidents.unshift(incident);
  recordAudit({
    actor: { userId: input.citizen.id, name: input.citizen.name, role: "ciudadano" },
    action: "incident.created",
    resourceType: "incident",
    resourceId: incident.code,
    metadata: { tipo: input.category, prioridad: input.priority, zona: zone },
  });
  emit({ type: "incident.created", incident });
  return incident;
}

/** Transiciones válidas de la máquina de estados. */
const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  nueva: ["recibida", "en_validacion", "cancelada"],
  recibida: ["en_validacion", "asignada", "cancelada"],
  en_validacion: ["asignada", "cancelada"],
  asignada: ["en_camino", "cancelada"],
  en_camino: ["en_sitio", "cancelada"],
  en_sitio: ["atendiendo", "cancelada"],
  atendiendo: ["resuelta", "cancelada"],
  resuelta: ["cerrada"],
  cerrada: [],
  cancelada: [],
};

export function canTransition(from: IncidentStatus, to: IncidentStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function changeIncidentStatus(params: {
  incidentId: string;
  status: IncidentStatus;
  actor: Session;
  note?: string;
  location?: GeoPoint;
  force?: boolean;
}): { incident?: Incident; error?: string } {
  const incident = findIncident(params.incidentId);
  if (!incident) return { error: "Incidente no encontrado" };
  if (incident.status === params.status) return { incident };
  if (!params.force && !canTransition(incident.status, params.status)) {
    return { error: `Transición no permitida: ${incident.status} → ${params.status}` };
  }

  const previous = incident.status;
  const now = new Date().toISOString();
  incident.status = params.status;
  incident.updatedAt = now;

  if (params.status === "recibida" && !incident.acknowledgedAt) {
    incident.acknowledgedAt = now;
    incident.operatorId = params.actor.userId;
  }
  if (params.status === "en_sitio" && !incident.arrivedAt) incident.arrivedAt = now;
  if (params.status === "cerrada" || params.status === "cancelada") incident.closedAt = now;

  incident.timeline.push({
    id: `TL-${Date.now()}`,
    timestamp: now,
    status: params.status,
    actorId: params.actor.userId,
    actorName: params.actor.name,
    note: params.note,
    location: params.location,
  });

  // La unidad se libera cuando el caso termina.
  if (incident.assignedUnitId) {
    const unit = findUnit(incident.assignedUnitId);
    if (unit) {
      if (params.status === "en_camino") setUnitAvailability(unit.id, "en_camino");
      else if (params.status === "en_sitio") setUnitAvailability(unit.id, "en_sitio");
      else if (params.status === "atendiendo") setUnitAvailability(unit.id, "ocupada");
      else if (["cerrada", "cancelada", "resuelta"].includes(params.status)) {
        setUnitAvailability(unit.id, "disponible");
      }
    }
  }

  recordAudit({
    actor: params.actor,
    action: params.status === "cerrada" ? "incident.closed"
      : params.status === "cancelada" ? "incident.cancelled"
      : "incident.status_changed",
    resourceType: "incident",
    resourceId: incident.code,
    metadata: { anterior: previous, nuevo: params.status, ...(params.note ? { nota: params.note } : {}) },
  });

  emit({ type: "incident.updated", incident });
  if (params.status === "cerrada" || params.status === "cancelada") {
    emit({ type: "incident.closed", incident });
  }
  return { incident };
}

export function dispatchUnit(params: {
  incidentId: string;
  unitId: string;
  actor: Session;
  note?: string;
}): { incident?: Incident; unit?: Unit; error?: string } {
  const incident = findIncident(params.incidentId);
  if (!incident) return { error: "Incidente no encontrado" };
  const unit = findUnit(params.unitId);
  if (!unit) return { error: "Unidad no encontrada" };
  if (unit.availability !== "disponible") return { error: `La unidad ${unit.callsign} no está disponible` };

  const now = new Date().toISOString();

  // Liberar una unidad previamente asignada (reasignación).
  if (incident.assignedUnitId && incident.assignedUnitId !== unit.id) {
    setUnitAvailability(incident.assignedUnitId, "disponible");
  }

  incident.assignedUnitId = unit.id;
  incident.operatorId = params.actor.userId;
  incident.dispatchedAt = incident.dispatchedAt ?? now;
  incident.status = "asignada";
  incident.updatedAt = now;
  incident.acknowledgedAt = incident.acknowledgedAt ?? now;
  incident.timeline.push({
    id: `TL-${Date.now()}`,
    timestamp: now,
    status: "asignada",
    actorId: params.actor.userId,
    actorName: params.actor.name,
    note: params.note ?? `Unidad ${unit.callsign} despachada`,
  });

  unit.availability = "despachada";
  unit.assignedIncidentId = incident.id;
  unit.lastUpdated = now;

  recordAudit({
    actor: params.actor,
    action: "incident.dispatched",
    resourceType: "incident",
    resourceId: incident.code,
    metadata: { unidad: unit.callsign, institucion: unit.institution },
  });

  emit({ type: "incident.assigned", incident, unit });
  emit({ type: "unit.dispatched", unit, incidentId: incident.id });
  emit({ type: "incident.updated", incident });
  return { incident, unit };
}

export function appendCitizenLocation(incidentId: string, point: GeoPoint): Incident | undefined {
  const incident = findIncident(incidentId);
  if (!incident) return undefined;
  incident.locationTrail.push({ ...point, timestamp: new Date().toISOString() });
  if (incident.locationTrail.length > 200) incident.locationTrail.shift();
  incident.location = point;
  incident.updatedAt = new Date().toISOString();
  emit({ type: "incident.updated", incident });
  return incident;
}

// --- Mensajería -------------------------------------------------------------

export function listMessages(incidentId: string): IncidentMessage[] {
  const incident = findIncident(incidentId);
  if (!incident) return [];
  return getDb().messages.filter((m) => m.incidentId === incident.id);
}

export function addMessage(params: {
  incidentId: string;
  actor: Session;
  body: string;
}): { message?: IncidentMessage; error?: string } {
  const incident = findIncident(params.incidentId);
  if (!incident) return { error: "Incidente no encontrado" };
  const body = params.body.trim();
  if (!body) return { error: "El mensaje está vacío" };

  const senderRole: IncidentMessage["senderRole"] =
    params.actor.role === "ciudadano" ? "ciudadano"
    : params.actor.role === "unidad" ? "unidad"
    : "operador";

  const message: IncidentMessage = {
    id: `MSG-${Date.now()}-${getDb().messages.length}`,
    incidentId: incident.id,
    senderId: params.actor.userId,
    senderName: params.actor.name,
    senderRole,
    body: body.slice(0, 1000),
    createdAt: new Date().toISOString(),
  };

  getDb().messages.push(message);
  emit({ type: "message.created", message });
  return { message };
}
