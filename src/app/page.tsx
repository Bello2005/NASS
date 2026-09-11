import { redirect } from "next/navigation";
import { currentSession } from "@/server/auth";

/** Cada rol entra directamente a su propia aplicación. */
export default async function Home() {
  const session = await currentSession();
  if (!session) redirect("/entrar");

  switch (session.role) {
    case "ciudadano":
      redirect("/ciudadano");
    case "unidad":
      redirect("/unidad");
    default:
      redirect("/dashboard");
  }
}
