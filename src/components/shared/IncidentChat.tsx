"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { formatTime } from "@/lib/date";
import type { IncidentMessage } from "@/types/incident.types";

interface IncidentChatProps {
  incidentId: string;
  messages: IncidentMessage[];
  currentUserId: string;
  /** Etiqueta de la contraparte, p. ej. "Centro de atención". */
  counterpartLabel: string;
  onSent?: () => void;
  compact?: boolean;
}

const ROLE_LABEL: Record<IncidentMessage["senderRole"], string> = {
  ciudadano: "Ciudadano",
  operador: "Centro de atención",
  unidad: "Unidad",
};

/** Chat asociado a un incidente. Nunca existe una conversación sin caso. */
export function IncidentChat({
  incidentId,
  messages,
  currentUserId,
  counterpartLabel,
  onSent,
  compact,
}: IncidentChatProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await api.sendMessage(incidentId, body);
      setDraft("");
      onSent?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div
        className={`min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl border border-border bg-background/60 p-3 ${
          compact ? "max-h-52" : "max-h-80"
        }`}
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Escribe para comunicarte con {counterpartLabel}.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-sky-600/20 text-sky-50 ring-1 ring-sky-600/30"
                      : "bg-muted/60 text-foreground ring-1 ring-border"
                  }`}
                >
                  {!mine && (
                    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {ROLE_LABEL[message.senderRole]} · {message.senderName}
                    </span>
                  )}
                  <span className="whitespace-pre-wrap break-words">{message.body}</span>
                  <span className="mt-1 block text-right text-[10px] text-muted-foreground">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escribe un mensaje…"
          maxLength={1000}
          aria-label="Mensaje"
        />
        <Button type="submit" disabled={sending || draft.trim().length === 0}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
