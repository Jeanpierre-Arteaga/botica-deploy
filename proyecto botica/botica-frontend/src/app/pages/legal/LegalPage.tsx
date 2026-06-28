// ============================================================
// LegalPage — layout base de las páginas legales
// ============================================================
// Estructura moderna y legible para documentos legales (Política de
// Privacidad, Términos y Condiciones):
//   · Encabezado con icono, título, fecha de "última actualización"
//     y la base legal del documento.
//   · Índice de navegación con anclas a cada sección. En desktop es
//     un sidebar pegajoso (sticky) con resaltado de la sección activa
//     (scrollspy); en móvil colapsa a un índice superior.
//   · Contenido en secciones numeradas, ancho de lectura cómodo
//     (~720px), buen interlineado y scroll suave al navegar.
//   · Aviso discreto de "documento referencial".
//
// Coherente con el resto del sitio: usa los tokens semánticos
// (--c-*), tipografía de marca y se adapta a claro/oscuro.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Calendar, ListTree, Info, ShieldAlert } from "lucide-react";
import { Container } from "../../components/Container";
import { PROVEEDOR, LEGAL_LAST_UPDATED } from "./proveedor";

export interface LegalSection {
  id: string;
  /** Número visible de la sección (ej. "1", "2"). */
  number: string;
  /** Título de la sección — se usa también en el índice. */
  title: string;
  content: React.ReactNode;
}

interface LegalPageProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  /** Base legal / bajada que aparece bajo el título. */
  legalBasis: React.ReactNode;
  sections: LegalSection[];
}

export function LegalPage({ icon: Icon, title, legalBasis, sections }: LegalPageProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Scrollspy: resalta en el índice la sección visible más arriba.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // Ventana centrada: marca activa la sección que entra en el tercio superior.
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const handleNav = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    // Actualiza el hash sin saltar bruscamente.
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div style={{ backgroundColor: "var(--c-bg)" }}>
      <Container className="py-10 md:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors hover:opacity-80"
          style={{ color: "var(--c-brand)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        {/* Encabezado */}
        <header className="mb-8">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--c-brand-soft)" }}
            >
              <Icon className="w-7 h-7" style={{ color: "var(--c-brand)" }} />
            </div>
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold"
                style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
              >
                {title}
              </h1>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--c-muted)" }}>
                {legalBasis}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pl-0 md:pl-[72px]">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "var(--c-surface-2)", color: "var(--c-muted)" }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: "var(--c-brand)" }} />
              Última actualización: {LEGAL_LAST_UPDATED}
            </span>
            <span className="text-xs" style={{ color: "var(--c-faint)" }}>
              {PROVEEDOR.razon_social} · RUC {PROVEEDOR.ruc}
            </span>
          </div>
        </header>

        {/* Aviso de documento referencial */}
        <div
          className="rounded-2xl p-4 md:p-5 mb-8 border flex gap-3 md:pl-[72px]"
          style={{ backgroundColor: "var(--c-warning-soft)", borderColor: "var(--c-line)" }}
        >
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--c-warning)" }} />
          <p className="text-sm leading-relaxed" style={{ color: "var(--c-muted)" }}>
            <strong style={{ color: "var(--c-text)" }}>Documento referencial.</strong> Este texto es un
            borrador funcional y debe ser revisado por asesoría legal antes de su publicación definitiva.
          </p>
        </div>

        {/* Cuerpo: índice + contenido */}
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Índice de navegación */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav
              className="rounded-2xl border p-4"
              style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-line)", boxShadow: "var(--elev-xs)" }}
              aria-label="Índice del documento"
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <ListTree className="w-4 h-4" style={{ color: "var(--c-brand)" }} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--c-faint)" }}
                >
                  Contenido
                </span>
              </div>
              <ul className="space-y-0.5">
                {sections.map((s) => {
                  const active = activeId === s.id;
                  return (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        onClick={(e) => handleNav(e, s.id)}
                        className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
                        style={{
                          backgroundColor: active ? "var(--c-brand-soft)" : "transparent",
                          color: active ? "var(--c-brand)" : "var(--c-muted)",
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        <span
                          className="text-xs font-bold tabular-nums mt-0.5 flex-shrink-0"
                          style={{ color: active ? "var(--c-brand)" : "var(--c-faint)" }}
                        >
                          {s.number}
                        </span>
                        <span className="leading-snug">{s.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Contenido — ancho de lectura cómodo */}
          <article className="max-w-[720px]">
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-line)", boxShadow: "var(--elev-xs)" }}
            >
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  ref={(el) => {
                    sectionRefs.current[s.id] = el;
                  }}
                  className="p-6 md:p-8"
                  style={{
                    scrollMarginTop: "96px",
                    borderTop: i === 0 ? "none" : "1px solid var(--c-line-2)",
                  }}
                >
                  <h2
                    className="flex items-baseline gap-3 text-lg md:text-xl font-bold mb-4"
                    style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
                  >
                    <span
                      className="text-sm font-bold tabular-nums px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: "var(--c-brand-soft)", color: "var(--c-brand)" }}
                    >
                      {s.number}
                    </span>
                    <span>{s.title}</span>
                  </h2>
                  <div className="legal-prose">{s.content}</div>
                </section>
              ))}
            </div>

            {/* Pie de contacto */}
            <div
              className="mt-6 rounded-2xl border p-5 flex items-start gap-3"
              style={{ backgroundColor: "var(--c-info-soft)", borderColor: "var(--c-line)" }}
            >
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--c-info)" }} />
              <p className="text-sm leading-relaxed" style={{ color: "var(--c-muted)" }}>
                ¿Dudas sobre este documento? Escríbenos a{" "}
                <a
                  href={`mailto:${PROVEEDOR.email_contacto}`}
                  className="font-semibold hover:underline"
                  style={{ color: "var(--c-brand)" }}
                >
                  {PROVEEDOR.email_contacto}
                </a>
                .
              </p>
            </div>

            <p className="mt-6 text-xs text-center" style={{ color: "var(--c-faint)" }}>
              {PROVEEDOR.razon_social} — RUC {PROVEEDOR.ruc} · {PROVEEDOR.domicilio}
            </p>
          </article>
        </div>
      </Container>

      {/* Estilos de prosa legal: ritmo de lectura cómodo, coherente con tokens */}
      <style>{`
        .legal-prose p {
          color: var(--c-muted);
          font-size: 0.9375rem;
          line-height: 1.75;
          margin: 0 0 0.875rem;
        }
        .legal-prose p:last-child { margin-bottom: 0; }
        .legal-prose strong { color: var(--c-text); font-weight: 600; }
        .legal-prose a { color: var(--c-brand); font-weight: 500; }
        .legal-prose a:hover { text-decoration: underline; }
        .legal-prose ul {
          margin: 0 0 0.875rem;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .legal-prose ul li {
          position: relative;
          padding-left: 1.4rem;
          color: var(--c-muted);
          font-size: 0.9375rem;
          line-height: 1.7;
        }
        .legal-prose ul li::before {
          content: "";
          position: absolute;
          left: 0.1rem;
          top: 0.6rem;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background-color: var(--c-brand);
        }
        .legal-prose h3 {
          color: var(--c-text);
          font-size: 0.95rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem;
        }
      `}</style>
    </div>
  );
}
