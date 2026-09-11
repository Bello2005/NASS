import { HttpError, requireSession } from "@/server/auth";
import { findUserById, recordAudit, updateUnitLocation } from "@/server/db";
import { handle, json, readJson, requireCoords } from "@/server/http";

export const runtime = "nodejs";

/**
 * Ping de GPS de una unidad de respuesta.
 * PUNTO DE INTEGRACIÓN: el dispositivo de la unidad (móvil o AVL vehicular)
 * publica aquí su posición. El simulador usa la misma ruta interna.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession("unidad", "super_admin", "operador");
    const body = await readJson(request);
    const coords = requireCoords(body);

    const unitId = session.role === "unidad"
      ? findUserById(session.userId)?.unitId
      : typeof body.unitId === "string" ? body.unitId : undefined;
    if (!unitId) throw new HttpError(400, "No se pudo determinar la unidad");

    const unit = updateUnitLocation(unitId, {
      ...coords,
      speed: typeof body.speed === "number" ? body.speed : undefined,
      heading: typeof body.heading === "number" ? body.heading : undefined,
      accuracy: typeof body.accuracy === "number" ? body.accuracy : undefined,
    });
    if (!unit) throw new HttpError(404, "Unidad no encontrada");

    recordAudit({
      actor: session,
      action: "unit.position_updated",
      resourceType: "unit",
      resourceId: unit.callsign,
      metadata: { lat: coords.lat, lng: coords.lng },
    });
    return json({ unit });
  });
}
