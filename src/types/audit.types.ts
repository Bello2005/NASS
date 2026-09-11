import type { UserRole } from "./user.types";

export type AuditAction =
  | "incident.created"
  | "incident.status_changed"
  | "incident.assigned"
  | "incident.dispatched"
  | "incident.cancelled"
  | "incident.closed"
  | "message.created"
  | "user.created"
  | "user.updated"
  | "user.suspended"
  | "user.reactivated"
  | "unit.position_updated"
  | "unit.status_changed"
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
  resourceType: "incident" | "user" | "unit" | "agent" | "session" | "message";
  resourceId: string;
  metadata: Record<string, string | number>;
  ipAddress: string;
}
