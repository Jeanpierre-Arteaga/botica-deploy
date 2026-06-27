import { useEffect, useRef, useState } from "react";
import {
  Accessibility,
  Type,
  Sun,
  Moon,
  RotateCcw,
} from "lucide-react";

/**
 * Menú de accesibilidad (UI pura, NO lógica de negocio).
 * Aplica data-attributes en <html> y persiste la preferencia en localStorage:
 *   data-a11y-text = "normal" | "lg" | "xl"
 *   data-theme     = "light" | "dark"
 * Los estilos viven en theme.css. Un mini-script en index.html los aplica
 * antes del primer pintado para evitar parpadeo.
 * (El respeto a prefers-reduced-motion del SO sigue activo por CSS.)
 *
 * Nota: el "alto contraste" ya NO es un toggle. El contraste fuerte está
 * incorporado en el diseño base (tokens --c-* con AA en claro y oscuro).
 */

type TextSize = "normal" | "lg" | "xl";
const TEXT_SIZES: TextSize[] = ["normal", "lg", "xl"];
const TEXT_LABELS: Record<TextSize, string> = {
  normal: "A",
  lg: "A+",
  xl: "A++",
};

type Theme = "light" | "dark";

const STORE = {
  text: "a11y-text",
  theme: "theme",
} as const;

function read(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function applyToHtml(attr: string, value: string) {
  document.documentElement.setAttribute(attr, value);
}

interface AccessibilityMenuProps {
  /** light = headers claros (storefront) · dark = top bars oscuras (admin/staff) */
  variant?: "light" | "dark";
  /**
   * Borde por el que se ancla el popover respecto al botón.
   * "right" (por defecto) abre hacia la izquierda — correcto cuando el
   * trigger está pegado al borde derecho (topbar). "left" abre hacia la
   * derecha — útil cuando el trigger está pegado al borde izquierdo.
   */
  align?: "right" | "left";
  className?: string;
}

export function AccessibilityMenu({
  variant = "light",
  align = "right",
  className = "",
}: AccessibilityMenuProps) {
  const [open, setOpen] = useState(false);
  const [textSize, setTextSize] = useState<TextSize>("normal");
  const [theme, setTheme] = useState<Theme>("light");
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Hidratar estado desde localStorage / DOM al montar
  useEffect(() => {
    setTextSize(read(STORE.text, "normal") as TextSize);
    setTheme(read(STORE.theme, "light") === "dark" ? "dark" : "light");
  }, []);

  // Persistir + aplicar a <html> cuando cambian las preferencias
  useEffect(() => {
    applyToHtml("data-a11y-text", textSize);
    try {
      localStorage.setItem(STORE.text, textSize);
    } catch {
      /* almacenamiento no disponible: solo aplicamos en memoria */
    }
  }, [textSize]);

  useEffect(() => {
    applyToHtml("data-theme", theme);
    try {
      localStorage.setItem(STORE.theme, theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  // Cerrar al hacer click fuera o con Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const reset = () => {
    setTextSize("normal");
    setTheme("light");
  };

  const triggerStyles =
    variant === "dark"
      ? "text-slate-200 hover:bg-white/10 hover:text-white"
      : "text-text hover:bg-brand-soft hover:text-brand";

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Opciones de accesibilidad y tema"
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${triggerStyles}`}
      >
        <Accessibility className="w-5 h-5" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Opciones de accesibilidad y tema"
          className={`absolute top-full mt-2 z-[60] ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{
            /* Ancho adaptable: nunca menor a 17rem ni mayor que el viewport.
               Al usar rem crece de forma controlada con el tamaño de texto
               (A/A+/A++) y el min() evita que se salga de pantalla. */
            width: "min(20rem, calc(100vw - 1.5rem))",
            minWidth: "min(17rem, calc(100vw - 1.5rem))",
            animation: "a11yPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {/* Tarjeta del panel — crece con el contenido y, si no cabe en
              alto (p. ej. con A++), hace scroll interno en vez de recortarse. */}
          <div
            className="rounded-2xl p-5 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.18)] border overflow-y-auto"
            style={{
              backgroundColor: "var(--c-surface)",
              borderColor: "var(--c-line)",
              maxHeight: "calc(100vh - 6rem)",
              backdropFilter: "saturate(180%) blur(16px)",
              WebkitBackdropFilter: "saturate(180%) blur(16px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--c-brand-soft)" }}
                >
                  <Accessibility
                    className="w-4 h-4"
                    style={{ color: "var(--c-brand)" }}
                  />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
                >
                  Apariencia
                </span>
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--c-muted)" }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer
              </button>
            </div>

            {/* Divider */}
            <div className="h-px mb-4" style={{ backgroundColor: "var(--c-line-2)" }} />

            {/* === Tema claro / oscuro === */}
            <div className="mb-5">
              <label
                className="flex items-center gap-2 mb-3 text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: "var(--c-faint)" }}
              >
                Tema
              </label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {theme === "light" ? (
                    <Sun className="w-[18px] h-[18px]" style={{ color: "var(--c-warning)" }} />
                  ) : (
                    <Moon className="w-[18px] h-[18px]" style={{ color: "var(--c-cool)" }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: "var(--c-text)" }}>
                    {theme === "light" ? "Claro" : "Oscuro"}
                  </span>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  aria-pressed={theme === "dark"}
                  aria-label={`Cambiar a tema ${theme === "light" ? "oscuro" : "claro"}`}
                  className="relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    backgroundColor:
                      theme === "dark" ? "var(--c-brand)" : "var(--c-line)",
                    outlineColor: "var(--c-brand)",
                  }}
                >
                  <span
                    className="absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-300"
                    style={{
                      transform:
                        theme === "dark" ? "translateX(20px)" : "translateX(0)",
                    }}
                  >
                    {theme === "dark" ? (
                      <Moon className="w-3 h-3" style={{ color: "var(--c-brand)" }} />
                    ) : (
                      <Sun className="w-3 h-3" style={{ color: "var(--c-warning)" }} />
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* === Tamaño de texto — segmented control === */}
            <div className="mb-5">
              <label
                className="flex items-center gap-2 mb-3 text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: "var(--c-faint)" }}
              >
                <Type className="w-3.5 h-3.5" />
                Tamaño de texto
              </label>
              <div
                className="flex gap-1 p-1 rounded-xl"
                style={{ backgroundColor: "var(--c-line-2)" }}
              >
                {TEXT_SIZES.map((size) => {
                  const active = textSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTextSize(size)}
                      aria-pressed={active}
                      className="flex-1 py-2 rounded-lg text-center font-semibold transition-all duration-200"
                      style={{
                        fontSize:
                          size === "normal"
                            ? "13px"
                            : size === "lg"
                              ? "15px"
                              : "17px",
                        backgroundColor: active ? "var(--c-surface)" : "transparent",
                        color: active ? "var(--c-brand)" : "var(--c-muted)",
                        boxShadow: active
                          ? "0 1px 3px rgba(15,23,42,0.08)"
                          : "none",
                      }}
                    >
                      {TEXT_LABELS[size]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation keyframes (injected once) */}
      <style>{`
        @keyframes a11yPopIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
