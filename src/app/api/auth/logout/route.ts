import { clearSessionCookie, currentSession } from "@/server/auth";
import { recordAudit } from "@/server/db";
import { handle, json } from "@/server/http";

export const runtime = "nodejs";

export async function POST() {
  return handle(async () => {
    const session = await currentSession();
    if (session) {
      recordAudit({ actor: session, action: "session.logout", resourceType: "session", resourceId: session.userId });
    }
    await clearSessionCookie();
    return json({ ok: true });
  });
}
