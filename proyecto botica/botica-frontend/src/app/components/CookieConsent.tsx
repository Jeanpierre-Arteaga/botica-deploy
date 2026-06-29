// ============================================================
// CookieConsent — Banner discreto + modal de preferencias
// ============================================================
// 1) BARRA INFERIOR fina y discreta (estilo Falabella): aparece en la
//    primera visita con texto breve, enlaces a las políticas y los
//    botones Aceptar / Configurar (y Rechazar). No tapa la pantalla.
// 2) MODAL DE PREFERENCIAS (al pulsar "Configurar" o desde el footer /
//    Política de Cookies): categorías con interruptores —
//    Necesarias (siempre activas), Funcionales y Analíticas— con
//    "Guardar preferencias" y "Aceptar todas".
//
// Persiste la elección en localStorage y no vuelve a mostrar la barra
// si ya se decidió. Migra el formato anterior (v1) sin volver a pedir
// consentimiento a quien ya eligió.
//
// Reabrir desde otra parte: `openCookiePreferences()` o el evento
// global "cookie:open".
//
// Accesible: barra con role="region"; modal con role="dialog",
// aria-modal, foco inicial gestionado y cierre con Esc; contraste AA.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Cookie, SlidersHorizontal, Check, X, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "cookie-consent-v2";
const LEGACY_KEY = "cookie-consent-v1";
const OPEN_EVENT = "cookie:open";

interface ConsentPrefs {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  decided: boolean;
  ts: string;
}

/** Dispara la apertura del panel de preferencias desde cualquier parte. */
export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

function readPrefs(): ConsentPrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ConsentPrefs;
    // Migración desde v1 (necessary/analytics/personalization).
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as {
        analytics?: boolean;
        personalization?: boolean;
        decided?: boolean;
        ts?: string;
      };
      if (old?.decided) {
        return {
          necessary: true,
          functional: !!old.personalization,
          analytics: !!old.analytics,
          decided: true,
          ts: old.ts || new Date(0).toISOString(),
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function savePrefs(functional: boolean, analytics: boolean) {
  const full: ConsentPrefs = {
    necessary: true,
    functional,
    analytics,
    decided: true,
    ts: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    // Si localStorage no está disponible, simplemente no persistimos.
  }
}

export function CookieConsent() {
  const [decided, setDecided] = useState(true); // asumimos decidido hasta leer
  const [modalOpen, setModalOpen] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  // Primera visita: si no hay decisión guardada, mostramos la barra.
  useEffect(() => {
    const prefs = readPrefs();
    if (prefs?.decided) {
      setFunctional(prefs.functional);
      setAnalytics(prefs.analytics);
      setDecided(true);
    } else {
      setDecided(false);
    }
  }, []);

  // Reabrir preferencias desde footer / Política de Cookies.
  useEffect(() => {
    const onOpen = () => {
      const prefs = readPrefs();
      setFunctional(prefs?.functional ?? true);
      setAnalytics(prefs?.analytics ?? true);
      setModalOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const decide = useCallback((f: boolean, a: boolean) => {
    savePrefs(f, a);
    setFunctional(f);
    setAnalytics(a);
    setDecided(true);
    setModalOpen(false);
  }, []);

  const barVisible = !decided && !modalOpen;

  return (
    <>
      {barVisible && (
        <CookieBar
          onAccept={() => decide(true, true)}
          onDismiss={() => decide(false, false)}
          onConfigure={() => setModalOpen(true)}
        />
      )}

      {modalOpen && (
        <CookieModal
          functional={functional}
          analytics={analytics}
          setFunctional={setFunctional}
          setAnalytics={setAnalytics}
          onSave={() => decide(functional, analytics)}
          onAcceptAll={() => decide(true, true)}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ── Barra inferior discreta y delgada ───────────────────────────────
// Fija al fondo del viewport (acompaña el scroll), texto breve y centrado,
// con "Configurar", "Aceptar" y una "×" para cerrar. Cerrar con × o Esc
// equivale a aceptar SOLO las necesarias (decisión persistida → no reaparece).
function CookieBar({
  onAccept,
  onDismiss,
  onConfigure,
}: {
  onAccept: () => void;
  onDismiss: () => void;
  onConfigure: () => void;
}) {
  // Cerrable con Esc (accesibilidad).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[1300] animate-fade-in-up"
      style={{
        backgroundColor: "color-mix(in srgb, var(--c-surface) 94%, transparent)",
        backdropFilter: "blur(12px) saturate(160%)",
        WebkitBackdropFilter: "blur(12px) saturate(160%)",
        borderTop: "1px solid var(--c-line)",
        boxShadow: "0 -6px 24px -12px rgba(15,23,42,0.18)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
        {/* Texto breve y centrado */}
        <p
          className="flex-1 text-[12.5px] leading-snug flex items-center justify-center sm:justify-center gap-2 text-center"
          style={{ color: "var(--c-muted)" }}
        >
          <Cookie className="w-4 h-4 flex-shrink-0" style={{ color: "var(--c-brand)" }} aria-hidden="true" />
          <span>
            Usamos cookies para mejorar tu experiencia. Revisa nuestra{" "}
            <Link to="/privacidad" className="font-semibold hover:underline" style={{ color: "var(--c-brand)" }}>
              Política de Privacidad
            </Link>{" "}
            y de{" "}
            <Link to="/cookies" className="font-semibold hover:underline" style={{ color: "var(--c-brand)" }}>
              Cookies
            </Link>
            .
          </span>
        </p>

        <div className="flex items-center justify-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onConfigure}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: "var(--c-line)", color: "var(--c-text)", backgroundColor: "var(--c-surface)", outlineColor: "var(--c-brand)" }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            Configurar
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12.5px] font-semibold text-white transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: "var(--c-brand)", outlineColor: "var(--c-brand)" }}
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            Aceptar
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar aviso de cookies"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: "var(--c-muted)", outlineColor: "var(--c-brand)" }}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de preferencias ───────────────────────────────────────────
function CookieModal({
  functional,
  analytics,
  setFunctional,
  setAnalytics,
  onSave,
  onAcceptAll,
  onClose,
}: {
  functional: boolean;
  analytics: boolean;
  setFunctional: (v: boolean) => void;
  setAnalytics: (v: boolean) => void;
  onSave: () => void;
  onAcceptAll: () => void;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Foco inicial dentro del modal.
    const node = cardRef.current;
    const target = node?.querySelector<HTMLElement>("button");
    target?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
        aria-describedby="cookie-modal-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border overflow-hidden animate-fade-in-up"
        style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-line)", boxShadow: "var(--elev-pop)" }}
      >
        {/* Cabecera */}
        <div className="flex items-start gap-3 p-5 pb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--c-brand-soft)" }}>
            <Cookie className="w-5 h-5" style={{ color: "var(--c-brand)" }} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="cookie-modal-title" className="text-base font-bold" style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}>
              Preferencias de cookies
            </h2>
            <p id="cookie-modal-desc" className="text-sm mt-1 leading-relaxed" style={{ color: "var(--c-muted)" }}>
              Elige qué cookies aceptas. Las necesarias no se pueden desactivar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: "var(--c-muted)", outlineColor: "var(--c-brand)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categorías */}
        <div className="px-5 pb-1 space-y-2.5">
          <CategoryRow
            title="Necesarias"
            desc="Imprescindibles para el funcionamiento del sitio: sesión, carrito, seguridad y tema. Siempre activas."
            checked
            locked
          />
          <CategoryRow
            title="Funcionales"
            desc="Recuerdan tus preferencias y opciones de accesibilidad para una mejor experiencia."
            checked={functional}
            onChange={setFunctional}
          />
          <CategoryRow
            title="Analíticas"
            desc="Nos ayudan a entender el uso del sitio de forma agregada para mejorarlo. No te identifican."
            checked={analytics}
            onChange={setAnalytics}
          />
        </div>

        {/* Enlaces a políticas */}
        <p className="px-5 pt-3 text-xs flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: "var(--c-faint)" }}>
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--c-brand)" }} aria-hidden="true" />
          <Link to="/privacidad" className="hover:underline" style={{ color: "var(--c-muted)" }}>Privacidad</Link>
          <Link to="/cookies" className="hover:underline" style={{ color: "var(--c-muted)" }}>Cookies</Link>
          <Link to="/seguridad" className="hover:underline" style={{ color: "var(--c-muted)" }}>Seguridad</Link>
        </p>

        {/* Acciones */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2.5 p-5 pt-3">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: "var(--c-line)", color: "var(--c-text)", backgroundColor: "var(--c-surface)", outlineColor: "var(--c-brand)" }}
          >
            Guardar preferencias
          </button>
          <div className="flex-1 hidden sm:block" />
          <button
            type="button"
            onClick={onAcceptAll}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: "var(--c-brand)", outlineColor: "var(--c-brand)" }}
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fila de categoría con interruptor ───────────────────────────────
function CategoryRow({
  title,
  desc,
  checked,
  locked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3 border"
      style={{ borderColor: "var(--c-line)", backgroundColor: "var(--c-bg)" }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
          {title}
          {locked && (
            <span className="ml-2 text-[11px] font-medium" style={{ color: "var(--c-faint)" }}>
              Siempre activas
            </span>
          )}
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--c-faint)" }}>
          {desc}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={locked}
        onClick={() => onChange?.(!checked)}
        className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          backgroundColor: checked ? "var(--c-brand)" : "var(--c-line)",
          cursor: locked ? "not-allowed" : "pointer",
          opacity: locked ? 0.7 : 1,
          outlineColor: "var(--c-brand)",
        }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
          style={{ left: checked ? "calc(100% - 1.375rem)" : "0.125rem", boxShadow: "var(--elev-xs)" }}
        />
      </button>
    </div>
  );
}
