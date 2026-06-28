import { Link } from "react-router";
import { Fragment, type ReactNode } from "react";

/**
 * PageHeader — encabezado ÚNICO para páginas internas del storefront
 * (Catálogo, Carrito, Checkout, Mis pedidos, PDP, etc.).
 *
 * Unifica el patrón breadcrumb + título + subtítulo + acción a la derecha que
 * antes cada página reinventaba a mano (con espaciados y tamaños distintos).
 * Misma escala tipográfica que SectionHeader para que se vean hermanas:
 * título Sora bold navy (~30px), subtítulo Inter muted.
 *
 * Uso:
 *   <PageHeader
 *     breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Carrito" }]}
 *     title="Tu carrito"
 *     subtitle="3 productos en Sede Ate"
 *   />
 *
 * El último crumb es el actual (sin enlace aunque traiga `to`).
 */
export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  breadcrumbs?: Crumb[];
  title: ReactNode;
  subtitle?: ReactNode;
  /** Bloque de acción a la derecha (botón, enlace, contador…). */
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  action,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`mb-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Ruta de navegación"
          className="text-sm mb-2.5 flex flex-wrap items-center"
          style={{ color: "var(--c-muted)" }}
        >
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {i > 0 && (
                  <span className="mx-2" style={{ color: "var(--c-faint)" }}>
                    ›
                  </span>
                )}
                {isLast || !crumb.to ? (
                  <span
                    className="font-medium"
                    style={{ color: "var(--c-text)" }}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.to}
                    className="transition-colors"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--c-brand)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--c-muted)")
                    }
                  >
                    {crumb.label}
                  </Link>
                )}
              </Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1
            className="text-[26px] md:text-[30px] font-bold leading-[1.15] tracking-[-0.02em]"
            style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-2 text-[14.5px] leading-snug"
              style={{ color: "var(--c-muted)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
