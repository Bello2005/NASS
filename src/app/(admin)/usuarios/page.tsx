"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleBadge } from "@/components/usuarios/RoleBadge";
import { UserFormDialog } from "@/components/usuarios/UserFormDialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_CONFIG } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/date";
import { useUsers } from "@/hooks/useUsers";
import type { UserRole } from "@/types/user.types";

const ROLE_FILTERS: Array<UserRole | "todos"> = [
  "todos", "super_admin", "operador", "supervisor", "unidad", "ciudadano",
];

export default function UsuariosPage() {
  const { data: users, isLoading, refetch } = useUsers();
  const [role, setRole] = useState<UserRole | "todos">("todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (users ?? []).filter((user) => {
      if (role !== "todos" && user.role !== role) return false;
      if (!term) return true;
      return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
    });
  }, [users, role, search]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <PageHeader
        title="Usuarios"
        subtitle="Ciudadanos, operadores, supervisores y unidades registradas"
        actions={<UserFormDialog onSaved={() => refetch()} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        {ROLE_FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRole(option)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              role === option
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {option === "todos" ? "Todos" : ROLE_CONFIG[option].label}
            <span className="ml-1.5 tabular-nums opacity-70">
              {option === "todos"
                ? users?.length ?? 0
                : (users ?? []).filter((user) => user.role === option).length}
            </span>
          </button>
        ))}
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o correo"
          className="ml-auto max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((key) => <Skeleton key={key} className="h-12" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Sin usuarios" description="Ajusta los filtros o crea una cuenta nueva." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Usuario</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Zona</th>
                <th className="px-3 py-2 font-medium">Registro</th>
                <th className="px-3 py-2 font-medium">Último acceso</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                        {user.avatarInitials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{user.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2"><RoleBadge role={user.role} /></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{user.zone ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Nunca"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs font-medium ${
                        user.status === "activo" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {user.status === "activo" ? "Activo" : "Suspendido"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
