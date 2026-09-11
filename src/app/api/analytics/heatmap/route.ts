import { requireSession } from "@/server/auth";
import { buildHeatmap } from "@/server/analytics";
import { handle, json } from "@/server/http";
import type { IncidentCategory, IncidentPriority, QuibdoZone } from "@/types/incident.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handle(async () => {
    await requireSession("super_admin", "operador", "supervisor");
    const params = new URL(request.url).searchParams;
    const days = Math.min(Math.max(Number(params.get("days") ?? 30), 1), 365);
    return json(buildHeatmap({
      days,
      category: (params.get("category") as IncidentCategory) ?? undefined,
      zone: (params.get("zone") as QuibdoZone) ?? undefined,
      priority: (params.get("priority") as IncidentPriority) ?? undefined,
    }));
  });
}
