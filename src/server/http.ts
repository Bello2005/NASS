import { NextResponse } from "next/server";
import { HttpError } from "./auth";

export const json = <T,>(data: T, status = 200) => NextResponse.json(data, { status });
export const fail = (status: number, message: string) => NextResponse.json({ error: message }, { status });

/** Envuelve un handler y traduce HttpError a la respuesta correspondiente. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError) return fail(error.status, error.message);
    console.error("[NASS] error no controlado:", error);
    return fail(500, "Error interno del servidor");
  }
}

/** Lee y valida el cuerpo JSON de una petición. */
export async function readJson<T extends Record<string, unknown>>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") throw new HttpError(400, "Cuerpo inválido");
    return body as T;
  } catch {
    throw new HttpError(400, "Se esperaba un cuerpo JSON válido");
  }
}

export function requireString(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `El campo "${field}" es obligatorio`);
  }
  if (value.length > max) throw new HttpError(400, `El campo "${field}" excede ${max} caracteres`);
  return value.trim();
}

export function requireNumber(value: unknown, field: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new HttpError(400, `El campo "${field}" debe ser numérico`);
  return parsed;
}

export function requireCoords(body: Record<string, unknown>): { lat: number; lng: number } {
  const lat = requireNumber(body.lat ?? body.latitude, "lat");
  const lng = requireNumber(body.lng ?? body.longitude, "lng");
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new HttpError(400, "Coordenadas fuera de rango");
  }
  return { lat, lng };
}

// --- Rate limiting ----------------------------------------------------------

interface Bucket { count: number; resetAt: number }

function buckets(): Map<string, Bucket> {
  const g = globalThis as typeof globalThis & { __nassRate?: Map<string, Bucket> };
  if (!g.__nassRate) g.__nassRate = new Map();
  return g.__nassRate;
}

/** Limita peticiones por clave (IP + ruta). Lanza 429 al superar el límite. */
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const store = buckets();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new HttpError(429, "Demasiadas peticiones. Espera unos segundos.");
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "127.0.0.1";
}
