import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import logo from "@/imports/botica_icono-2.jpeg";
import authHero from "@/imports/login_hero.png";

/**
 * AuthLayout — shell presentacional compartido por TODAS las pantallas de
 * autenticación (login cliente, staff y admin).
 *
 * Es 100% UI: no contiene estado, ni handlers, ni llamadas de auth. Cada
 * página mantiene su propia lógica y solo inserta su <form> como children.
 *
 * Modelo: imagen real a pantalla completa (ocupa algo más de la mitad por el
 * encuadre) + scrim oscuro para contraste + TARJETA flotante superpuesta con
 * el formulario. Sobre la imagen, solo una línea de marca minimalista. La
 * tarjeta usa tokens --c-* y se adapta a tema claro/oscuro automáticamente.
 */

type AuthTone = "client" | "staff" | "admin";

interface AuthLayoutProps {
  /** Título del formulario (dentro de la tarjeta) */
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Links bajo el formulario (registro / volver, etc.) */
  footer?: ReactNode;
  /** UNA línea corta sobre la imagen (lo único que cambia por pantalla) */
  brandLine: ReactNode;
  tone?: AuthTone;
  /** Ancho de la tarjeta: las pantallas con muchos campos usan "wide" */
  width?: "narrow" | "wide";
  /**
   * Cuando la pantalla va DENTRO del chrome del sitio (TopBar + Navbar), el
   * layout llena el alto restante en vez de ocupar el viewport completo, y se
   * omite el "Volver al inicio" (la navegación del sitio ya está presente).
   * Las pantallas standalone (staff/admin) lo dejan en false.
   */
  embedded?: boolean;
}

/** Sello de confianza según el tono (texto sobre la imagen, minimalista) */
const TONE_TRUST: Record<AuthTone, string> = {
  client: "Certificado DIGEMID · Entrega rápida y confiable",
  staff: "Acceso seguro para el personal de botica",
  admin: "Panel de administración · acceso restringido",
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  brandLine,
  tone = "client",
  width = "narrow",
  embedded = false,
}: AuthLayoutProps) {
  return (
    <div
      className={`relative isolate w-full overflow-hidden flex items-stretch justify-center lg:justify-end ${
        embedded ? "flex-1 min-h-0" : "min-h-[100svh]"
      }`}
      style={{ backgroundColor: "var(--c-ink)" }}
    >
      {/* ===== Imagen de fondo a pantalla completa ===== */}
      <img
        src={authHero}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* ===== Velo/scrim calibrado: deja respirar la foto a la izquierda
            (texto blanco legible) y la oscurece hacia la derecha para que la
            tarjeta tenga base limpia. Tinte navy frío, coherente con --c-ink. ===== */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(8,15,30,0.48) 0%, rgba(8,15,30,0.42) 38%, rgba(8,15,30,0.72) 72%, rgba(8,15,30,0.86) 100%)",
        }}
      />
      {/* Refuerzo inferior: asienta la línea de marca sobre la imagen. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 42%, rgba(8,15,30,0.55) 100%)",
        }}
      />
      {/* Refuerzo extra solo móvil (la tarjeta queda centrada sobre la foto) */}
      <div
        aria-hidden
        className="absolute inset-0 lg:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,15,30,0.30) 0%, rgba(8,15,30,0.50) 100%)",
        }}
      />

      {/* ===== Texto de marca sobre la imagen (solo desktop) ===== */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden lg:flex w-[52%] flex-col justify-end p-12 xl:p-14">
        <span
          className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85"
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--c-brand)" }}
          />
          Boticas Central
        </span>
        <h2
          className="max-w-md text-[2rem] xl:text-[2.5rem] font-bold text-white leading-[1.12]"
          style={{
            fontFamily: "var(--font-display)",
            textShadow: "0 2px 18px rgba(8,15,30,0.55)",
          }}
        >
          {brandLine}
        </h2>
        <p className="mt-4 max-w-sm text-[13.5px] font-medium leading-relaxed text-white/80">
          {TONE_TRUST[tone]}
        </p>
      </div>

      {/* ===== Tarjeta flotante con el formulario (centrada; scroll interno
            solo si el viewport es muy bajo, nunca scroll de página) ===== */}
      <main className="relative z-10 flex w-full items-center justify-center overflow-y-auto px-5 py-6 sm:px-8 lg:w-[48%] lg:px-10 xl:px-14">
        <div
          className={`animate-fade-in-up my-auto w-full rounded-[1.5rem] border p-6 sm:p-8 ${
            width === "wide" ? "max-w-xl" : "max-w-md"
          }`}
          style={{
            backgroundColor: "color-mix(in srgb, var(--c-surface) 95%, transparent)",
            borderColor: "color-mix(in srgb, var(--c-line) 70%, transparent)",
            boxShadow: "var(--elev-pop)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* Volver al inicio — solo standalone (staff/admin); en cliente el
              header del sitio ya ofrece la navegación. */}
          {!embedded && (
            <Link
              to="/"
              className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: "var(--c-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-brand)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-muted)")}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          )}

          {/* Logo + título */}
          <div className="mb-6 flex flex-col items-center text-center">
            <Link to="/" className="inline-flex">
              <img
                src={logo}
                alt="Boticas Central"
                className="h-12 w-auto rounded-2xl shadow-sm"
              />
            </Link>
            <h1
              className="mt-4 text-2xl sm:text-[1.7rem] font-bold leading-tight"
              style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm" style={{ color: "var(--c-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>

          {children}

          {footer && <div className="mt-6">{footer}</div>}
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
