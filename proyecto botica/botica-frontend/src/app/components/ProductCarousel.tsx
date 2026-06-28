// ============================================================
// ProductCarousel — carrusel horizontal de productos
// ------------------------------------------------------------
// Ligero (sin librerías): scroll-snap nativo + botones que
// avanzan/retroceden una "página" completa + dots de paginación.
//  - Desktop (lg): 4 por vista · Tablet (sm): 2 · Móvil: ~1.25
//  - Tarjetas un poco más grandes y MÁS juntas (gap reducido).
//  - Dots debajo: el activo en naranja (pill ancho), inactivos gris.
//    Se sincronizan al desplazar; click → scroll suave a ese grupo.
//  - Flechas con aria-label, navegables por teclado.
//  - Flechas atenuadas/deshabilitadas en el primer/último grupo.
//  - Reutiliza <ProductCard>; no duplica estilos.
//  - En móvil se desliza con el dedo (swipe) además de las flechas.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "../lib/types";

interface ProductCarouselProps {
  products: Product[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Margen de 4px para tolerar redondeos del navegador.
    const atEnd = scrollLeft >= scrollWidth - clientWidth - 4;
    setCanPrev(scrollLeft > 4);
    setCanNext(!atEnd);
    // Una "página" = ancho visible. Nº de grupos = veces que cabe el contenido.
    const pages =
      clientWidth > 0 ? Math.max(1, Math.ceil((scrollWidth - 4) / clientWidth)) : 1;
    setPageCount(pages);
    // En la última página parcial el cálculo por redondeo se queda corto:
    // si llegamos al final, fijamos el último dot como activo.
    setActivePage(
      atEnd ? pages - 1 : Math.min(pages - 1, Math.round(scrollLeft / clientWidth))
    );
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, products]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // Una "página" = ancho visible (muestra el siguiente grupo sin huecos).
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  const scrollToPage = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    // El navegador recorta si nos pasamos del máximo (última página parcial).
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <div className="relative">
      {/* Flecha izquierda */}
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        disabled={!canPrev}
        aria-label="Ver productos anteriores"
        className="hidden sm:flex absolute -left-3 lg:-left-5 top-[42%] -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-surface border border-line shadow-md transition-all hover:border-brand hover:text-brand disabled:opacity-0 disabled:pointer-events-none"
        style={{ color: "var(--c-text)" }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Pista */}
      <div
        ref={trackRef}
        className="grid grid-flow-col auto-cols-[80%] sm:auto-cols-[calc(50%-6px)] lg:auto-cols-[calc(25%-9px)] gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        role="group"
        aria-label="Carrusel de productos"
      >
        {products.map((product) => (
          <div key={product.product_id} className="snap-start min-w-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Flecha derecha */}
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        disabled={!canNext}
        aria-label="Ver más productos"
        className="hidden sm:flex absolute -right-3 lg:-right-5 top-[42%] -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-surface border border-line shadow-md transition-all hover:border-brand hover:text-brand disabled:opacity-0 disabled:pointer-events-none"
        style={{ color: "var(--c-text)" }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots de paginación */}
      {pageCount > 1 && (
        <div
          className="mt-5 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Paginación del carrusel"
        >
          {Array.from({ length: pageCount }).map((_, i) => {
            const active = i === activePage;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Ir al grupo ${i + 1} de ${pageCount}`}
                onClick={() => scrollToPage(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  active
                    ? "w-6 bg-brand"
                    : "w-2 bg-line hover:bg-faint/60"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
