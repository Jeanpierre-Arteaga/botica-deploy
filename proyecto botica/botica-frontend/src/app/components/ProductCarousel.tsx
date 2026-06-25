// ============================================================
// ProductCarousel — carrusel horizontal de productos
// ------------------------------------------------------------
// Ligero (sin librerías): scroll-snap nativo + botones que
// avanzan/retroceden una "página" completa.
//  - Desktop (lg): 4 por vista · Tablet (sm): 2 · Móvil: ~1.4
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

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Margen de 4px para tolerar redondeos del navegador.
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, products]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // Una "página" = ancho visible (muestra el siguiente grupo sin huecos).
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <div className="relative">
      {/* Flecha izquierda */}
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        disabled={!canPrev}
        aria-label="Ver ofertas anteriores"
        className="hidden sm:flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-surface border border-line shadow-md transition-all hover:border-brand hover:text-brand disabled:opacity-0 disabled:pointer-events-none"
        style={{ color: "var(--c-text)" }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Pista */}
      <div
        ref={trackRef}
        className="grid grid-flow-col auto-cols-[72%] sm:auto-cols-[calc(50%-10px)] lg:auto-cols-[calc(25%-15px)] gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        role="group"
        aria-label="Carrusel de ofertas"
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
        aria-label="Ver más ofertas"
        className="hidden sm:flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-surface border border-line shadow-md transition-all hover:border-brand hover:text-brand disabled:opacity-0 disabled:pointer-events-none"
        style={{ color: "var(--c-text)" }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
