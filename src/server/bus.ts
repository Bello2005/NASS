import type { NassEvent } from "@/types/event.types";

type Listener = (event: NassEvent) => void;

/**
 * Bus de eventos en memoria que alimenta el canal SSE (`/api/events`).
 * Vive en globalThis para sobrevivir al hot-reload de Next en desarrollo.
 */
function getListeners(): Set<Listener> {
  const g = globalThis as typeof globalThis & { __nassListeners?: Set<Listener> };
  if (!g.__nassListeners) g.__nassListeners = new Set();
  return g.__nassListeners;
}

export function subscribe(listener: Listener): () => void {
  const listeners = getListeners();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emit(event: NassEvent): void {
  for (const listener of getListeners()) {
    try {
      listener(event);
    } catch {
      // Un cliente caído nunca debe tumbar la emisión al resto.
    }
  }
}

export function subscriberCount(): number {
  return getListeners().size;
}
