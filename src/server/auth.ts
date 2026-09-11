import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Session, User, UserRole } from "@/types/user.types";

export const SESSION_COOKIE = "nass_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

/**
 * Secreto de firma. En producción debe venir de NASS_AUTH_SECRET.
 * En desarrollo se genera uno efímero por proceso: nunca hay secretos en el código.
 */
function secret(): string {
  const fromEnv = process.env.NASS_AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  const g = globalThis as typeof globalThis & { __nassDevSecret?: string };
  if (!g.__nassDevSecret) g.__nassDevSecret = randomBytes(32).toString("hex");
  return g.__nassDevSecret;
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64url");

// --- Contraseñas -----------------------------------------------------------

export interface PasswordHash {
  salt: string;
  hash: string;
}

export function hashPassword(password: string): PasswordHash {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, stored: PasswordHash): boolean {
  const candidate = scryptSync(password, stored.salt, 64);
  const expected = Buffer.from(stored.hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// --- Tokens de sesión ------------------------------------------------------

interface TokenPayload extends Session {
  exp: number;
}

export function signSession(session: Session): string {
  const payload: TokenPayload = { ...session, exp: Date.now() + SESSION_TTL_SECONDS * 1000 };
  const body = b64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

// --- Helpers de request ----------------------------------------------------

export async function setSessionCookie(user: User): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession({ userId: user.id, role: user.role, name: user.name }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function currentSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Devuelve la sesión o lanza una respuesta 401/403 lista para el route handler. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireSession(...allowed: UserRole[]): Promise<Session> {
  const session = await currentSession();
  if (!session) throw new HttpError(401, "Sesión requerida");
  if (allowed.length > 0 && !allowed.includes(session.role)) {
    throw new HttpError(403, "Tu rol no tiene permiso para esta operación");
  }
  return session;
}

/** Roles con acceso al centro de despacho. */
export const C4_ROLES: UserRole[] = ["super_admin", "operador", "supervisor"];
