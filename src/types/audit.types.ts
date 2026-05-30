import type { UserRole } from "./user.types";

export type AuditAction =
  | "incident.created"
  | "incident.status_changed"
  | "incident.assigned"
  | "incident.cancelled"
  | "user.created"
  | "user.updated"
  | "user.suspended"
  | "user.reactivated"
  | "agent.position_updated"
  | "session.login"
  | "session.logout";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  resourceType: "incident" | "user" | "agent" | "session";
  resourceId: string;
  metadata: Record<string, string | number>;
  ipAddress: string;
}
