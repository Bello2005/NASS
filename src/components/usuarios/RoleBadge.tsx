import { cn } from "@/lib/utils";
import { ROLE_CONFIG } from "@/lib/constants";
import type { UserRole } from "@/types/user.types";

const roleClasses: Record<UserRole, string> = {
  super_admin: "bg-purple-950 text-purple-300 border-purple-800",
  operador:    "bg-blue-950 text-blue-300 border-blue-800",
  supervisor:  "bg-indigo-950 text-indigo-300 border-indigo-800",
  unidad:      "bg-sky-950 text-sky-300 border-sky-800",
  ciudadano:   "bg-zinc-800 text-zinc-300 border-zinc-700",
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", roleClasses[role], className)}>
      {ROLE_CONFIG[role].label}
    </span>
  );
}
