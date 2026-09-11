import { currentSession } from "@/server/auth";
import { findUnit, findUserById } from "@/server/db";
import { handle, json } from "@/server/http";
import { ensureSimulator } from "@/server/simulator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    ensureSimulator();
    const session = await currentSession();
    if (!session) return json({ user: null });
    const user = findUserById(session.userId);
    if (!user) return json({ user: null });
    return json({ user, unit: user.unitId ? findUnit(user.unitId) : null });
  });
}
