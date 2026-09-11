"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type CallState = "idle" | "calling" | "ringing" | "connected" | "ended" | "failed";

const LABEL: Record<CallState, string> = {
  idle: "Iniciar llamada",
  calling: "Marcando…",
  ringing: "Timbrando…",
  connected: "En llamada",
  ended: "Llamada finalizada",
  failed: "Llamada fallida",
};

/**
 * Interfaz de voz sobre IP.
 *
 * PUNTO DE INTEGRACIÓN — WebRTC: la máquina de estados (CALLING → RINGING →
 * CONNECTED → ENDED/FAILED) y la interfaz están listas. Falta conectar el
 * servidor de señalización y los servidores STUN/TURN. Hasta entonces el botón
 * simula la negociación y lo indica explícitamente: no hay audio real.
 */
export function VoiceCallButton({ incidentCode, target }: { incidentCode: string; target: string }) {
  const [state, setState] = useState<CallState>("idle");

  useEffect(() => {
    if (state === "calling") {
      const id = setTimeout(() => setState("ringing"), 900);
      return () => clearTimeout(id);
    }
    if (state === "ringing") {
      const id = setTimeout(() => setState("connected"), 1600);
      return () => clearTimeout(id);
    }
  }, [state]);

  if (state === "connected") {
    return (
      <Button variant="destructive" onClick={() => setState("ended")}>
        Colgar · {target}
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={() => setState("calling")}
      disabled={state === "calling" || state === "ringing"}
      title={`Canal de voz para el incidente ${incidentCode} (pendiente de integración WebRTC)`}
    >
      {LABEL[state]}
    </Button>
  );
}
