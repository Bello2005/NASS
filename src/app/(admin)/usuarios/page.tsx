"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleBadge } from "@/components/usuarios/RoleBadge";
import { UserFormDialog } from "@/components/usuarios/UserFormDialog";
import { useUsers, useUserMutations } from "@/hooks/useUsers";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { User, UserRole } from "@/types/user.types";
import type { QuibdoZone } from "@/types/incident.types";
import { Users } from "lucide-react";

export default function UsuariosPage() {
  const { data: users, isLoading } = useUsers();
  const mutations = useUserMutations();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const filtered = (users ?? []).filter(
    (u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (data: { name: string; email: string; role: UserRole; phone?: string; zone?: QuibdoZone }) => {
    mutations.createUser(data);
    toast.success(`Usuario ${data.name} creado correctamente`);
  };

  const handleEdit = (data: { name: string; email: string; role: UserRole; phone?: string; zone?: QuibdoZone }) => {
    if (!editUser) return;
    mutations.updateUser(editUser.id, data);
    toast.success("Usuario actualizado");
    setEditUser(null);
  };

  const handleToggle = (user: User) => {
    mutations.toggleUserStatus(user.id);
    const next = user.status === "activo" ? "suspendido" : "activo";
    toast.success(`${user.name} marcado como ${next}`);
  };

  const handleDelete = (user: User) => {
    mutations.deleteUser(user.id);
    toast.success(`${user.name} eliminado`);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader
        title="Gestión de Usuarios"
        subtitle={`${(users ?? []).length} usuarios registrados`}
        actions={
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuario..."
          className="pl-9 bg-card border-border h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Sin usuarios" description="No se encontraron usuarios" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-xs text-muted-foreground font-medium">Usuario</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium w-24">Rol</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium w-20">Estado</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium w-24">Zona</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium w-28">Registrado</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} className="border-border hover:bg-accent/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {user.avatarInitials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><RoleBadge role={user.role} /></TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium",
                      user.status === "activo" ? "text-green-400" : "text-muted-foreground"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", user.status === "activo" ? "bg-green-500" : "bg-zinc-600")} />
                      {user.status === "activo" ? "Activo" : "Suspendido"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{user.zone ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setEditUser(user)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleToggle(user)}>
                        {user.status === "activo"
                          ? <ToggleRight className="w-3.5 h-3.5 text-green-400" />
                          : <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => handleDelete(user)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      <UserFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} mode="create" />
      {editUser && (
        <UserFormDialog open={!!editUser} onClose={() => setEditUser(null)} onSubmit={handleEdit} initial={editUser} mode="edit" />
      )}
    </div>
  );
}
