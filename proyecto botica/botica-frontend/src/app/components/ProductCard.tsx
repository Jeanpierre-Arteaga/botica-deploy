import { Link } from "react-router";
import { ShoppingCart, Pill } from "lucide-react";
import { useCart } from "../lib/CartContext";
import type { Product } from "../lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const hasStock =
    product.current_stock === undefined || product.current_stock > 0;
  const lowStock =
    product.current_stock !== undefined &&
    product.current_stock > 0 &&
    product.current_stock <= 5;
  const knownStock = typeof product.current_stock === "number";

  // Precio anterior tachado: solo en ofertas con old_price mayor al actual.
  const showOldPrice =
    product.is_offer &&
    product.old_price != null &&
    product.old_price > product.product_price;
  const discountPct = showOldPrice
    ? Math.round((1 - product.product_price / (product.old_price as number)) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasStock) return;
    addItem(product);
  };

  // Micro-indicador de stock: un punto de color + etiqueta discreta.
  const stock = !knownStock
    ? null
    : product.current_stock === 0
      ? { color: "var(--c-error)", label: "Agotado", muted: false }
      : lowStock
        ? { color: "var(--c-warning)", label: "Pocas unidades", muted: false }
        : { color: "var(--c-success)", label: "En stock", muted: true };

  return (
    <Link
      to={`/producto/${product.product_id}`}
      className="group rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: "var(--c-surface)",
        border: "1px solid var(--c-line)",
        boxShadow: "var(--elev-xs)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--elev-card)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--elev-xs)";
      }}
    >
      {/* ===== Área de imagen — fondo blanco puro, 1:1, contain ===== */}
      <div className="relative">
        <div
          className={`aspect-square flex items-center justify-center p-5 ${!hasStock ? "opacity-60" : ""}`}
          style={{
            backgroundColor: "var(--c-photo)",
            borderBottom: "1px solid var(--c-line-2)",
          }}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2"
              style={{ color: "var(--c-faint)" }}
            >
              <Pill className="w-10 h-10" />
              <span className="text-xs">Sin imagen</span>
            </div>
          )}
        </div>

        {/* "Oferta": tag sobrio, discreto, en el acento de marca (no grita) */}
        {product.is_offer && (
          <span
            className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[11px] font-semibold"
            style={{
              backgroundColor: "var(--c-brand-soft)",
              color: "var(--c-brand)",
            }}
          >
            Oferta
          </span>
        )}
      </div>

      {/* ===== Bloque de info ===== */}
      <div className="p-4 flex flex-col flex-1 gap-1.5">
        <h3
          className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]"
          style={{ color: "var(--c-text)" }}
        >
          {product.product_name}
        </h3>

        {(product.laboratory_name || product.active_ingredient) && (
          <p className="text-xs line-clamp-1" style={{ color: "var(--c-faint)" }}>
            {product.laboratory_name || product.active_ingredient}
          </p>
        )}

        {/* Stock como micro-indicador: punto + etiqueta, sin gritar */}
        {stock && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: stock.color }}
            />
            <span
              className="text-xs"
              style={{
                color: stock.muted ? "var(--c-muted)" : stock.color,
                fontWeight: stock.muted ? 400 : 500,
              }}
            >
              {stock.label}
            </span>
          </div>
        )}

        {/* ===== Bloque de precio + CTA, anclado abajo ===== */}
        <div className="mt-auto pt-2 space-y-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="font-bold text-xl leading-none"
              style={{ color: "var(--c-brand)" }}
            >
              S/ {Number(product.product_price).toFixed(2)}
            </span>
            {showOldPrice && (
              <>
                <span
                  className="text-sm line-through leading-none"
                  style={{ color: "var(--c-faint)" }}
                >
                  S/ {Number(product.old_price).toFixed(2)}
                </span>
                {/* Píldora roja de descuento — único elemento rojo "fuerte" */}
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full leading-none text-white"
                  style={{ backgroundColor: "var(--c-sale)" }}
                >
                  -{discountPct}%
                </span>
              </>
            )}
          </div>

          {/* Botón "Agregar": pill refinada que se rellena en hover */}
          <button
            type="button"
            disabled={!hasStock}
            onClick={handleAdd}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed"
            style={
              hasStock
                ? {
                    backgroundColor: "var(--c-brand-soft)",
                    color: "var(--c-brand)",
                    border: "1px solid var(--c-brand)",
                  }
                : {
                    backgroundColor: "var(--c-line-2)",
                    color: "var(--c-faint)",
                    border: "1px solid var(--c-line)",
                  }
            }
            onMouseEnter={(e) => {
              if (!hasStock) return;
              e.currentTarget.style.backgroundColor = "var(--c-brand)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              if (!hasStock) return;
              e.currentTarget.style.backgroundColor = "var(--c-brand-soft)";
              e.currentTarget.style.color = "var(--c-brand)";
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            {hasStock ? "Agregar" : "Agotado"}
          </button>
        </div>
      </div>
    </Link>
  );
}
