"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { playAlertTone, playSoftTone, unlockAudio } from "@/lib/alertSound";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { useRealtime } from "@/hooks/useRealtime";
import { useUIStore } from "@/store/ui.store";

/**
 * Puente de tiempo real del centro de despacho: mantiene las vistas
 * sincronizadas y avisa al operador con sonido cuando entra una alerta.
 */
export function RealtimeAlerts() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const setSelectedIncidentId = useUIStore((state) => state.setSelectedIncidentId);
  const [audioReady, setAudioReady] = useState(false);

  // El navegador exige un gesto del usuario antes de reproducir audio.
  useEffect(() => {
    const enable = () => {
      unlockAudio();
      setAudioReady(true);
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
    };
    window.addEventListener("pointerdown", enable);
    window.addEventListener("keydown", enable);
    return () => {
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
    };
  }, []);

  const { connected } = useRealtime((event) => {
    switch (event.type) {
      case "incident.created": {
        void queryClient.invalidateQueries({ queryKey: ["incidents"] });
        void queryClient.invalidateQueries({ queryKey: ["analytics"] });
        playAlertTone(event.incident.priority);
        toast.error(
          `${PRIORITY_CONFIG[event.incident.priority].label.toUpperCase()} · ${event.incident.code}`,
          {
            description: `${event.incident.title} — ${event.incident.zone}`,
            duration: 12_000,
            action: {
              label: "Atender",
              onClick: () => {
                setSelectedIncidentId(event.incident.id);
                router.push("/mapa");
              },
            },
          },
        );
        break;
      }
      case "incident.assigned":
        void queryClient.invalidateQueries({ queryKey: ["incidents"] });
        void queryClient.invalidateQueries({ queryKey: ["units"] });
        break;
      case "incident.updated":
        void queryClient.invalidateQueries({ queryKey: ["incidents"] });
        break;
      case "incident.closed":
        void queryClient.invalidateQueries({ queryKey: ["incidents"] });
        void queryClient.invalidateQueries({ queryKey: ["analytics"] });
        playSoftTone();
        break;
      case "unit.location.updated":
      case "unit.status.changed":
      case "unit.dispatched":
      case "unit.accepted":
        void queryClient.invalidateQueries({ queryKey: ["units"] });
        break;
      case "message.created":
        void queryClient.invalidateQueries({ queryKey: ["incidents", event.message.incidentId] });
        break;
    }
  });

  useEffect(() => {
    useUIStore.setState({ realtimeConnected: connected });
  }, [connected]);

  if (audioReady) return null;

  return (
    <div className="pointer-events-none fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-full bg-yellow-950/90 px-4 py-1.5 text-xs text-yellow-200 ring-1 ring-yellow-700/50">
      Toca la pantalla una vez para habilitar la alerta sonora
    </div>
  );
}
