import { emit } from "./bus";
import {
  changeIncidentStatus,
  findIncident,
  getDb,
  listUnits,
  setUnitAvailability,
} from "./db";
import { bearing, distanceMeters, moveToward } from "./geo";
import type { Session } from "@/types/user.types";

/**
 * Simulador de GPS para unidades de respuesta.
 *
 * PUNTO DE INTEGRACIÓN: en producción las posiciones llegan por
 * `POST /api/units/location` desde el dispositivo de la unidad. Este simulador
 * solo mueve unidades que no tienen hardware real, para poder demostrar el
 * flujo completo sin depender de equipos en calle.
 */

const TICK_MS = 1000;
/** Velocidad de desplazamiento de las unidades simuladas (km/h). */
const SPEED_KMH = Number(process.env.NASS_SIM_SPEED_KMH ?? 55);
/** Distancia a la que se considera que la unidad llegó al lugar. */
const ARRIVAL_METERS = 45;
/** Si nadie acepta el despacho desde el panel de unidad, se acepta solo. */
const AUTO_ACCEPT_MS = 6000;

const SYSTEM_ACTOR: Session = {
  userId: "SYS-SIM",
  name: "Simulador NASS",
  role: "unidad",
};

export function ensureSimulator(): void {
  const g = globalThis as typeof globalThis & { __nassSimulator?: NodeJS.Timeout };
  if (g.__nassSimulator) return;
  if (process.env.NASS_SIMULATOR === "off") return;
  g.__nassSimulator = setInterval(tick, TICK_MS);
}

function tick() {
  const metersPerTick = (SPEED_KMH * 1000 / 3600) * (TICK_MS / 1000);
  const now = Date.now();

  for (const unit of listUnits()) {
    if (!unit.assignedIncidentId) continue;
    const incident = findIncident(unit.assignedIncidentId);
    if (!incident || ["cerrada", "cancelada", "resuelta"].includes(incident.status)) continue;

    // 1. Aceptación del despacho.
    if (unit.availability === "despachada") {
      const dispatchedAt = incident.dispatchedAt ? Date.parse(incident.dispatchedAt) : now;
      if (now - dispatchedAt >= AUTO_ACCEPT_MS) acceptDispatch(unit.id);
      continue;
    }

    if (unit.availability !== "en_camino") continue;

    // 2. Desplazamiento hacia el incidente.
    const remaining = distanceMeters(unit.currentLocation, incident.location);
    if (remaining <= ARRIVAL_METERS) {
      unit.speed = 0;
      unit.currentLocation = { ...incident.location };
      unit.lastUpdated = new Date().toISOString();
      emit({ type: "unit.location.updated", unit });
      changeIncidentStatus({
        incidentId: incident.id,
        status: "en_sitio",
        actor: { userId: unit.id, name: unit.callsign, role: "unidad" },
        note: "Unidad en el lugar de los hechos",
        location: unit.currentLocation,
        force: true,
      });
      continue;
    }

    unit.heading = Math.round(bearing(unit.currentLocation, incident.location));
    unit.currentLocation = moveToward(unit.currentLocation, incident.location, metersPerTick);
    unit.speed = Math.round(SPEED_KMH + (Math.random() * 10 - 5));
    unit.accuracy = 5 + Math.round(Math.random() * 6);
    unit.lastUpdated = new Date().toISOString();
    emit({ type: "unit.location.updated", unit });
  }
}

/** La unidad acepta el servicio: pasa a EN CAMINO y empieza a moverse. */
export function acceptDispatch(unitId: string, actor: Session = SYSTEM_ACTOR) {
  const unit = listUnits().find((u) => u.id === unitId);
  if (!unit || !unit.assignedIncidentId) return;
  const incident = findIncident(unit.assignedIncidentId);
  if (!incident) return;

  setUnitAvailability(unit.id, "en_camino");
  unit.assignedIncidentId = incident.id;
  emit({ type: "unit.accepted", unit, incidentId: incident.id });

  changeIncidentStatus({
    incidentId: incident.id,
    status: "en_camino",
    actor: actor === SYSTEM_ACTOR ? { userId: unit.id, name: unit.callsign, role: "unidad" } : actor,
    note: "Unidad aceptó el servicio y se desplaza al lugar",
    force: true,
  });
}

/** Escalamiento: alerta crítica sin atender más allá del tiempo configurado. */
export function pendingEscalations(): Array<{ code: string; secondsWaiting: number }> {
  const db = getDb();
  const threshold = db.settings.escalationCriticalSeconds * 1000;
  const now = Date.now();
  return db.incidents
    .filter((i) => i.priority === "critica" && i.status === "nueva")
    .map((i) => ({ code: i.code, secondsWaiting: Math.round((now - Date.parse(i.reportedAt)) / 1000) }))
    .filter((i) => i.secondsWaiting * 1000 >= threshold);
}
