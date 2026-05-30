"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZONE_LIST } from "@/lib/constants";
import type { User, UserRole } from "@/types/user.types";
import type { QuibdoZone } from "@/types/incident.types";

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; role: UserRole; phone?: string; zone?: QuibdoZone }) => void;
  initial?: Partial<User>;
  mode?: "create" | "edit";
}

export function UserFormDialog({ open, onClose, onSubmit, initial, mode = "create" }: UserFormDialogProps) {
  const [name,  setName]  = useState(initial?.name  ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role,  setRole]  = useState<UserRole>(initial?.role ?? "partner");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [zone,  setZone]  = useState<QuibdoZone | "">(initial?.zone ?? "");

  const valid = name.trim() && email.trim() && email.includes("@");

  const handleSubmit = () => {
    if (!valid) return;
    onSubmit({ name: name.trim(), email: email.trim(), role, phone: phone || undefined, zone: (zone || undefined) as QuibdoZone | undefined });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nuevo usuario" : "Editar usuario"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Nombre completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Carlos Mosquera" className="bg-background border-border" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@nass.gov.co" className="bg-background border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="lider">Líder</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Zona (opcional)</Label>
              <Select value={zone} onValueChange={(v) => setZone(v as QuibdoZone)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Sin zona" />
                </SelectTrigger>
                <SelectContent>
                  {ZONE_LIST.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs">Teléfono (opcional)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 310 555 0000" className="bg-background border-border" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!valid} onClick={handleSubmit}>
            {mode === "create" ? "Crear usuario" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
