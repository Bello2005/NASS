import type { QuibdoZone, GeoPoint } from "./incident.types";

/** RBAC — los cinco roles del sistema NASS. */
export type UserRole = "super_admin" | "operador" | "supervisor" | "unidad" | "ciudadano";

export type UserStatus = "activo" | "suspendido";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  zone?: QuibdoZone;
  createdAt: string;
  lastLoginAt?: string;
  avatarInitials: string;
  /** Presente solo cuando el usuario es una unidad de respuesta. */
  unitId?: string;
  /** Última ubicación conocida del ciudadano (solo durante una emergencia activa). */
  lastLocation?: GeoPoint;
}

/** Usuario tal como viaja al cliente: nunca incluye credenciales. */
export type PublicUser = Omit<User, never>;

export interface Session {
  userId: string;
  role: UserRole;
  name: string;
}
