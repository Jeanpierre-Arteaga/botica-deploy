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

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasStock) return;
    addItem(product);
  };

  return (
    <Link
      to={`/producto/${product.product_id}`}
      className="bg-white rounded-[16px] border border-[#E5E7EB] overflow-hidden flex flex-col h-full group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative">
        <div className={`bg-[#FFF4EE] p-4 ${!hasStock ? 'opacity-60' : ''}`}>
          <div className="aspect-square flex items-center justify-center overflow-hidden rounded-[16px] bg-white">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.product_name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#FFF4EE] flex flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                <Pill className="w-10 h-10" />
                <span className="text-xs">Sin imagen</span>
              </div>
            )}
          </div>
        </div>

        {product.is_offer && (
          <div className="absolute top-3 left-3 bg-[#F26430] text-white px-2 py-1 rounded-[6px] text-xs font-bold shadow-sm">
            Oferta
          </div>
        )}
        {lowStock && hasStock && (
          <div className="absolute top-3 right-3 bg-[#F59E0B] text-white px-2 py-1 rounded-[6px] text-[11px] font-semibold shadow-sm">
            Pocas unidades
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="text-sm font-normal leading-snug text-[#1A1F2E] line-clamp-2 group-hover:text-[#F26430] transition-colors min-h-[2.5rem]">
          {product.product_name}
        </h3>

        {(product.laboratory_name || product.active_ingredient) && (
          <p className="text-xs text-[#9CA3AF] line-clamp-1">
            {product.laboratory_name || product.active_ingredient}
          </p>
        )}

        {typeof product.current_stock === 'number' && (
          product.current_stock === 0 ? (
            <p className="text-xs font-semibold text-[#DC2626]">Agotado</p>
          ) : product.current_stock <= 5 ? (
            <p className="text-xs font-medium text-[#F59E0B]">
              Pocas unidades ({product.current_stock})
            </p>
          ) : (
            <p className="text-xs text-[#4A5260]">
              Stock disponible: {product.current_stock}
            </p>
          )
        )}

        <div className="mt-auto space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[#F26430] font-semibold text-xl leading-none">
              S/ {Number(product.product_price).toFixed(2)}
            </span>
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
            {hasStock ? 'Agregar' : 'Agotado'}
          </Button>
        </div>
      </div>
    </Link>
  );
}
