"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_CONFIG } from "@/lib/constants";
import { ApiError } from "@/lib/api";
import type { UserRole } from "@/types/user.types";

const ASSIGNABLE: UserRole[] = ["operador", "supervisor", "super_admin", "ciudadano"];

/** Crea cuentas del sistema. Las unidades se crean junto con su vehículo. */
export function UserFormDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("operador");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new ApiError(response.status, body.error ?? "No se pudo crear el usuario");
      }
      toast.success("Usuario creado");
      setOpen(false);
      setName(""); setEmail(""); setPassword("");
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo crear el usuario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm">Nuevo usuario</Button>}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Nombre completo</Label>
            <Input id="user-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Correo</Label>
            <Input id="user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">Contraseña temporal</Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <div className="flex flex-wrap gap-2">
              {ASSIGNABLE.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    role === option
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {ROLE_CONFIG[option].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !name || !email || password.length < 8}>
            {saving ? "Creando…" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
