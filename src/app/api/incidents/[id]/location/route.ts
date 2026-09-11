import { HttpError, requireSession } from "@/server/auth";
import { appendCitizenLocation, findIncident } from "@/server/db";
import { handle, json, readJson, requireCoords } from "@/server/http";

export const runtime = "nodejs";

/**
 * El ciudadano comparte su ubicación mientras la emergencia está activa.
 * Al cerrar el incidente deja de aceptarse: la ubicación no se rastrea
 * fuera de una emergencia (§24 privacidad).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireSession("ciudadano");
    const { id } = await context.params;
    const incident = findIncident(id);
    if (!incident) throw new HttpError(404, "Incidente no encontrado");
    if (incident.reportedByUserId !== session.userId) throw new HttpError(403, "No es tu alerta");
    if (incident.status === "cerrada" || incident.status === "cancelada") {
      throw new HttpError(409, "La emergencia ya está cerrada: no se registran más ubicaciones");
    }

    const coords = requireCoords(await readJson(request));
    const updated = appendCitizenLocation(incident.id, coords);
    return json({ incident: updated });
  });
}
