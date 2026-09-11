import { requireSession } from "@/server/auth";
import { getDb } from "@/server/db";
import { handle, json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** La auditoría solo es visible para administración y supervisión. */
export async function GET(request: Request) {
  return handle(async () => {
    await requireSession("super_admin", "supervisor");
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 200), 1000);
    const query = url.searchParams.get("q")?.toLowerCase();

    let entries = getDb().audit;
    if (query) {
      entries = entries.filter((entry) =>
        entry.actorName.toLowerCase().includes(query) ||
        entry.action.toLowerCase().includes(query) ||
        entry.resourceId.toLowerCase().includes(query),
      );
    }
    return json({ entries: entries.slice(0, limit) });
  });
}
