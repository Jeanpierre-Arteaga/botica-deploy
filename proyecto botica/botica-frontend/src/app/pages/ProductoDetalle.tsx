import { Link, useNavigate, useParams } from "react-router";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Pill,
  AlertCircle,
  PackageX,
  CheckCircle2,
  Calendar,
  FileText,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ProductCard } from "../components/ProductCard";
import { ProductDetailSkeleton } from "../components/Skeleton";
import { Button } from "../components/ui/Button";
import { api, ApiError } from "../lib/api";
import { useCart } from "../lib/CartContext";
import { useLocations } from "../lib/LocationContext";
import type { Product } from "../lib/types";

type TabKey =
  | "descripcion"
  | "composicion"
  | "contraindicaciones"
  | "efectos"
  | "info";

function formatDateSafe(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: es });
  } catch {
    return null;
  }
}

export function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { selectedLocation } = useLocations();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>("descripcion");

  const productId = id ? Number(id) : NaN;

  // Cargar producto
  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setQuantity(1);

    api.products
      .getById(productId, selectedLocation?.location_id)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          console.error("Error cargando producto:", err);
          setError("No se pudo cargar el producto.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, selectedLocation]);

  // Cargar relacionados cuando ya tenemos el producto
  useEffect(() => {
    if (!product || product.category_id == null) {
      setRelated([]);
      return;
    }
    let cancelled = false;
    api.products
      .getAll({
        category_id: product.category_id,
        location_id: selectedLocation?.location_id,
      })
      .then((all) => {
        if (cancelled) return;
        const filtered = all
          .filter(
            (p) =>
              p.product_id !== product.product_id &&
              p.category_id === product.category_id,
          )
          .slice(0, 4);
        setRelated(filtered);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product, selectedLocation]);

  const stockDisponible = product?.current_stock;
  const stockNumber =
    typeof stockDisponible === "number" ? stockDisponible : null;
  const hasStock = stockNumber === null || stockNumber > 0;
  const maxQuantity = stockNumber ?? 99;

  const expDateFormatted = useMemo(
    () => formatDateSafe(product?.expiration_date ?? null),
    [product?.expiration_date],
  );

  const handleAddToCart = () => {
    if (!product || !hasStock) return;
    addItem(product, quantity);
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (isLoading) {
    return (
      <div className="bg-[#F9FAFB] min-h-screen">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <PackageX className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1F2E] mb-2">
            Producto no encontrado
          </h1>
          <p className="text-[#4A5260] mb-6">
            El producto que buscas no existe o fue retirado del catálogo.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/catalogo")}
          >
            Volver al catálogo
          </Button>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-[#DC2626] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1F2E] mb-2">
            No pudimos cargar el producto
          </h1>
          <p className="text-[#4A5260] mb-6">
            {error || "Ocurrió un problema inesperado."}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#4A5260] mb-5 flex-wrap">
          <Link to="/" className="hover:text-[#F15A29]">
            Inicio
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/catalogo" className="hover:text-[#F15A29]">
            Catálogo
          </Link>
          {product.category_name && product.category_id != null && (
            <>
              <ChevronRight className="w-4 h-4" />
              <Link
                to={`/catalogo?category_id=${product.category_id}`}
                className="hover:text-[#F15A29]"
              >
                {product.category_name}
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#1A1F2E] font-medium truncate max-w-[60vw] md:max-w-none">
            {product.product_name}
          </span>
        </div>

        {/* Main */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10">
          {/* Imagen */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 md:p-8">
            <div className="aspect-square bg-[#FFF4EE] rounded-xl overflow-hidden flex items-center justify-center relative">
              {product.is_offer && (
                <div className="absolute top-4 left-4 bg-[#F15A29] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm z-10">
                  Oferta
                </div>
              )}
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#9CA3AF]">
                  <Pill className="w-20 h-20" />
                  <span className="text-sm mt-2">Sin imagen</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 md:p-8 flex flex-col">
            {/* Laboratorio y categoría */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {product.laboratory_name && (
                <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[#EFF4FB] text-[#1E4D8C]">
                  {product.laboratory_name}
                </span>
              )}
              {product.category_name && (
                <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[#F9FAFB] text-[#4A5260] border border-[#E5E7EB]">
                  {product.category_name}
                </span>
              )}
              {product.is_generic && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Genérico
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1F2E] mb-2 leading-tight">
              {product.product_name}
            </h1>

            {product.active_ingredient && (
              <p className="text-sm text-[#4A5260] mb-5">
                <span className="text-[#9CA3AF]">Principio activo:</span>{" "}
                <span className="font-medium text-[#1A1F2E]">
                  {product.active_ingredient}
                </span>
              </p>
            )}

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-4xl md:text-5xl font-bold text-[#F15A29]">
                S/ {Number(product.product_price).toFixed(2)}
              </span>
            </div>

            {/* Estado de stock */}
            <div className="mb-6 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    hasStock ? "bg-[#16A34A]" : "bg-[#DC2626]"
                  }`}
                />
                <span className="text-sm font-semibold text-[#1A1F2E]">
                  {selectedLocation
                    ? `Sede ${selectedLocation.district || selectedLocation.location_name}`
                    : "Disponibilidad"}
                </span>
              </div>
              <p className="text-sm text-[#4A5260] pl-5">
                {stockNumber === null
                  ? "Selecciona una sede para ver el stock disponible."
                  : stockNumber === 0
                    ? "Agotado en esta sede."
                    : stockNumber <= 5
                      ? `Pocas unidades disponibles (${stockNumber})`
                      : `${stockNumber} unidades disponibles`}
              </p>
            </div>

            {/* Cantidad */}
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2 text-[#1A1F2E]">
                Cantidad
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!hasStock || quantity <= 1}
                  className="w-11 h-11 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (Number.isNaN(v)) {
                      setQuantity(1);
                    } else {
                      setQuantity(Math.max(1, Math.min(maxQuantity, v)));
                    }
                  }}
                  disabled={!hasStock}
                  className="w-20 h-11 text-center border border-[#E5E7EB] rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#F15A29]/30 focus:border-[#F15A29] disabled:bg-[#F9FAFB]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(maxQuantity, q + 1))
                  }
                  disabled={!hasStock || quantity >= maxQuantity}
                  className="w-11 h-11 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-auto pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                iconLeft={ShoppingCart}
                disabled={!hasStock}
                onClick={handleAddToCart}
              >
                {hasStock ? "Agregar al carrito" : "Agotado"}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 md:p-8 mb-10">
          <div className="border-b border-[#E5E7EB] mb-5 overflow-x-auto">
            <div className="flex gap-6 md:gap-8 min-w-max">
              <TabButton
                active={activeTab === "descripcion"}
                onClick={() => setActiveTab("descripcion")}
              >
                Descripción
              </TabButton>
              <TabButton
                active={activeTab === "composicion"}
                onClick={() => setActiveTab("composicion")}
              >
                Composición
              </TabButton>
              <TabButton
                active={activeTab === "contraindicaciones"}
                onClick={() => setActiveTab("contraindicaciones")}
              >
                Contraindicaciones
              </TabButton>
              <TabButton
                active={activeTab === "efectos"}
                onClick={() => setActiveTab("efectos")}
              >
                Efectos adversos
              </TabButton>
              <TabButton
                active={activeTab === "info"}
                onClick={() => setActiveTab("info")}
              >
                Información adicional
              </TabButton>
            </div>
          </div>

          <div className="text-sm md:text-base text-[#4A5260] leading-relaxed">
            {activeTab === "descripcion" && (
              <TabContent
                text={product.product_composition}
                fallback="Aún no hay descripción disponible para este producto."
              />
            )}
            {activeTab === "composicion" && (
              <TabContent
                text={product.active_ingredient}
                fallback="No se ha registrado información de composición."
              />
            )}
            {activeTab === "contraindicaciones" && (
              <TabContent
                text={product.contraindications}
                fallback="No se han registrado contraindicaciones para este producto."
              />
            )}
            {activeTab === "efectos" && (
              <TabContent
                text={product.adverse_effects}
                fallback="No se han registrado efectos adversos."
              />
            )}
            {activeTab === "info" && (
              <dl className="grid sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={FileText}
                  label="Registro sanitario"
                  value={product.health_record}
                />
                <InfoRow
                  icon={Pill}
                  label="Lote"
                  value={product.product_batch}
                />
                <InfoRow
                  icon={Calendar}
                  label="Vencimiento"
                  value={expDateFormatted}
                />
                <InfoRow
                  icon={FileText}
                  label="Tipo"
                  value={product.is_generic ? "Genérico" : "De marca"}
                />
              </dl>
            )}
          </div>
        </div>

        {/* Relacionados */}
        {related.length > 0 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1A1F2E] mb-5">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {related.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Subcomponentes
// ============================================================
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-3 text-sm md:text-base font-semibold transition-colors whitespace-nowrap ${
        active
          ? "text-[#F15A29] border-b-2 border-[#F15A29]"
          : "text-[#4A5260] hover:text-[#1A1F2E]"
      }`}
    >
      {children}
    </button>
  );
}

function TabContent({
  text,
  fallback,
}: {
  text: string | null | undefined;
  fallback: string;
}) {
  if (!text || text.trim() === "") {
    return <p className="text-[#9CA3AF] italic">{fallback}</p>;
  }
  return <p className="whitespace-pre-line">{text}</p>;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Pill;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-[#9CA3AF] mt-1 flex-shrink-0" />
      <div>
        <dt className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium mb-0.5">
          {label}
        </dt>
        <dd className="text-sm text-[#1A1F2E] font-medium">
          {value || (
            <span className="text-[#9CA3AF] italic font-normal">
              No registrado
            </span>
          )}
        </dd>
      </div>
    </div>
  );
}

