import { verifyPassword, setSessionCookie } from "@/server/auth";
import { findUserByEmail, getDb, recordAudit } from "@/server/db";
import { clientIp, fail, handle, json, rateLimit, readJson, requireString } from "@/server/http";
import { ensureSimulator } from "@/server/simulator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handle(async () => {
    const ip = clientIp(request);
    rateLimit(`login:${ip}`, 10, 60_000);
    ensureSimulator();

    const body = await readJson(request);
    const email = requireString(body.email, "email", 160);
    const password = requireString(body.password, "password", 200);

    const user = findUserByEmail(email);
    const stored = getDb().credentials[email.toLowerCase()];
    // Respuesta idéntica ante usuario inexistente o contraseña incorrecta.
    if (!user || !stored || !verifyPassword(password, stored)) {
      return fail(401, "Credenciales incorrectas");
    }
    if (user.status !== "activo") return fail(403, "La cuenta está suspendida");

    user.lastLoginAt = new Date().toISOString();
    await setSessionCookie(user);
    recordAudit({
      actor: { userId: user.id, name: user.name, role: user.role },
      action: "session.login",
      resourceType: "session",
      resourceId: user.id,
      metadata: { rol: user.role },
      ipAddress: ip,
    });

    return json({ user });
  });
}
