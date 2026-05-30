import type { QuibdoZone } from "./incident.types";

export type UserRole = "admin" | "lider" | "partner";
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
}
