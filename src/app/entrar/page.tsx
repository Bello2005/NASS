"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { useInvalidateSession } from "@/hooks/useSession";
import type { UserRole } from "@/types/user.types";

const HOME_BY_ROLE: Record<UserRole, string> = {
  super_admin: "/dashboard",
  operador: "/dashboard",
  supervisor: "/dashboard",
  unidad: "/unidad",
  ciudadano: "/ciudadano",
};

/** Accesos rápidos para la demostración. */
const DEMO_ACCOUNTS = [
  { label: "Ciudadano", email: "ciudadano@demo.nass.co", hint: "App ciudadana + botón de pánico" },
  { label: "Operador C4", email: "operador@nass.gov.co", hint: "Centro de despacho" },
  { label: "Unidad POL-031", email: "pol-031@nass.gov.co", hint: "Panel de unidad en calle" },
  { label: "Super Admin", email: "admin@nass.gov.co", hint: "Administración y auditoría" },
];

const DEMO_PASSWORD = "nass2026";

export default function LoginPage() {
  const router = useRouter();
  const invalidateSession = useInvalidateSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<"login" | "registro">("login");
  const [name, setName] = useState("");

  async function submit(nextEmail = email, nextPassword = password) {
    if (!nextEmail || !nextPassword) {
      toast.error("Escribe tu correo y tu contraseña");
      return;
    }
    setPending(true);
    try {
      const { user } = mode === "login"
        ? await api.login(nextEmail, nextPassword)
        : await api.register({ name, email: nextEmail, password: nextPassword });
      invalidateSession();
      toast.success(`Bienvenido, ${user.name.split(" ")[0]}`);
      router.push(HOME_BY_ROLE[user.role]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No fue posible iniciar sesión");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-red-600/15 ring-1 ring-red-600/40">
          <span className="text-2xl font-bold tracking-tighter text-red-500">N</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">NASS Ciudadano</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistema de Atención y Seguridad Ciudadana · Quibdó
          </p>
        </div>
      </header>

      <div className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="flex gap-1 rounded-lg bg-muted/40 p-1 text-sm">
          {(["login", "registro"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
                mode === option ? "bg-background text-foreground" : "text-muted-foreground"
              }`}
            >
              {option === "login" ? "Ingresar" : "Crear cuenta"}
            </button>
          ))}
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {mode === "registro" && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Verificando…" : mode === "login" ? "Ingresar" : "Crear cuenta y entrar"}
          </Button>
        </form>
      </div>

      <div className="w-full max-w-sm space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Accesos de demostración
        </p>
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={pending}
            onClick={() => {
              setMode("login");
              setEmail(account.email);
              setPassword(DEMO_PASSWORD);
              void submit(account.email, DEMO_PASSWORD);
            }}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-left transition hover:border-red-600/50 hover:bg-card disabled:opacity-50"
          >
            <span>
              <span className="block text-sm font-medium">{account.label}</span>
              <span className="block text-xs text-muted-foreground">{account.hint}</span>
            </span>
            <span className="text-xs text-muted-foreground">Entrar →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
