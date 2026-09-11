import { currentSession } from "@/server/auth";
import { subscribe } from "@/server/bus";
import { ensureSimulator } from "@/server/simulator";
import type { NassEvent } from "@/types/event.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Canal de eventos en tiempo real (Server-Sent Events).
 *
 * Se eligió SSE sobre WebSockets porque atraviesa proxies y CDNs sin
 * configuración adicional y reconecta solo. El contrato de eventos es el mismo
 * del §13, así que migrar a Socket.IO no cambia el frontend.
 */
export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) {
    return new Response("Sesión requerida", { status: 401 });
  }
  ensureSimulator();

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: NodeJS.Timeout | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: NassEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        unsubscribe?.();
        if (heartbeat) clearInterval(heartbeat);
      };

      controller.enqueue(encoder.encode(`retry: 3000\n\n`));
      send({ type: "heartbeat", at: new Date().toISOString() });

      unsubscribe = subscribe(send);
      heartbeat = setInterval(() => send({ type: "heartbeat", at: new Date().toISOString() }), 25_000);
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
