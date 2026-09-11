import { C4_ROLES, HttpError, requireSession } from "@/server/auth";
import { addMessage, findIncident, findUserById, listMessages, recordAudit } from "@/server/db";
import { fail, handle, json, readJson, requireString } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function assertAccess(id: string, session: { userId: string; role: string }) {
  const incident = findIncident(id);
  if (!incident) throw new HttpError(404, "Incidente no encontrado");
  const isC4 = C4_ROLES.includes(session.role as never);
  const isOwner = incident.reportedByUserId === session.userId;
  const isUnit = incident.assignedUnitId === findUserById(session.userId)?.unitId;
  if (!isC4 && !isOwner && !isUnit) throw new HttpError(403, "Sin acceso a esta conversación");
  return incident;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireSession();
    const { id } = await context.params;
    const incident = await assertAccess(id, session);
    return json({ messages: listMessages(incident.id) });
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireSession();
    const { id } = await context.params;
    const incident = await assertAccess(id, session);
    const body = await readJson(request);
    const text = requireString(body.body ?? body.message, "body", 1000);

    const result = addMessage({ incidentId: incident.id, actor: session, body: text });
    if (result.error) return fail(400, result.error);
    recordAudit({
      actor: session,
      action: "message.created",
      resourceType: "message",
      resourceId: incident.code,
    });
    return json({ message: result.message }, 201);
  });
}
