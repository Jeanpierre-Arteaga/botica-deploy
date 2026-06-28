// ============================================================
// CookieConsent — Banner de consentimiento de cookies
// ============================================================
// Aparece en la primera visita (tarjeta flotante inferior, blur sutil,
// no intrusiva). Permite Aceptar todo, Rechazar opcionales o Configurar
// por categoría (las técnicas siempre activas). Guarda la elección en
// localStorage y no vuelve a mostrarse tras decidir.
//
// Reabrir las preferencias desde otra parte (footer / Política de
// Cookies): llamar a `openCookiePreferences()` o disparar el evento
// global "cookie:open".
//
// Accesible: role="dialog", foco inicial gestionado, Esc cierra el
// panel de configuración. Coherente con tokens y claro/oscuro.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Cookie, SlidersHorizontal, Check, X } from "lucide-react";

const STORAGE_KEY = "cookie-consent-v1";
const OPEN_EVENT = "cookie:open";

interface ConsentPrefs {
  necessary: true;
  analytics: boolean;
  personalization: boolean;
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
    if (!raw) return null;
    return JSON.parse(raw) as ConsentPrefs;
  } catch {
    return null;
  }
}

function savePrefs(p: Omit<ConsentPrefs, "necessary" | "decided" | "ts">) {
  const full: ConsentPrefs = {
    necessary: true,
    analytics: p.analytics,
    personalization: p.personalization,
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
  const [visible, setVisible] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [personalization, setPersonalization] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Primera visita: si no hay decisión guardada, mostramos el banner.
  useEffect(() => {
    const prefs = readPrefs();
    if (!prefs?.decided) {
      setVisible(true);
    }
  }, []);

  // Permite reabrir el panel de preferencias desde el footer / página.
  useEffect(() => {
    const onOpen = () => {
      const prefs = readPrefs();
      setAnalytics(prefs?.analytics ?? true);
      setPersonalization(prefs?.personalization ?? true);
      setConfiguring(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Mueve el foco al panel al abrirlo (accesibilidad).
  useEffect(() => {
    if (visible) cardRef.current?.focus();
  }, [visible, configuring]);

  // Esc: cierra el sub-panel de configuración (vuelve al banner).
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && configuring) {
        setConfiguring(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, configuring]);

  const decide = (a: boolean, p: boolean) => {
    savePrefs({ analytics: a, personalization: p });
    setVisible(false);
    setConfiguring(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1300] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none animate-fade-in-up"
      aria-live="polite"
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-label="Aviso de cookies"
        tabIndex={-1}
        className="pointer-events-auto w-full sm:max-w-md md:max-w-lg sm:ml-0 rounded-2xl border outline-none overflow-hidden"
        style={{
          backgroundColor: "color-mix(in srgb, var(--c-surface) 90%, transparent)",
          backdropFilter: "blur(14px) saturate(160%)",
          WebkitBackdropFilter: "blur(14px) saturate(160%)",
          borderColor: "var(--c-line)",
          boxShadow: "var(--elev-pop)",
        }}
      >
        {/* Cabecera */}
        <div className="flex items-start gap-3 p-5 pb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--c-brand-soft)" }}
          >
            <Cookie className="w-5 h-5" style={{ color: "var(--c-brand)" }} />
          </div>
          <div className="min-w-0">
            <h2
              className="text-base font-bold"
              style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
            >
              Usamos cookies
            </h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--c-muted)" }}>
              Utilizamos cookies para mejorar tu experiencia, recordar tus preferencias y analizar el uso
              del sitio. Puedes aceptarlas, rechazarlas o configurarlas. Consulta nuestra{" "}
              <Link
                to="/cookies"
                className="font-semibold hover:underline"
                style={{ color: "var(--c-brand)" }}
              >
                Política de cookies
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Panel de configuración (categorías) */}
        {configuring && (
          <div className="px-5 pb-1 space-y-2.5">
            <CategoryRow
              title="Técnicas o de sesión"
              desc="Necesarias para el funcionamiento del sitio. Siempre activas."
              checked
              locked
            />
            <CategoryRow
              title="Analíticas"
              desc="Nos ayudan a entender el uso del sitio de forma agregada."
              checked={analytics}
              onChange={setAnalytics}
            />
            <CategoryRow
              title="Personalización"
              desc="Recuerdan tus preferencias para mostrarte contenido más relevante."
              checked={personalization}
              onChange={setPersonalization}
            />
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2.5 p-5 pt-3">
          {!configuring ? (
            <button
              type="button"
              onClick={() => setConfiguring(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
              style={{ borderColor: "var(--c-line)", color: "var(--c-text)", backgroundColor: "var(--c-surface)" }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Configurar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfiguring(false)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
              style={{ borderColor: "var(--c-line)", color: "var(--c-text)", backgroundColor: "var(--c-surface)" }}
            >
              Volver
            </button>
          )}

          <div className="flex-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => decide(false, false)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:opacity-90"
            style={{ borderColor: "var(--c-line)", color: "var(--c-muted)", backgroundColor: "transparent" }}
          >
            <X className="w-4 h-4" />
            Rechazar
          </button>

          {configuring && (
            <button
              type="button"
              onClick={() => decide(analytics, personalization)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
              style={{ borderColor: "var(--c-brand)", color: "var(--c-brand)", backgroundColor: "var(--c-brand-soft)" }}
            >
              Guardar
            </button>
          )}

          <button
            type="button"
            onClick={() => decide(true, true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
            style={{ backgroundColor: "var(--c-brand)" }}
          >
            <Check className="w-4 h-4" />
            Aceptar
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
        className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors mt-0.5"
        style={{
          backgroundColor: checked ? "var(--c-brand)" : "var(--c-line)",
          cursor: locked ? "not-allowed" : "pointer",
          opacity: locked ? 0.7 : 1,
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
