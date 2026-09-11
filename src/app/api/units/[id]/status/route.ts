import { HttpError, requireSession } from "@/server/auth";
import { findUnit, findUserById, recordAudit, setUnitAvailability } from "@/server/db";
import { fail, handle, json, readJson } from "@/server/http";
import type { UnitAvailability } from "@/types/unit.types";

export const runtime = "nodejs";

const VALID: UnitAvailability[] = [
  "disponible", "despachada", "en_camino", "en_sitio", "ocupada", "fuera_servicio",
];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireSession("unidad", "super_admin", "operador", "supervisor");
    const { id } = await context.params;
    const body = await readJson(request);
    const availability = body.availability as UnitAvailability;
    if (!VALID.includes(availability)) return fail(400, "Disponibilidad inválida");

    // Una unidad solo puede cambiar su propio estado.
    if (session.role === "unidad" && findUserById(session.userId)?.unitId !== id) {
      throw new HttpError(403, "Solo puedes cambiar el estado de tu unidad");
    }
    const unit = findUnit(id);
    if (!unit) throw new HttpError(404, "Unidad no encontrada");

    setUnitAvailability(id, availability);
    recordAudit({
      actor: session,
      action: "unit.status_changed",
      resourceType: "unit",
      resourceId: unit.callsign,
      metadata: { estado: availability },
    });
    return json({ unit: findUnit(id) });
  });
}
