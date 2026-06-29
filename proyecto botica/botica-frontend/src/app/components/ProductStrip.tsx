import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./Skeleton";
import type { Product } from "../lib/types";

interface ProductStripProps {
  /** Título de la franja (p. ej. "Dermatología"). */
  title: string;
  /** Frase corta bajo el título. */
  subtitle: string;
  /** Enlace de acción a la derecha (catálogo filtrado por categoría). */
  action: { to: string; label: string };
  /** Productos a mostrar (4 en oferta). */
  products: Product[];
  /** Mientras true, muestra esqueletos en vez de tarjetas. */
  loading?: boolean;
}

/**
 * ProductStrip — "franja" de 4 productos LIGADA visualmente a un banner superior.
 *
 * A diferencia de las secciones sueltas (Ofertas/Destacados), esta franja se
 * renderiza como un PANEL conectado: superficie blanca, esquina redondeada y un
 * acento de marca en el encabezado, con MUY poca separación respecto al banner
 * que la precede, de modo que se lee como su continuación (no como una sección
 * aparte). Reutiliza <ProductCard> — las MISMAS tarjetas de "Productos
 * destacados" (imagen, nombre, laboratorio, stock, precio tachado + % OFF y
 * botón "Agregar" funcional).
 *
 * Si no está cargando y no hay productos, no renderiza nada (sin hueco roto).
 */
export function ProductStrip({
  title,
  subtitle,
  action,
  products,
  loading = false,
}: ProductStripProps) {
  if (!loading && products.length === 0) return null;

  return (
    <div
      className="mt-2.5 md:mt-3 rounded-2xl border p-5 md:p-6"
      style={{
        backgroundColor: "var(--c-surface)",
        borderColor: "var(--c-line)",
        boxShadow: "var(--elev-soft)",
      }}
    >
      {/* Encabezado de la franja: acento de marca + título + subtítulo y, a la
          derecha, el enlace "Ver todos los productos →". */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
        <div className="flex items-stretch gap-3 min-w-0">
          {/* Barra de acento que liga la franja con su banner (mismo naranja
              del CTA del banner superior). */}
          <span
            className="hidden sm:block w-1 rounded-full flex-shrink-0"
            style={{
              background:
                "linear-gradient(180deg, var(--c-brand), var(--c-brand-hover))",
            }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3
              className="text-xl md:text-[26px] font-bold leading-tight tracking-[-0.01em]"
              style={{
                color: "var(--c-text)",
                fontFamily: "var(--font-display)",
              }}
            >
              {title}
            </h3>
            <p
              className="mt-1 text-sm leading-snug"
              style={{ color: "var(--c-muted)" }}
            >
              {subtitle}
            </p>
          </div>
        </div>
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
      </div>

      {/* Grilla: 2 columnas en móvil, fila de 4 desde md (franja). */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={`strip-skel-${i}`} />
            ))
          : products.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
      </div>
    </div>
  );
}
