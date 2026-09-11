"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

/** Refleja el estado real del canal de eventos, no un adorno fijo. */
export function LiveIndicator({ className }: { className?: string }) {
  const connected = useUIStore((state) => state.realtimeConnected);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        connected ? "text-green-400" : "text-yellow-400",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {connected && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
        )}
        <span
          className={cn("relative inline-flex size-1.5 rounded-full", connected ? "bg-green-500" : "bg-yellow-500")}
        />
      </span>
      {connected ? "En vivo" : "Reconectando"}
    </span>
  );
}
