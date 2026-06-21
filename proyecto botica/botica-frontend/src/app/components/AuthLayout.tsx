import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import logo from "@/imports/botica_icono-2.jpeg";

/**
 * AuthLayout — shell presentacional minimalista para todas las pantallas de
 * autenticación (login cliente, registro, acceso staff, acceso admin).
 *
 * Es 100% UI: no contiene estado, ni handlers, ni llamadas de auth. Cada
 * página mantiene su propia lógica y solo inserta su <form> como children.
 *
 * Layout dividido:
 *   · Panel media (izq, oculto en móvil): imagen/video real opcional sobre un
 *     degradado cinematográfico navy con glow de acento (ken-burns sutil).
 *     Solo logo + UNA línea corta. Sin bullets ni textos largos.
 *   · Panel de formulario (der): superficie con tokens --c-*; se adapta a
 *     tema claro/oscuro automáticamente.
 */

type AuthTone = "client" | "staff" | "admin";

interface AuthLayoutProps {
  /** Título del formulario (panel derecho) */
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Links bajo el formulario (registro / volver, etc.) */
  footer?: ReactNode;
  /** UNA línea corta sobre el panel media (lo único que cambia por pantalla) */
  brandLine: ReactNode;
  tone?: AuthTone;
  /** Ancho del formulario: las pantallas con muchos campos usan "wide" */
  width?: "narrow" | "wide";
}

/** Glow de acento según el tono de la pantalla */
const TONE_GLOW: Record<AuthTone, string> = {
  client: "rgba(241, 90, 41, 0.32)",
  staff: "rgba(56, 189, 248, 0.26)",
  admin: "rgba(56, 189, 248, 0.22)",
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  brandLine,
  tone = "client",
  width = "narrow",
}: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen w-full lg:grid lg:grid-cols-[1.05fr_1fr]"
      style={{ backgroundColor: "var(--c-bg)" }}
    >
      {/* ===== Panel media (izquierda) ===== */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16"
        style={{
          background:
            "linear-gradient(155deg, var(--c-ink) 0%, var(--c-ink-2) 50%, #13233F 100%)",
        }}
      >
        {/* Media real opcional (foto/poster). Si /auth-side.jpg no existe se ve
            solo el degradado navy y no se rompe nada. Ken-burns muy sutil. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-[0.20] mix-blend-luminosity animate-kenburns"
          style={{ backgroundImage: "url('/auth-side.jpg')" }}
        />
        {/* Glow de acento según tono */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -right-20 w-[480px] h-[480px] rounded-full blur-[140px]"
          style={{ backgroundColor: TONE_GLOW[tone] }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-36 -left-20 w-[440px] h-[440px] rounded-full blur-[150px]"
          style={{ backgroundColor: "rgba(30, 41, 59, 0.55)" }}
        />
        {/* Velo inferior para asentar la línea de marca */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background:
              "linear-gradient(to top, rgba(6,11,22,0.55) 0%, transparent 100%)",
          }}
        />

        {/* Logo */}
        <div className="relative">
          <Link to="/" className="inline-flex">
            <img
              src={logo}
              alt="Boticas Central"
              className="h-14 w-auto rounded-2xl shadow-lg"
            />
          </Link>
        </div>

        {/* UNA línea corta */}
        <h2
          className="relative max-w-md text-3xl xl:text-4xl font-bold text-white leading-[1.15]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {brandLine}
        </h2>
      </aside>

      {/* ===== Panel de formulario (derecha) ===== */}
      <main className="flex flex-col px-5 py-8 sm:px-8 md:px-12 lg:py-10">
        {/* Volver al inicio */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "var(--c-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--c-brand)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--c-muted)")
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>

        <div
          className={`flex flex-1 flex-col justify-center mx-auto w-full ${
            width === "wide" ? "max-w-xl" : "max-w-md"
          }`}
        >
          {/* Logo solo visible en móvil (panel media oculto) */}
          <Link to="/" className="lg:hidden mb-8 inline-flex">
            <img
              src={logo}
              alt="Boticas Central"
              className="h-12 w-auto rounded-2xl"
            />
          </Link>

          <div className="mb-7">
            <h1
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-[15px]" style={{ color: "var(--c-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>

          {children}

          {footer && <div className="mt-7">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

/* Clases compartidas para campos de formulario (consistencia entre pantallas) */
export const authInputClass =
  "w-full rounded-xl border bg-surface border-line px-4 h-11 text-[15px] text-text placeholder:text-faint outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30";

export const authLabelClass =
  "block text-sm font-medium mb-1.5 text-text";

interface AuthFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Wrapper presentacional label + campo + error (estilo unificado) */
export function AuthField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className={authLabelClass}>
        {label}
        {required && <span style={{ color: "var(--c-brand)" }}> *</span>}
        {hint && (
          <span className="ml-1 text-xs font-normal" style={{ color: "var(--c-faint)" }}>
            {hint}
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--c-error)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface AuthButtonProps {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

/** Botón submit naranja a ancho completo (presentacional) */
export function AuthSubmit({ children, disabled, loading }: AuthButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full h-11 rounded-xl font-semibold text-white text-[15px] transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
      style={{ backgroundColor: "var(--c-brand)" }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = "var(--c-brand-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--c-brand)";
      }}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
