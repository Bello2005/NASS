import { requireSession } from "@/server/auth";
import { listUnits } from "@/server/db";
import { handle, json } from "@/server/http";
import { ensureSimulator } from "@/server/simulator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    ensureSimulator();
    // Las unidades son visibles para el C4 y para las propias unidades.
    await requireSession("super_admin", "operador", "supervisor", "unidad");
    return json({ units: listUnits() });
  });
}
