import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { RealtimeAlerts } from "@/components/layout/RealtimeAlerts";
import { C4_ROLES, currentSession } from "@/server/auth";

/** El centro de despacho solo admite roles C4: la puerta se cierra en el servidor. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/entrar");
  if (!C4_ROLES.includes(session.role)) {
    redirect(session.role === "unidad" ? "/unidad" : "/ciudadano");
  }

  return (
    <AdminShell>
      <RealtimeAlerts />
      {children}
    </AdminShell>
  );
}
