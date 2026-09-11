import { C4_ROLES, HttpError, requireSession } from "@/server/auth";
import { changeIncidentStatus, findIncident, findUserById } from "@/server/db";
import { fail, handle, json, readJson } from "@/server/http";
import type { IncidentStatus } from "@/types/incident.types";

export const runtime = "nodejs";

const VALID: IncidentStatus[] = [
  "nueva", "recibida", "en_validacion", "asignada", "en_camino",
  "en_sitio", "atendiendo", "resuelta", "cerrada", "cancelada",
];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireSession();
    const { id } = await context.params;
    const body = await readJson(request);
    const status = body.status as IncidentStatus;
    if (!VALID.includes(status)) return fail(400, "Estado inválido");

    const incident = findIncident(id);
    if (!incident) throw new HttpError(404, "Incidente no encontrado");

    // El ciudadano solo puede cancelar su propia alerta.
    if (session.role === "ciudadano") {
      if (incident.reportedByUserId !== session.userId) throw new HttpError(403, "No es tu alerta");
      if (status !== "cancelada") throw new HttpError(403, "Solo puedes cancelar tu alerta");
    }
    // La unidad solo actúa sobre el incidente que tiene asignado.
    if (session.role === "unidad") {
      const unitId = findUserById(session.userId)?.unitId;
      if (incident.assignedUnitId !== unitId) throw new HttpError(403, "No es tu servicio");
      if (!["en_camino", "en_sitio", "atendiendo", "resuelta"].includes(status)) {
        throw new HttpError(403, "Estado no permitido para una unidad");
      }
    }
    if (!C4_ROLES.includes(session.role) && session.role !== "ciudadano" && session.role !== "unidad") {
      throw new HttpError(403, "Sin permiso");
    }

    const result = changeIncidentStatus({
      incidentId: incident.id,
      status,
      actor: session,
      note: typeof body.note === "string" ? body.note.slice(0, 500) : undefined,
      force: session.role !== "ciudadano" && C4_ROLES.includes(session.role),
    });
    if (result.error) return fail(409, result.error);
    return json({ incident: result.incident });
  });
}
