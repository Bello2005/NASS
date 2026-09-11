import { C4_ROLES, HttpError, requireSession } from "@/server/auth";
import { findIncident, findUnit, findUserById, listMessages, reclassifyIncident } from "@/server/db";
import { availableUnitsNear } from "@/server/db";
import { fail, handle, json, readJson } from "@/server/http";
import { CATEGORY_LABELS, PRIORITY_CONFIG } from "@/lib/constants";
import type { IncidentCategory, IncidentPriority } from "@/types/incident.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireSession();
    const { id } = await context.params;
    const incident = findIncident(id);
    if (!incident) throw new HttpError(404, "Incidente no encontrado");

    const isC4 = C4_ROLES.includes(session.role);
    const isOwner = incident.reportedByUserId === session.userId;
    const isAssignedUnit = incident.assignedUnitId === findUserById(session.userId)?.unitId;
    if (!isC4 && !isOwner && !isAssignedUnit) {
      throw new HttpError(403, "No tienes acceso a este incidente");
    }

    return json({
      incident,
      unit: incident.assignedUnitId ? findUnit(incident.assignedUnitId) : null,
      messages: listMessages(incident.id),
      // Las unidades candidatas solo se exponen al centro de despacho.
      availableUnits: isC4 ? availableUnitsNear(incident.location, incident.category).slice(0, 8) : undefined,
    });
  });
}

/** Reclasificación del incidente por parte del centro de despacho (§3). */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireSession(...C4_ROLES);
    const { id } = await context.params;
    const body = await readJson(request);

    const category = body.category as IncidentCategory | undefined;
    const priority = body.priority as IncidentPriority | undefined;
    if (category && !(category in CATEGORY_LABELS)) return fail(400, "Tipo de incidente inválido");
    if (priority && !(priority in PRIORITY_CONFIG)) return fail(400, "Prioridad inválida");

    const result = reclassifyIncident({
      incidentId: id,
      actor: session,
      category,
      priority,
      note: typeof body.note === "string" ? body.note.slice(0, 500) : undefined,
    });
    if (result.error) return fail(404, result.error);
    return json({ incident: result.incident });
  });
}
