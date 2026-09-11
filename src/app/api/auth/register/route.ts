import { hashPassword, setSessionCookie } from "@/server/auth";
import { findUserByEmail, getDb, recordAudit } from "@/server/db";
import { clientIp, fail, handle, json, rateLimit, readJson, requireString } from "@/server/http";
import type { User } from "@/types/user.types";

export const runtime = "nodejs";

/** Registro público: solo crea cuentas de ciudadano. */
export async function POST(request: Request) {
  return handle(async () => {
    const ip = clientIp(request);
    rateLimit(`register:${ip}`, 5, 60_000);

    const body = await readJson(request);
    const name = requireString(body.name, "name", 120);
    const email = requireString(body.email, "email", 160).toLowerCase();
    const password = requireString(body.password, "password", 200);
    const phone = typeof body.phone === "string" ? body.phone.slice(0, 40) : undefined;

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(400, "Correo inválido");
    if (password.length < 8) return fail(400, "La contraseña debe tener al menos 8 caracteres");
    if (findUserByEmail(email)) return fail(409, "Ya existe una cuenta con ese correo");

    const db = getDb();
    const user: User = {
      id: `USR-C${String(db.users.length + 1).padStart(3, "0")}`,
      name,
      email,
      role: "ciudadano",
      status: "activo",
      phone,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      avatarInitials: name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase(),
    };
    db.users.push(user);
    db.credentials[email] = hashPassword(password);

    await setSessionCookie(user);
    recordAudit({
      actor: { userId: user.id, name: user.name, role: user.role },
      action: "user.created",
      resourceType: "user",
      resourceId: user.id,
      metadata: { rol: "ciudadano" },
      ipAddress: ip,
    });

    return json({ user }, 201);
  });
}
