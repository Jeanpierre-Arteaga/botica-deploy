import { Link } from "react-router";
import { ShoppingCart, Pill } from "lucide-react";
import { Button } from "./ui/Button";
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
        e.currentTarget.style.borderColor = "var(--c-line)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--elev-xs)";
        e.currentTarget.style.borderColor = "var(--c-line)";
      }}
    >
      <div className="relative">
        <div
          className={`p-4 ${!hasStock ? "opacity-60" : ""}`}
          style={{ backgroundColor: "var(--c-brand-soft)" }}
        >
          <div
            className="aspect-square flex items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: "var(--c-surface)" }}
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
                style={{
                  backgroundColor: "var(--c-brand-soft)",
                  color: "var(--c-faint)",
                }}
              >
                <Pill className="w-10 h-10" />
                <span className="text-xs">Sin imagen</span>
              </div>
            )}
          </div>
        </div>

        {product.is_offer && (
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: "var(--c-brand)" }}
          >
            Oferta
          </div>
        )}
        {lowStock && hasStock && (
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: "var(--c-warning)" }}
          >
            Pocas unidades
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3
          className="text-sm font-normal leading-snug line-clamp-2 transition-colors min-h-[2.5rem]"
          style={{ color: "var(--c-text)" }}
        >
          {product.product_name}
        </h3>

        {(product.laboratory_name || product.active_ingredient) && (
          <p className="text-xs line-clamp-1" style={{ color: "var(--c-faint)" }}>
            {product.laboratory_name || product.active_ingredient}
          </p>
        )}

        {typeof product.current_stock === "number" &&
          (product.current_stock === 0 ? (
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--c-error)" }}
            >
              Agotado
            </p>
          ) : product.current_stock <= 5 ? (
            <p
              className="text-xs font-medium"
              style={{ color: "var(--c-warning)" }}
            >
              Pocas unidades ({product.current_stock})
            </p>
          ) : (
            <p className="text-xs" style={{ color: "var(--c-muted)" }}>
              Stock disponible: {product.current_stock}
            </p>
          ))}

        <div className="mt-auto space-y-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="font-semibold text-xl leading-none"
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
                <span
                  className="text-[11px] font-bold px-1.5 py-0.5 rounded leading-none"
                  style={{
                    backgroundColor: "var(--c-brand-soft)",
                    color: "var(--c-brand)",
                  }}
                >
                  -{discountPct}%
                </span>
              </>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            disabled={!hasStock}
            iconLeft={ShoppingCart}
            onClick={handleAdd}
          >
            {hasStock ? "Agregar" : "Agotado"}
          </Button>
        </div>
      </div>
    </Link>
  );
}
