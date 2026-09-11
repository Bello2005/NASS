"use client";

import { useEffect, useRef, useState } from "react";
import { PANIC_COUNTDOWN_SECONDS } from "@/lib/constants";

interface PanicButtonProps {
  /** Se ejecuta cuando la cuenta regresiva termina sin cancelación. */
  onTrigger: () => void | Promise<void>;
  disabled?: boolean;
  sending?: boolean;
}

/**
 * Botón de pánico.
 *
 * Dos toques y una cuenta regresiva cancelable: suficiente para evitar
 * activaciones accidentales sin sacrificar segundos en una emergencia real.
 */
export function PanicButton({ onTrigger, disabled, sending }: PanicButtonProps) {
  const [phase, setPhase] = useState<"idle" | "confirm" | "countdown">("idle");
  const [remaining, setRemaining] = useState(PANIC_COUNTDOWN_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => stopTimer, []);

  // Si el ciudadano no confirma, el botón vuelve a su estado inicial.
  useEffect(() => {
    if (phase !== "confirm") return;
    const id = setTimeout(() => setPhase("idle"), 6000);
    return () => clearTimeout(id);
  }, [phase]);

  function startCountdown() {
    setPhase("countdown");
    setRemaining(PANIC_COUNTDOWN_SECONDS);
    stopTimer();
    timer.current = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          stopTimer();
          setPhase("idle");
          void onTrigger();
          return PANIC_COUNTDOWN_SECONDS;
        }
        return value - 1;
      });
    }, 1000);
  }

  function cancel() {
    stopTimer();
    setPhase("idle");
    setRemaining(PANIC_COUNTDOWN_SECONDS);
  }

  if (phase === "countdown") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex size-52 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-red-600/30" />
          <div className="relative flex size-52 flex-col items-center justify-center rounded-full bg-red-600 text-white ring-8 ring-red-600/25">
            <span className="text-6xl font-bold tabular-nums">{remaining}</span>
            <span className="mt-1 text-xs font-medium uppercase tracking-widest">Enviando alerta</span>
          </div>
        </div>
        <button
          type="button"
          onClick={cancel}
          className="w-full max-w-xs rounded-xl border-2 border-border bg-card px-6 py-4 text-base font-semibold text-foreground transition active:scale-[.98]"
        >
          CANCELAR
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Toca cancelar si la activaste por error
        </p>
      </div>
    );
  }

  const isConfirm = phase === "confirm";

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        disabled={disabled || sending}
        onClick={() => (isConfirm ? startCountdown() : setPhase("confirm"))}
        className={`relative flex size-52 flex-col items-center justify-center rounded-full text-white transition active:scale-[.97] disabled:opacity-60 ${
          isConfirm
            ? "bg-red-500 ring-8 ring-red-500/30"
            : "bg-red-600 ring-8 ring-red-600/20 hover:bg-red-500"
        }`}
      >
        {!isConfirm && !sending && (
          <span className="absolute inset-0 animate-pulse rounded-full bg-red-600/20" />
        )}
        <span className="relative text-center">
          {sending ? (
            <span className="text-lg font-semibold">Enviando…</span>
          ) : isConfirm ? (
            <>
              <span className="block text-2xl font-bold leading-tight">CONFIRMAR</span>
              <span className="mt-1 block text-xs font-medium uppercase tracking-widest opacity-90">
                Toca otra vez
              </span>
            </>
          ) : (
            <>
              <span className="block text-4xl font-bold leading-none tracking-tight">SOS</span>
              <span className="mt-2 block text-sm font-semibold uppercase tracking-[0.2em]">
                Pánico
              </span>
            </>
          )}
        </span>
      </button>
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        {isConfirm
          ? "Toca de nuevo para activar la alerta. Tendrás 5 segundos para cancelar."
          : "Mantén pulsado el botón solo si estás en peligro. Tu ubicación se enviará al centro de atención."}
      </p>
    </div>
  );
}
