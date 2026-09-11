import { hashPassword, requireSession } from "@/server/auth";
import { findUserByEmail, getDb, listUsers, recordAudit } from "@/server/db";
import { fail, handle, json, readJson, requireString } from "@/server/http";
import type { User, UserRole } from "@/types/user.types";

const ASSIGNABLE_ROLES: UserRole[] = ["super_admin", "operador", "supervisor", "ciudadano"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handle(async () => {
    await requireSession("super_admin", "supervisor", "operador");
    const role = new URL(request.url).searchParams.get("role") as UserRole | null;
    return json({ users: listUsers(role ?? undefined) });
  });
}

/** Creación de cuentas desde administración (§4 super admin). */
export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireSession("super_admin");
    const body = await readJson(request);
    const name = requireString(body.name, "name", 120);
    const email = requireString(body.email, "email", 160).toLowerCase();
    const password = requireString(body.password, "password", 200);
    const role = body.role as UserRole;

    if (!ASSIGNABLE_ROLES.includes(role)) return fail(400, "Rol no asignable desde administración");
    if (password.length < 8) return fail(400, "La contraseña debe tener al menos 8 caracteres");
    if (findUserByEmail(email)) return fail(409, "Ya existe una cuenta con ese correo");

    const db = getDb();
    const user: User = {
      id: `USR-${String(db.users.length + 1).padStart(3, "0")}`,
      name,
      email,
      role,
      status: "activo",
      phone: typeof body.phone === "string" ? body.phone.slice(0, 40) : undefined,
      createdAt: new Date().toISOString(),
      avatarInitials: name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
    };
    db.users.push(user);
    db.credentials[email] = hashPassword(password);

    recordAudit({
      actor: session,
      action: "user.created",
      resourceType: "user",
      resourceId: user.id,
      metadata: { rol: role },
    });
    return json({ user }, 201);
  });
}
