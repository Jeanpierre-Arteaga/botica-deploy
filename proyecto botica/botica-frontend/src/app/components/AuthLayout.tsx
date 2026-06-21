import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  Clock,
  type LucideIcon,
} from "lucide-react";
import logo from "@/imports/botica_icono-2.jpeg";

/**
 * AuthLayout — shell presentacional premium para todas las pantallas de
 * autenticación (login cliente, registro, acceso staff, acceso admin).
 *
 * Es 100% UI: no contiene estado, ni handlers, ni llamadas de auth. Cada
 * página mantiene su propia lógica y solo inserta su <form> como children.
 *
 * Layout dividido:
 *   · Panel de marca (izq, oculto en móvil): navy con logo, foto real de
 *     respaldo (// TODO) sobre degradado y bullets de confianza.
 *   · Panel de formulario (der): superficie con tokens --c-*; se adapta a
 *     tema claro/oscuro automáticamente.
 */

type AuthTone = "client" | "staff" | "admin";

interface TrustItem {
  icon: LucideIcon;
  text: string;
}

interface AuthLayoutProps {
  /** Título del formulario (panel derecho) */
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Links bajo el formulario (registro / volver, etc.) */
  footer?: ReactNode;
  /** Texto grande del panel de marca */
  brandHeadline: ReactNode;
  brandSubtext: string;
  /** Etiqueta tipo "chip" sobre el headline del panel de marca */
  badge?: string;
  tone?: AuthTone;
  /** Bullets de confianza del panel de marca (default: storefront) */
  trust?: TrustItem[];
  /** Ancho del formulario: las pantallas con muchos campos usan "wide" */
  width?: "narrow" | "wide";
}

const TONE_GLOW: Record<AuthTone, string> = {
  client: "rgba(241, 90, 41, 0.28)",
  staff: "rgba(56, 189, 248, 0.22)",
  admin: "rgba(56, 189, 248, 0.18)",
};

const DEFAULT_TRUST: TrustItem[] = [
  { icon: ShieldCheck, text: "Medicamentos certificados por DIGEMID" },
  { icon: Truck, text: "Delivery en 24 – 48 h a tu puerta" },
  { icon: Clock, text: "Atención de Lun a Dom · 8:00 a. m. – 10:00 p. m." },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  brandHeadline,
  brandSubtext,
  badge,
  tone = "client",
  trust = DEFAULT_TRUST,
  width = "narrow",
}: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen w-full lg:grid lg:grid-cols-[1.05fr_1fr]"
      style={{ backgroundColor: "var(--c-bg)" }}
    >
      {/* ===== Panel de marca (izquierda) ===== */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16"
        style={{
          background:
            "linear-gradient(160deg, var(--c-ink) 0%, var(--c-ink-2) 55%, #13233F 100%)",
        }}
      >
        {/* Foto real de respaldo. // TODO: reemplazar /auth-side.jpg por una
            imagen real (farmacia / atención al cliente). Si no existe, se ve
            solo el degradado navy y no se rompe nada. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-[0.16] mix-blend-luminosity"
          style={{ backgroundImage: "url('/auth-side.jpg')" }}
        />
        {/* Glow de acento según tono */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 w-[460px] h-[460px] rounded-full blur-[130px]"
          style={{ backgroundColor: TONE_GLOW[tone] }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 w-[420px] h-[420px] rounded-full blur-[140px]"
          style={{ backgroundColor: "rgba(30, 41, 59, 0.6)" }}
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

        {/* Mensaje central */}
        <div className="relative max-w-md">
          {badge && (
            <span
              className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide mb-6"
              style={{
                borderColor: "rgba(255,255,255,0.16)",
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "#7DD3FC",
              }}
            >
              {badge}
            </span>
          )}
          <h2
            className="text-3xl xl:text-4xl font-bold text-white leading-[1.15] mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {brandHeadline}
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{ color: "rgba(226,232,240,0.78)" }}
          >
            {brandSubtext}
          </p>
        </div>

        {/* Bullets de confianza */}
        <ul className="relative space-y-4">
          {trust.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3.5">
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Icon className="h-5 w-5" style={{ color: "var(--c-brand)" }} />
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "rgba(226,232,240,0.9)" }}
              >
                {text}
              </span>
            </li>
          ))}
        </ul>
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
          {/* Logo solo visible en móvil (panel de marca oculto) */}
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
