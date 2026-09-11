import { HttpError, requireSession } from "@/server/auth";
import { findUnit, findUserById } from "@/server/db";
import { handle, json } from "@/server/http";
import { acceptDispatch } from "@/server/simulator";

export const runtime = "nodejs";

/** La unidad acepta el servicio despachado y comienza a desplazarse. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireSession("unidad", "super_admin", "operador");
    const { id } = await context.params;
    if (session.role === "unidad" && findUserById(session.userId)?.unitId !== id) {
      throw new HttpError(403, "No es tu unidad");
    }
    const unit = findUnit(id);
    if (!unit) throw new HttpError(404, "Unidad no encontrada");
    if (!unit.assignedIncidentId) throw new HttpError(409, "La unidad no tiene un servicio asignado");

    acceptDispatch(id, session);
    return json({ unit: findUnit(id) });
  });
}
