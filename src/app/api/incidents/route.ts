import { C4_ROLES, requireSession } from "@/server/auth";
import { createIncident, findUserById, listIncidents } from "@/server/db";
import { clientIp, handle, json, rateLimit, readJson, requireCoords } from "@/server/http";
import { ensureSimulator } from "@/server/simulator";
import type { Incident, IncidentCategory, IncidentPriority, IncidentSource } from "@/types/incident.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_PRIORITY: Record<string, IncidentPriority> = {
  emergencia_medica: "critica", incendio: "critica",
  violencia: "alta", violencia_intrafamiliar: "alta", robo: "alta",
  accidente: "alta", amenaza: "alta", persona_desaparecida: "alta", agresion: "alta",
  hurto: "media", persona_sospechosa: "media", disturbio: "media", emergencia_ambiental: "media",
  riesgo_comunitario: "baja", otro: "baja",
};

/**
 * Control de acceso por incidente (§24 privacidad):
 * el ciudadano solo ve los suyos, la unidad solo los que tiene asignados,
 * y el C4 ve todo el territorio.
 */
function scopeForSession(incidents: Incident[], session: { userId: string; role: string }): Incident[] {
  if (C4_ROLES.includes(session.role as never)) return incidents;
  if (session.role === "ciudadano") {
    return incidents.filter((i) => i.reportedByUserId === session.userId);
  }
  const unitId = findUserById(session.userId)?.unitId;
  return incidents.filter((i) => i.assignedUnitId === unitId);
}

export async function GET(request: Request) {
  return handle(async () => {
    ensureSimulator();
    const session = await requireSession();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const activeOnly = url.searchParams.get("active") === "true";
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 500), 1000);

    let incidents = scopeForSession(listIncidents(), session);
    if (status) incidents = incidents.filter((i) => i.status === status);
    if (activeOnly) incidents = incidents.filter((i) => i.status !== "cerrada" && i.status !== "cancelada");

    return json({ incidents: incidents.slice(0, limit) });
  });
}

/** Crea una alerta. El botón de pánico envía `source: "panico"`. */
export async function POST(request: Request) {
  return handle(async () => {
    ensureSimulator();
    const session = await requireSession("ciudadano", "super_admin", "operador");
    rateLimit(`incident:${clientIp(request)}`, 12, 60_000);

    const body = await readJson(request);
    const location = requireCoords(body);
    const category = (typeof body.category === "string" ? body.category : "otro") as IncidentCategory;
    const source = (body.source === "reporte" || body.source === "simulador" ? body.source : "panico") as IncidentSource;
    const priority = (typeof body.priority === "string" && ["critica", "alta", "media", "baja"].includes(body.priority)
      ? body.priority
      : CATEGORY_PRIORITY[category] ?? "alta") as IncidentPriority;

    const user = findUserById(session.userId);
    const incident = createIncident({
      citizen: { id: session.userId, name: user?.name ?? session.name, phone: user?.phone },
      category,
      priority,
      source,
      location,
      accuracy: typeof body.accuracy === "number" ? Math.round(body.accuracy) : undefined,
      title: typeof body.title === "string" ? body.title.slice(0, 140) : undefined,
      description: typeof body.description === "string" ? body.description.slice(0, 1000) : undefined,
      address: typeof body.address === "string" ? body.address.slice(0, 200) : undefined,
    });

    return json({ incident }, 201);
  });
}
