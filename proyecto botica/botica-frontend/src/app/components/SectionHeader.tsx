import { Link } from "react-router";
import { ArrowRight, MapPin } from "lucide-react";
import type { ReactNode } from "react";

/**
 * SectionHeader — patrón ÚNICO de encabezado de sección del home.
 *
 * Coherente con el login: titular Sora bold navy + subtítulo Inter muted, con un
 * chip neutro opcional al lado (p. ej. "Sede Ate") y un enlace de acción sobrio a
 * la derecha (acento solo en hover).
 *
 * Variantes:
 *  - align="left"   (por defecto): título a la izquierda, acción a la derecha.
 *  - align="center": título centrado (para secciones tipo "intro"); sin acción.
 *  - eyebrow: pill/badge opcional SOBRE el título (p. ej. "Profesionales colegiados").
 *
 * MISMA escala tipográfica en todas las secciones para que se vean hermanas.
 */
interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Chip neutro al lado del subtítulo (ej. "Sede Ate"). */
  chip?: ReactNode;
  /** Pill/badge opcional sobre el título. */
  eyebrow?: ReactNode;
  /** Enlace de acción a la derecha (solo en align="left"). */
  action?: { to: string; label: string };
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  chip,
  eyebrow,
  action,
  align = "left",
  className,
}: SectionHeaderProps) {
  const isCenter = align === "center";
  return (
    <div
      className={`flex flex-col gap-3 ${
        isCenter
          ? "items-center text-center"
          : "md:flex-row md:items-end md:justify-between"
      } ${className ?? ""}`}
    >
      <div className={`min-w-0 ${isCenter ? "max-w-2xl" : ""}`}>
        {eyebrow && (
          <div className={`mb-4 ${isCenter ? "flex justify-center" : ""}`}>
            {eyebrow}
          </div>
        )}
        <h2
          className="text-[26px] md:text-[28px] font-bold leading-[1.15] tracking-[-0.02em]"
          style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        {(subtitle || chip) && (
          <div
            className={`mt-2.5 flex flex-wrap items-center gap-2.5 ${
              isCenter ? "justify-center" : ""
            }`}
          >
            {subtitle && (
              <p
                className="text-[14.5px] leading-snug"
                style={{ color: "var(--c-muted)" }}
              >
                {subtitle}
              </p>
            )}
            {chip && (
              <span
                className="inline-flex items-center gap-1 rounded-full pl-1.5 pr-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: "var(--c-surface-2)",
                  color: "var(--c-muted)",
                  border: "1px solid var(--c-line)",
                }}
              >
                <MapPin
                  className="w-3.5 h-3.5"
                  strokeWidth={2}
                  style={{ color: "var(--c-brand)" }}
                />
                {chip}
              </span>
            )}
          </div>
        )}
      </div>

      {action && !isCenter && (
        <Link
          to={action.to}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 transition-colors"
          style={{ color: "var(--c-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-brand)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-muted)")}
        >
          {action.label}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
