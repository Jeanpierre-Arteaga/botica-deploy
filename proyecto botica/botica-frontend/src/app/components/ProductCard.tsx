import { Link } from "react-router";
import { ShoppingCart, Pill } from "lucide-react";
import { useCart } from "../lib/CartContext";
import { useVoiceReader, formatPriceForSpeech } from "../lib/voiceReader";
import type { Product } from "../lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { speak, speakAction } = useVoiceReader();

  const hasStock =
    product.current_stock === undefined || product.current_stock > 0;
  const lowStock =
    product.current_stock !== undefined &&
    product.current_stock > 0 &&
    product.current_stock <= 5;
  const knownStock = typeof product.current_stock === "number";

  // Precio anterior tachado: cualquier producto con old_price mayor al actual
  // (no solo ofertas), para que también se vea el descuento en Destacados.
  const showOldPrice =
    product.old_price != null && product.old_price > product.product_price;
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

  // Texto que lee la voz (si el usuario activó la lectura): nombre + precio
  // + disponibilidad. speak() no hace nada si el toggle está apagado.
  const spokenText =
    `${product.product_name}. ` +
    `Precio: ${formatPriceForSpeech(product.product_price)}.` +
    (stock ? ` ${stock.label}.` : "");

  return (
    <Link
      to={`/producto/${product.product_id}`}
      // Esta tarjeta lee su propio contenido rico (nombre + precio + stock);
      // el lector global de controles ignora este subárbol para no duplicar.
      data-voice-skip
      className="group rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: "var(--c-surface)",
        border: "1px solid var(--c-line)",
        boxShadow: "var(--elev-xs)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--elev-card)";
        speak(spokenText);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--elev-xs)";
      }}
      onFocus={() => speak(spokenText)}
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
              <Pill className="w-10 h-10" aria-hidden="true" />
              <span className="text-xs">Sin imagen</span>
            </div>
          )}
        </div>

        {/* Insignia de esquina ÚNICA y fuerte:
            - con descuento → píldora SÓLIDA roja "-XX%" (resalta sobre el blanco)
            - oferta sin %     → píldora SÓLIDA naranja "Oferta"
            Texto blanco bold + sombra tintada para que llame sin gritar. */}
        {(discountPct > 0 || product.is_offer) && (
          <span
            className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-extrabold leading-none tracking-tight text-white"
            style={{
              backgroundColor:
                discountPct > 0 ? "var(--c-sale)" : "var(--c-brand)",
              boxShadow:
                discountPct > 0
                  ? "0 4px 12px -2px rgba(225, 29, 72, 0.5)"
                  : "0 4px 12px -2px rgba(241, 90, 41, 0.5)",
            }}
          >
            {discountPct > 0 ? `-${discountPct}%` : "Oferta"}
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
              <span
                className="text-sm line-through leading-none"
                style={{ color: "var(--c-faint)" }}
              >
                S/ {Number(product.old_price).toFixed(2)}
              </span>
            )}
          </div>

          {/* Botón "Agregar": pill refinada que se rellena en hover */}
          <button
            type="button"
            disabled={!hasStock}
            onClick={handleAdd}
            aria-label={
              hasStock
                ? `Agregar ${product.product_name} al carrito`
                : `${product.product_name}: agotado`
            }
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
              // Anuncio de ACCIÓN (rol + nombre): "Agregar X al carrito, botón".
              speakAction(`Agregar ${product.product_name} al carrito`);
            }}
            onFocus={(e) => {
              // Evita que el onFocus del Link (que lee el producto) pise el
              // anuncio de acción del botón.
              e.stopPropagation();
              if (hasStock) speakAction(`Agregar ${product.product_name} al carrito`);
            }}
            onMouseLeave={(e) => {
              if (!hasStock) return;
              e.currentTarget.style.backgroundColor = "var(--c-brand-soft)";
              e.currentTarget.style.color = "var(--c-brand)";
            }}
          >
            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            {hasStock ? "Agregar" : "Agotado"}
          </button>
        </div>
      </div>
    </Link>
  );
}
