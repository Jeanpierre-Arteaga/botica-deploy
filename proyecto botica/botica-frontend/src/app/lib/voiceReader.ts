// ============================================================
// voiceReader — Lectura por voz (Web Speech API nativa)
// ------------------------------------------------------------
// Gratis, sin librerías externas. Pensado para adultos mayores.
//   - speechSynthesis del navegador, voz en español (es-PE / es-ES).
//   - SIEMPRE opt-in: el toggle vive aquí y por defecto está APAGADO.
//     Nunca se lee algo solo al cargar; solo al hover/focus o al pulsar
//     un botón explícito ("Escuchar").
//   - Cancela la lectura anterior antes de cada nueva (no se enciman).
//   - Si el navegador no soporta speechSynthesis, `isSpeechSupported()`
//     devuelve false y la UI oculta la opción.
//
// Estado compartido por un pequeño observable (igual de ligero que el
// resto del menú de accesibilidad, que usa localStorage sin Context).
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

// Estado del módulo (single source of truth) + suscriptores.
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

// Emisión real del audio. Cancela lo anterior para que no se encimen.
function utter(text: string): void {
  const clean = text.trim();
  if (!isSpeechSupported() || !clean) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  const voice = pickSpanishVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang || "es-PE";
  u.rate = 0.95; // un punto más lento, más claro para adultos mayores
  u.pitch = 1;
  synth.speak(u);
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

export function cancelSpeech(): void {
  lastText = ""; // reinicia para permitir releer al reactivar
  if (isSpeechSupported()) window.speechSynthesis.cancel();
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
// Hook React: estado reactivo del toggle + helpers de lectura.
// ------------------------------------------------------------
export function useVoiceReader() {
  const supported = isSpeechSupported();
  const [voiceEnabled, setEnabledState] = useState<boolean>(getVoiceEnabled);

  useEffect(() => subscribe(setEnabledState), []);

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

  return { supported, enabled: voiceEnabled, setEnabled, speak, speakNow, cancel: cancelSpeech };
}
