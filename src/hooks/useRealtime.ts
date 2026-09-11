"use client";

import { useEffect, useRef, useState } from "react";
import type { NassEvent } from "@/types/event.types";

type Handler = (event: NassEvent) => void;

/**
 * Suscripción al canal de eventos del servidor (SSE).
 * EventSource reconecta por sí solo, así que una caída de red se recupera
 * sin recargar la página.
 */
export function useRealtime(onEvent: Handler, enabled = true) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource("/api/events");

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as NassEvent;
        if (event.type === "heartbeat") {
          setConnected(true);
          return;
        }
        handlerRef.current(event);
      } catch {
        // Un mensaje malformado no debe romper la suscripción.
      }
    };

    return () => source.close();
  }, [enabled]);

  return { connected };
}
