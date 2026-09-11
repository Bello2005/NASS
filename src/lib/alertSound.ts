/**
 * Alerta sonora del centro de despacho.
 * Se sintetiza con WebAudio para no depender de archivos externos y para que
 * suene igual en cualquier equipo de la sala de operaciones.
 */
let context: AudioContext | null = null;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  // Los navegadores suspenden el audio hasta que hay interacción del usuario.
  if (context.state === "suspended") void context.resume();
  return context;
}

function beep(ctx: AudioContext, frequency: number, startAt: number, duration: number, gain: number) {
  const oscillator = ctx.createOscillator();
  const amplifier = ctx.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  amplifier.gain.setValueAtTime(0, startAt);
  amplifier.gain.linearRampToValueAtTime(gain, startAt + 0.01);
  amplifier.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(amplifier).connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

/** Tono de alerta nueva: tres pulsos ascendentes. */
export function playAlertTone(priority: "critica" | "alta" | "media" | "baja" = "alta") {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const gain = priority === "critica" ? 0.22 : 0.14;
  const pulses = priority === "critica" ? 3 : 2;
  for (let i = 0; i < pulses; i++) {
    beep(ctx, priority === "critica" ? 880 : 660, now + i * 0.22, 0.16, gain);
  }
}

/** Tono corto para cambios de estado relevantes. */
export function playSoftTone() {
  const ctx = ensureContext();
  if (!ctx) return;
  beep(ctx, 520, ctx.currentTime, 0.12, 0.08);
}

/** Debe llamarse desde un gesto del usuario para habilitar el audio. */
export function unlockAudio() {
  ensureContext();
}
