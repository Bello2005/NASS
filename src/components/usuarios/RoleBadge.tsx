import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user.types";

const roleClasses: Record<UserRole, string> = {
  admin:   "bg-purple-950 text-purple-300 border-purple-800",
  lider:   "bg-blue-950 text-blue-300 border-blue-800",
  partner: "bg-zinc-800 text-zinc-300 border-zinc-700",
};

const roleLabels: Record<UserRole, string> = {
  admin:   "Admin",
  lider:   "Líder",
  partner: "Partner",
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border", roleClasses[role], className)}>
      {roleLabels[role]}
    </span>
  );
}
