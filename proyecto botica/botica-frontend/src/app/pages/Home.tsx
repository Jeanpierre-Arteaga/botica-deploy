import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Clock,
  Truck,
  Shield,
  ArrowRight,
  CheckCircle2,
  Package2,
  Pill,
  Baby,
  Heart,
  Activity,
  AlertCircle,
  Stethoscope,
  Droplets,
  Sparkles,
  Boxes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { HeroBanner } from "../components/HeroBanner";
import { api } from "../lib/api";
import { useLocations } from "../lib/LocationContext";
import type { Category, Product } from "../lib/types";

// Paleta de gradientes y iconos para mostrar las categorías que vienen del backend.
// Si en el futuro el backend agrega más categorías que estos colores, hace ciclo.
const CATEGORY_DECORATIONS: Array<{ icon: LucideIcon; gradient: string }> = [
  { icon: Pill, gradient: "from-blue-500 to-blue-600" },
  { icon: Activity, gradient: "from-emerald-500 to-emerald-600" },
  { icon: Baby, gradient: "from-pink-500 to-pink-600" },
  { icon: Heart, gradient: "from-purple-500 to-purple-600" },
  { icon: Stethoscope, gradient: "from-amber-500 to-amber-600" },
  { icon: Droplets, gradient: "from-cyan-500 to-cyan-600" },
  { icon: Sparkles, gradient: "from-rose-500 to-rose-600" },
  { icon: Boxes, gradient: "from-indigo-500 to-indigo-600" },
];

export function Home() {
  const { selectedLocation, isLoading: isLoadingLocation } = useLocations();

  const [ofertas, setOfertas] = useState<Product[]>([]);
  const [destacados, setDestacados] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Cargar categorías destacadas (selección editorial desde BD)
  useEffect(() => {
    api.categories
      .getAll({ featured: true })
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  // Cargar productos cuando hay sede seleccionada o cambia
  useEffect(() => {
    if (isLoadingLocation) return;
    if (!selectedLocation) {
      setIsLoadingProducts(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoadingProducts(true);
      setProductsError(null);
      try {
        const [ofertasData, destacadosData] = await Promise.all([
          api.products.getAll({
            is_offer: true,
            location_id: selectedLocation.location_id,
          }),
          api.products.getAll({
            location_id: selectedLocation.location_id,
          }),
        ]);
        if (cancelled) return;

        // Defensivo: si el backend aún no filtra por is_offer, lo aplicamos en cliente.
        const ofertasFiltered = ofertasData.filter((p) => p.is_offer);
        setOfertas(ofertasFiltered);
        // Destacados: los que no estén ya en ofertas, primeros 8
        const ofertasIds = new Set(ofertasFiltered.map((p) => p.product_id));
        setDestacados(
          destacadosData.filter((p) => !ofertasIds.has(p.product_id)).slice(0, 8),
        );
      } catch (err) {
        if (cancelled) return;
        console.error("Error cargando productos:", err);
        setProductsError(
          "No se pudieron cargar los productos. Intenta de nuevo.",
        );
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedLocation, isLoadingLocation, reloadKey]);

  const showOfertasSection =
    isLoadingProducts || (!productsError && ofertas.length > 0);

  const categoriasParaMostrar = useMemo(
    () => categorias.slice(0, 8),
    [categorias],
  );

  return (
    <div className="bg-gray-50">
      <HeroBanner />

      {/* Beneficios */}
      <section className="bg-white py-12 md:py-16 border-b border-[#EEEEEE]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-[#FFF7F2] transition-all duration-200">
              <div className="bg-[#16A34A] p-4 rounded-lg shadow-sm mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-2 text-[#1A1F2E] font-semibold">
                Entregas rápidas
              </h3>
              <p className="text-[#4A5260] text-sm">
                Recibe tus pedidos en 24-48 horas
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-[#FFF7F2] transition-all duration-200">
              <div className="bg-[#1E4D8C] p-4 rounded-lg shadow-sm mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-2 text-[#1A1F2E] font-semibold">
                Compra segura
              </h3>
              <p className="text-[#4A5260] text-sm">
                Productos certificados por DIGEMID
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-[#FFF7F2] transition-all duration-200">
              <div className="bg-[#F26430] p-4 rounded-lg shadow-sm mb-4">
                <Package2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-2 text-[#1A1F2E] font-semibold">
                Stock disponible
              </h3>
              <p className="text-[#4A5260] text-sm">
                Miles de productos disponibles
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      {categoriasParaMostrar.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[#1A1F2E]">
              Explora por categoría
            </h2>
            <p className="text-base md:text-lg text-[#4A5260]">
              Encuentra lo que necesitas rápidamente
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categoriasParaMostrar.map((category, idx) => {
              const deco =
                CATEGORY_DECORATIONS[idx % CATEGORY_DECORATIONS.length];
              const Icon = deco.icon;
              return (
                <Link
                  key={category.category_id}
                  to={`/catalogo?category_id=${category.category_id}`}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${deco.gradient} aspect-[4/3] flex flex-col items-center justify-center text-white shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-100 p-4 text-center`}
                >
                  <Icon className="w-9 h-9 md:w-11 md:h-11 mb-3 drop-shadow-md group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-sm md:text-base drop-shadow-md leading-tight">
                    {category.category_name}
                  </h3>
                  {category.category_description && (
                    <p className="text-[11px] md:text-xs mt-1 opacity-90 line-clamp-2">
                      {category.category_description}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Error */}
      {productsError && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white border border-[#FECACA] rounded-2xl p-8 text-center">
            <AlertCircle className="w-10 h-10 text-[#DC2626] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#1A1F2E] mb-2">
              No pudimos cargar los productos
            </h3>
            <p className="text-sm text-[#4A5260] mb-5">{productsError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F26430] text-white rounded-lg font-semibold text-sm hover:bg-[#D94E1F] transition-colors"
            >
              Reintentar
            </button>
          </div>
        </section>
      )}

      {/* Ofertas */}
      {showOfertasSection && (
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-3">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[#1A1F2E]">
                Ofertas
              </h2>
              <p className="text-[#4A5260] text-base">
                Aprovecha precios especiales por tiempo limitado
                {selectedLocation && (
                  <span className="text-[#9CA3AF]">
                    {" "}
                    · Sede{" "}
                    {selectedLocation.district ||
                      selectedLocation.location_name}
                  </span>
                )}
              </p>
            </div>
            <Link
              to="/catalogo?is_offer=true"
              className="inline-flex items-center gap-2 text-[#F26430] font-semibold hover:text-[#D94E1F] transition-colors text-sm"
            >
              Ver todas las ofertas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {isLoadingProducts
              ? Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={`oferta-skel-${i}`} />
                ))
              : ofertas.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
          </div>
        </section>
      )}

      {/* Productos Destacados */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-3">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[#1A1F2E]">
              Productos destacados
            </h2>
            <p className="text-[#4A5260] text-base">
              Los más vendidos de la semana
            </p>
          </div>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-[#F26430] font-semibold hover:text-[#D94E1F] transition-colors text-sm"
          >
            Ver todos los productos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={`dest-skel-${i}`} />
            ))}
          </div>
        ) : !productsError && destacados.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center">
            <Pill className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#1A1F2E] mb-2">
              Aún no hay productos disponibles
            </h3>
            <p className="text-sm text-[#4A5260]">
              {selectedLocation
                ? `No encontramos productos en la sede ${selectedLocation.district || selectedLocation.location_name}.`
                : "Selecciona una sede para ver los productos disponibles."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {destacados.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Por qué Genéricos */}
      <section className="bg-gradient-to-br from-[#E6EBF0] to-[#F0F4F8] py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#1A1F2E]">
              ¿Por qué elegir genéricos?
            </h2>
            <p className="text-base md:text-lg text-[#4A5260] max-w-3xl mx-auto">
              Los medicamentos genéricos tienen el mismo principio activo que
              los de marca, están certificados por DIGEMID y te permiten ahorrar
              hasta 50%.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-5">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-all duration-200">
              <div className="text-xs text-[#9CA3AF] font-semibold mb-2 uppercase tracking-wide">
                Medicamento de marca
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#1A1F2E]">
                Paracetamol Marca X
              </h3>
              <p className="text-[#4A5260] mb-6 text-sm">
                Paracetamol 500mg x 20 tabletas
              </p>
              <div className="text-4xl font-bold text-[#1A1F2E]">S/ 25.00</div>
            </div>
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-8 pt-9 shadow-md border-2 border-emerald-500 relative hover:shadow-lg transition-all duration-200">
              <div className="absolute -top-3.5 left-6 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[11px] font-bold shadow-md tracking-wider">
                RECOMENDADO
              </div>
              <div className="text-xs text-emerald-700 font-semibold mb-2 uppercase tracking-wide">
                Medicamento genérico
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#1A1F2E]">
                Paracetamol Genérico
              </h3>
              <p className="text-[#4A5260] mb-6 text-sm">
                Paracetamol 500mg x 20 tabletas
              </p>
              <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                <div className="text-4xl font-bold text-emerald-600">
                  S/ 12.50
                </div>
                <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                  50% OFF
                </div>
              </div>
              <div className="flex items-start gap-2 text-emerald-700 text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-medium">
                  Mismo principio activo, certificado DIGEMID
                </span>
              </div>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold text-base hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Explorar genéricos
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Nuestras Tiendas */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[#1A1F2E]">
            Visita nuestras tiendas
          </h2>
          <p className="text-base md:text-lg text-[#4A5260]">
            Atención personalizada y stock disponible
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-all duration-200 border border-[#EEEEEE]">
            <div className="flex items-start gap-5">
              <div className="bg-[#FFF0E8] p-4 rounded-lg flex-shrink-0">
                <MapPin className="w-7 h-7 text-[#F26430]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-[#1A1F2E] font-semibold">
                  Boticas Central - Ate
                </h3>
                <p className="text-[#4A5260] mb-3 text-sm">
                  Av. Separadora Industrial 123, Ate - Lima
                </p>
                <div className="flex items-center gap-2 text-[#4A5260] mb-4">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Lun - Dom: 8:00 AM - 10:00 PM
                  </span>
                </div>
                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-2 text-[#F26430] font-semibold hover:text-[#D94E1F] transition-colors text-sm"
                >
                  Ver disponibilidad
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-all duration-200 border border-[#EEEEEE]">
            <div className="flex items-start gap-5">
              <div className="bg-[#FFF0E8] p-4 rounded-lg flex-shrink-0">
                <MapPin className="w-7 h-7 text-[#F26430]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-[#1A1F2E] font-semibold">
                  Boticas Central - Santa Anita
                </h3>
                <p className="text-[#4A5260] mb-3 text-sm">
                  Av. Los Frutales 456, Santa Anita - Lima
                </p>
                <div className="flex items-center gap-2 text-[#4A5260] mb-4">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Lun - Dom: 8:00 AM - 10:00 PM
                  </span>
                </div>
                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-2 text-[#F26430] font-semibold hover:text-[#D94E1F] transition-colors text-sm"
                >
                  Ver disponibilidad
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
