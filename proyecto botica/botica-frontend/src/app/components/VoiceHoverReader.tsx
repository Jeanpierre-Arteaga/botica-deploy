// ============================================================
// VoiceHoverReader — lectura por voz GLOBAL de controles
// ------------------------------------------------------------
// Un único listener a nivel de documento que, SOLO si el usuario activó
// la lectura por voz (toggle del menú de accesibilidad), lee en voz alta
// CUALQUIER control interactivo al apuntarlo con el cursor o enfocarlo
// con el teclado: botones (Agregar, Pagar, Explorar catálogo…), enlaces
// de navegación, campos, interruptores, etc.
//
// Antes la lectura estaba cableada componente por componente, así que
// muchos botones "no se leían". Esto lo resuelve de raíz: calcula el
// NOMBRE ACCESIBLE del elemento (aria-label, <label>, alt, texto visible)
// y anuncia ROL + ACCIÓN en español natural, p. ej.:
//   "Agregar Paracetamol al carrito, botón"
//   "Catálogo, enlace"  ·  "Lectura por voz, interruptor, activado"
//
// - Respeta el toggle: speak() no hace nada si está apagado.
// - Ignora íconos decorativos (aria-hidden) y controles sin nombre.
// - Los componentes que ya leen contenido rico (tarjeta de producto:
//   nombre + precio + stock) marcan su raíz con `data-voice-skip` para
//   no duplicar lecturas; este lector ignora ese subárbol.
// ============================================================

import { useEffect } from "react";
import { getVoiceEnabled, speak } from "../lib/voiceReader";

// Selector de elementos "interactivos" cuya etiqueta merece leerse.
const INTERACTIVE =
  'a[href], button:not([disabled]), [role="button"], [role="link"], ' +
  '[role="switch"], [role="checkbox"], [role="radio"], [role="tab"], ' +
  '[role="menuitem"], [role="option"], summary, ' +
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Texto visible del elemento, excluyendo descendientes decorativos
// (aria-hidden), para no leer íconos sueltos.
function visibleText(el: Element): string {
  let out = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const e = node as Element;
      if (e.getAttribute("aria-hidden") === "true") return;
      if (e.tagName === "SCRIPT" || e.tagName === "STYLE") return;
      out += visibleText(e);
    }
  });
  return out;
}

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// Nombre accesible del control, siguiendo (de forma pragmática) la cascada
// de la spec: aria-label → aria-labelledby → <label>/placeholder → title →
// alt de imagen interna → texto visible → value.
function accessibleName(el: HTMLElement): string {
  const aria = el.getAttribute("aria-label");
  if (aria && aria.trim()) return collapse(aria);

  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    const text = labelledby
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ");
    if (collapse(text)) return collapse(text);
  }

  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "select" || tag === "textarea") {
    const labels = (el as HTMLInputElement).labels;
    if (labels && labels.length) {
      const text = Array.from(labels).map((l) => l.textContent ?? "").join(" ");
      if (collapse(text)) return collapse(text);
    }
    const placeholder = el.getAttribute("placeholder");
    if (placeholder && placeholder.trim()) return collapse(placeholder);
    const value = (el as HTMLInputElement).value;
    const type = (el as HTMLInputElement).type;
    if ((type === "submit" || type === "button") && value) return collapse(value);
  }

  const visible = collapse(visibleText(el));
  if (visible) return visible;

  const title = el.getAttribute("title");
  if (title && title.trim()) return collapse(title);

  const img = el.querySelector("img[alt]");
  const alt = img?.getAttribute("alt");
  if (alt && alt.trim()) return collapse(alt);

  return "";
}

// Rol del control en español (para anunciar "…, botón" / "…, enlace").
function roleInSpanish(el: HTMLElement): string {
  const role = el.getAttribute("role");
  const tag = el.tagName.toLowerCase();

  if (role === "switch") return "interruptor";
  if (role === "checkbox") return "casilla";
  if (role === "radio" || role === "option") return "opción";
  if (role === "tab") return "pestaña";
  if (role === "menuitem") return "opción de menú";
  if (role === "link") return "enlace";
  if (role === "button") return "botón";

  if (tag === "a") return "enlace";
  if (tag === "button" || tag === "summary") return "botón";
  if (tag === "select") return "selector";
  if (tag === "textarea") return "campo de texto";
  if (tag === "input") {
    const type = (el as HTMLInputElement).type;
    if (type === "checkbox") return "casilla";
    if (type === "radio") return "opción";
    if (type === "submit" || type === "button") return "botón";
    return "campo";
  }
  return "control";
}

// Estado on/off para interruptores y casillas, en lenguaje natural.
function stateInSpanish(el: HTMLElement): string {
  const checked = el.getAttribute("aria-checked");
  if (checked === "true") return "activado";
  if (checked === "false") return "desactivado";
  const pressed = el.getAttribute("aria-pressed");
  if (pressed === "true") return "activado";
  if (pressed === "false") return "desactivado";
  return "";
}

function announce(el: HTMLElement) {
  if (el.getAttribute("aria-disabled") === "true") return;
  let name = accessibleName(el);
  if (!name) return;
  if (name.length > 140) name = name.slice(0, 140);

  const role = roleInSpanish(el);
  const state = stateInSpanish(el);

  // "Agregar Paracetamol al carrito, botón" / "Catálogo, enlace, activado"
  const parts = [name, role];
  if (state) parts.push(state);
  speak(parts.join(", "));
}

export function VoiceHoverReader() {
  useEffect(() => {
    const handle = (target: EventTarget | null) => {
      if (!getVoiceEnabled()) return;
      const node = target as Element | null;
      const el = node?.closest?.(INTERACTIVE) as HTMLElement | null;
      if (!el) return;
      // El subárbol se lee a sí mismo (contenido rico): no duplicar.
      if (el.closest("[data-voice-skip]")) return;
      announce(el);
    };

    const onOver = (e: PointerEvent | MouseEvent) => handle(e.target);
    const onFocus = (e: FocusEvent) => handle(e.target);

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);

  return null;
}
