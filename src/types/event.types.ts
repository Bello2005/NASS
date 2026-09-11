import type { Incident, IncidentMessage } from "./incident.types";
import type { Unit } from "./unit.types";

/** Eventos del bus en tiempo real. Todo cliente suscrito a /api/events los recibe. */
export type NassEvent =
  | { type: "incident.created"; incident: Incident }
  | { type: "incident.updated"; incident: Incident }
  | { type: "incident.assigned"; incident: Incident; unit: Unit }
  | { type: "incident.closed"; incident: Incident }
  | { type: "unit.dispatched"; unit: Unit; incidentId: string }
  | { type: "unit.accepted"; unit: Unit; incidentId: string }
  | { type: "unit.location.updated"; unit: Unit }
  | { type: "unit.status.changed"; unit: Unit }
  | { type: "message.created"; message: IncidentMessage }
  | { type: "heartbeat"; at: string };

export type NassEventType = NassEvent["type"];
