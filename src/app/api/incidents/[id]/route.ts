import { C4_ROLES, HttpError, requireSession } from "@/server/auth";
import { findIncident, findUnit, findUserById, listMessages } from "@/server/db";
import { availableUnitsNear } from "@/server/db";
import { handle, json } from "@/server/http";

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
