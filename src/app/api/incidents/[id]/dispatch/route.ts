import { C4_ROLES, requireSession } from "@/server/auth";
import { dispatchUnit } from "@/server/db";
import { fail, handle, json, readJson, requireString } from "@/server/http";

export const runtime = "nodejs";

/** Despacha una unidad al incidente. Solo el centro de despacho. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireSession(...C4_ROLES);
    const { id } = await context.params;
    const body = await readJson(request);
    const unitId = requireString(body.unitId, "unitId", 40);

    const result = dispatchUnit({
      incidentId: id,
      unitId,
      actor: session,
      note: typeof body.note === "string" ? body.note.slice(0, 300) : undefined,
    });
    if (result.error) return fail(409, result.error);
    return json({ incident: result.incident, unit: result.unit });
  });
}
