// ============================================================
// voiceReader — Lectura por voz (Web Speech API nativa)
// ------------------------------------------------------------
// Gratis, sin librerías externas. Pensado para adultos mayores y como
// COMPLEMENTO de la base semántica (aria-live, roles, foco). El lector
// de pantalla del sistema sigue siendo la capa principal; esto es un
// extra "leer en voz alta" controlado por el usuario.
//
//   - speechSynthesis del navegador, voz en español (es-PE / es-ES).
//   - SIEMPRE opt-in: UN ÚNICO control (el toggle del menú de accesibilidad)
//     enciende/apaga la lectura; por defecto está APAGADO. No hay botones de
//     play / pausa / detener: encender da la bienvenida hablada y apagar
//     cancela cualquier lectura en curso (speechSynthesis.cancel()).
//   - Nunca se lee algo solo al cargar; solo al hover/focus (si el toggle
//     está activo) o al pulsar un botón explícito ("Escuchar").
//   - Anuncia CONTENIDO (nombre + precio + "requiere receta"...) y, para
//     controles, ACCIÓN con rol + nombre ("Agregar X al carrito, botón").
//     El lector global de controles vive en components/VoiceHoverReader.
//   - Cancela la lectura anterior antes de cada nueva (no se enciman) y
//     se detiene al navegar de página (ver cancelSpeech / route change).
//   - Si el navegador no soporta speechSynthesis, `isSpeechSupported()`
//     devuelve false y la UI oculta la opción.
// ============================================================

import { useCallback, useEffect, useState } from "react";

const STORE_KEY = "a11y-voice";

/** ¿El navegador soporta la Web Speech API de síntesis? */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

function readInitial(): boolean {
  try {
    return localStorage.getItem(STORE_KEY) === "on";
  } catch {
    return false;
  }
}

// ── Estado del toggle (lectura pasiva on/off) ───────────────────────
let enabled = isSpeechSupported() ? readInitial() : false;
const listeners = new Set<(v: boolean) => void>();

export function getVoiceEnabled(): boolean {
  return enabled;
}

export function setVoiceEnabled(value: boolean): void {
  enabled = value;
  try {
    localStorage.setItem(STORE_KEY, value ? "on" : "off");
  } catch {
    /* almacenamiento no disponible: solo en memoria */
  }
  if (!value) cancelSpeech(); // al apagar, corta cualquier lectura en curso
  listeners.forEach((fn) => fn(value));
}

function subscribe(fn: (v: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ── Estado de reproducción (idle | speaking | paused) ───────────────
export type VoiceStatus = "idle" | "speaking" | "paused";
let status: VoiceStatus = "idle";
const statusListeners = new Set<(s: VoiceStatus) => void>();

export function getVoiceStatus(): VoiceStatus {
  return status;
}

function setStatus(next: VoiceStatus): void {
  if (status === next) return;
  status = next;
  statusListeners.forEach((fn) => fn(next));
}

function subscribeStatus(fn: (s: VoiceStatus) => void): () => void {
  statusListeners.add(fn);
  return () => {
    statusListeners.delete(fn);
  };
}

// Elegir una voz en español: preferimos es-PE, luego es-ES, luego cualquier es-*.
function pickSpanishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find((v) => /^es[-_]PE/i.test(v.lang)) ||
    voices.find((v) => /^es[-_]ES/i.test(v.lang)) ||
    voices.find((v) => /^es/i.test(v.lang)) ||
    null
  );
}

// Referencia a la locución vigente: los callbacks de una locución cancelada
// (cuyo onend/onerror llega tarde) se ignoran para no apagar el indicador
// "leyendo" mientras ya empezó otra.
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Emisión real del audio. Cancela lo anterior para que no se encimen.
function utter(text: string): void {
  const clean = text.trim();
  if (!isSpeechSupported() || !clean) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  currentUtterance = u;
  const voice = pickSpanishVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang || "es-PE";
  u.rate = 0.95; // un punto más lento, más claro para adultos mayores
  u.pitch = 1;
  // Reflejar el estado de reproducción para los controles del widget.
  u.onstart = () => u === currentUtterance && setStatus("speaking");
  u.onend = () => u === currentUtterance && setStatus("idle");
  u.onerror = () => u === currentUtterance && setStatus("idle");
  u.onpause = () => u === currentUtterance && setStatus("paused");
  u.onresume = () => u === currentUtterance && setStatus("speaking");
  synth.speak(u);
  // Algunos navegadores no disparan onstart de inmediato; marcamos optimista.
  setStatus("speaking");
}

// Último texto leído. Mientras no cambie NO se vuelve a leer: así, al mover el
// cursor sobre la misma tarjeta (o entre sus hijos), no se repite. Solo se lee
// de nuevo cuando el contenido es distinto o se reinicia (toggle off / cancel).
let lastText = "";

/** Lectura PASIVA (hover/focus): solo si el usuario activó el toggle. */
export function speak(text: string): void {
  if (!enabled) return;
  const clean = text.trim();
  if (!clean || clean === lastText) return; // no repetir lo mismo
  lastText = clean;
  utter(clean);
}

/** Lectura EXPLÍCITA (botón "Escuchar"): siempre, ignora el toggle. */
export function speakNow(text: string): void {
  const clean = text.trim();
  if (!clean) return;
  lastText = clean; // evita que un hover inmediato lo repita
  utter(clean);
}

/**
 * Anuncio de un CONTROL como ACCIÓN: rol + nombre + contexto.
 * Pasiva (respeta el toggle). Ej: speakAction("Agregar Paracetamol al carrito")
 * → "Agregar Paracetamol al carrito, botón".
 */
export function speakAction(label: string, role: string = "botón"): void {
  const clean = label.trim();
  if (!clean) return;
  speak(`${clean}, ${role}`);
}

export function cancelSpeech(): void {
  lastText = ""; // reinicia para permitir releer al reactivar
  currentUtterance = null;
  if (isSpeechSupported()) window.speechSynthesis.cancel();
  setStatus("idle");
}

/** Pausa la lectura en curso (si el navegador lo soporta). */
export function pauseSpeech(): void {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  if (synth.speaking && !synth.paused) {
    synth.pause();
    setStatus("paused");
  }
}

/** Reanuda una lectura pausada. */
export function resumeSpeech(): void {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  if (synth.paused) {
    synth.resume();
    setStatus("speaking");
  }
}

/**
 * Formatea un precio para que la voz lo lea natural en español:
 *   12.5  → "12 soles con 50 céntimos"
 *   12    → "12 soles"
 * (mucho más claro que "doce punto cinco" para adultos mayores).
 */
export function formatPriceForSpeech(value: number | string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const soles = Math.floor(n);
  const cents = Math.round((n - soles) * 100);
  const solesPart = `${soles} ${soles === 1 ? "sol" : "soles"}`;
  if (cents === 0) return solesPart;
  return `${solesPart} con ${cents} ${cents === 1 ? "céntimo" : "céntimos"}`;
}

// ------------------------------------------------------------
// Hook React: estado reactivo del toggle + estado de reproducción
// + helpers de lectura y controles.
// ------------------------------------------------------------
export function useVoiceReader() {
  const supported = isSpeechSupported();
  const [voiceEnabled, setEnabledState] = useState<boolean>(getVoiceEnabled);
  const [playback, setPlayback] = useState<VoiceStatus>(getVoiceStatus);

  useEffect(() => subscribe(setEnabledState), []);
  useEffect(() => subscribeStatus(setPlayback), []);

  // Algunos navegadores cargan las voces de forma asíncrona: las "calentamos"
  // y reaccionamos a `voiceschanged` para que la primera lectura ya tenga voz es-*.
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const warm = () => synth.getVoices();
    warm();
    synth.addEventListener?.("voiceschanged", warm);
    return () => synth.removeEventListener?.("voiceschanged", warm);
  }, [supported]);

  const setEnabled = useCallback((v: boolean) => setVoiceEnabled(v), []);

  return {
    supported,
    enabled: voiceEnabled,
    status: playback,
    setEnabled,
    speak,
    speakNow,
    speakAction,
    pause: pauseSpeech,
    resume: resumeSpeech,
    cancel: cancelSpeech,
  };
}
