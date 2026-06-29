import { useSearchParams } from "react-router";
import {
  SlidersHorizontal,
  X,
  AlertCircle,
  Search,
  PackageX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { Container } from "../components/Container";
import { PageHeader } from "../components/PageHeader";
import { FilterSelect } from "../components/FilterSelect";
import { PriceRangeSlider } from "../components/PriceRangeSlider";
import { api } from "../lib/api";
import { useLocations } from "../lib/LocationContext";
import type {
  Category,
  Laboratory,
  Product,
  ProductFilters,
} from "../lib/types";

type SortKey = "relevance" | "price-asc" | "price-desc" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevancia" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "name", label: "Nombre A-Z" },
];

const formatPrice = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function readFilters(searchParams: URLSearchParams): ProductFilters {
  const nombre = searchParams.get("nombre")?.trim() || undefined;
  const categoryRaw = searchParams.get("category_id");
  const laboratoryRaw = searchParams.get("laboratory_id");
  const offerRaw = searchParams.get("is_offer");

  return {
    nombre,
    category_id:
      categoryRaw && !Number.isNaN(Number(categoryRaw))
        ? Number(categoryRaw)
        : undefined,
    laboratory_id:
      laboratoryRaw && !Number.isNaN(Number(laboratoryRaw))
        ? Number(laboratoryRaw)
        : undefined,
    is_offer: offerRaw === "true" ? true : undefined,
  };
}

export function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedLocation, isLoading: isLoadingLocation } = useLocations();

  // Filtros derivados de la URL
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  // Catálogos auxiliares para mostrar los filtros
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratory[]>([]);

  // Productos y estados
  const [productos, setProductos] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // UI
  const [sortBy, setSortBy] = useState<SortKey>("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Rango de precio (client-side). El TOPE es DINÁMICO: el precio del producto
  // más caro del conjunto actualmente filtrado por el backend (categoría, lab,
  // oferta, búsqueda, sede). Cuando cambia ese conjunto, el rango se resetea al
  // máximo nuevo (lo hace el handler del fetch, en el mismo batch que
  // setProductos, para no filtrar con un rango viejo durante un frame).
  const maxPrice = useMemo(
    () =>
      Math.ceil(
        productos.reduce((m, p) => Math.max(m, Number(p.product_price) || 0), 0),
      ),
    [productos],
  );
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  // Cargar categorías y laboratorios una sola vez
  useEffect(() => {
    Promise.all([api.categories.getAll(), api.laboratories.getAll()])
      .then(([c, l]) => {
        setCategorias(c);
        setLaboratorios(l);
      })
      .catch(() => {
        // Si falla, el sidebar simplemente sale sin opciones — la lista de productos sigue funcionando.
      });
  }, []);

  // Cargar productos cuando cambian filtros o sede
  useEffect(() => {
    if (isLoadingLocation) return;
    let cancelled = false;
    setIsLoadingProducts(true);
    setProductsError(null);

    api.products
      .getAll({
        ...filters,
        location_id: selectedLocation?.location_id,
      })
      .then((data) => {
        if (cancelled) return;
        setProductos(data);
        // Resetea el rango de precio al tope de la nueva sección, en el mismo
        // batch que setProductos (sin frame intermedio con rango desajustado).
        const mp = Math.ceil(
          data.reduce((m, p) => Math.max(m, Number(p.product_price) || 0), 0),
        );
        setPriceRange(mp > 0 ? [0, mp] : null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error cargando productos:", err);
        setProductsError("No se pudieron cargar los productos.");
        setProductos([]);
        setPriceRange(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    selectedLocation,
    isLoadingLocation,
    filters.nombre,
    filters.category_id,
    filters.laboratory_id,
    filters.is_offer,
    reloadKey,
  ]);

  // Filtros extra client-side: stock disponible + rango de precio
  const productosVisibles = useMemo(() => {
    let arr = onlyInStock
      ? productos.filter(
          (p) => p.current_stock === undefined || p.current_stock > 0,
        )
      : productos;

    if (priceRange) {
      const [lo, hi] = priceRange;
      arr = arr.filter((p) => {
        const price = Number(p.product_price) || 0;
        return price >= lo && price <= hi;
      });
    }

    const sorted = [...arr];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => Number(a.product_price) - Number(b.product_price));
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => Number(b.product_price) - Number(a.product_price));
    } else if (sortBy === "name") {
      sorted.sort((a, b) =>
        a.product_name.localeCompare(b.product_name, "es", {
          sensitivity: "base",
        }),
      );
    }
    return sorted;
  }, [productos, onlyInStock, sortBy, priceRange]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  // Resetea el rango al máximo de la sección actual (slider "abierto del todo").
  const resetPrice = () => setPriceRange(maxPrice > 0 ? [0, maxPrice] : null);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setOnlyInStock(false);
    resetPrice();
  };

  // El rango de precio cuenta como filtro activo solo cuando se ha estrechado
  // respecto a los límites completos [0, maxPrice].
  const priceFilterActive =
    priceRange != null &&
    maxPrice > 0 &&
    (priceRange[0] > 0 || priceRange[1] < maxPrice);

  const hasActiveFilters =
    !!filters.nombre ||
    filters.category_id !== undefined ||
    filters.laboratory_id !== undefined ||
    !!filters.is_offer ||
    onlyInStock ||
    priceFilterActive;

  const activeCategory = categorias.find(
    (c) => c.category_id === filters.category_id,
  );
  const activeLab = laboratorios.find(
    (l) => l.laboratory_id === filters.laboratory_id,
  );

  // ============================================================
  // FILTERS PANEL — usado en desktop y mobile (drawer)
  // ============================================================
  // Se define como FUNCIÓN que devuelve JSX (no como componente inline) para que
  // sus nodos se reconcilien en su sitio entre renders. Un componente definido
  // dentro del cuerpo tendría una identidad nueva cada render y remontaría su
  // subárbol, lo que rompería el arrastre del slider de precio.
  const renderFiltersPanel = (onApply?: () => void) => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-5 h-5 text-brand" />
        <h3 className="font-bold text-lg text-text">Filtrar productos</h3>
      </div>

      {/* Categoría */}
      <div>
        <label className="block font-semibold mb-3 text-sm text-text">
          Categoría
        </label>
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm py-1">
            <input
              type="radio"
              name="cat"
              checked={filters.category_id === undefined}
              onChange={() => updateParam("category_id", null)}
              className="accent-brand"
            />
            <span className="text-muted">Todas las categorías</span>
          </label>
          {categorias.map((c) => (
            <label
              key={c.category_id}
              className="flex items-center gap-2 cursor-pointer text-sm py-1"
            >
              <input
                type="radio"
                name="cat"
                checked={filters.category_id === c.category_id}
                onChange={() =>
                  updateParam("category_id", String(c.category_id))
                }
                className="accent-brand"
              />
              <span className="text-text">{c.category_name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Laboratorio — mismo patrón que Categoría: radios con scroll. La lista
          viene del backend (tabla laboratory, orden alfabético) vía
          api.laboratories.getAll(), así que los laboratorios nuevos aparecen
          aquí automáticamente. Escala con una barra desplazadora. */}
      <div>
        <label className="block font-semibold mb-3 text-sm text-text">
          Laboratorio
        </label>
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm py-1">
            <input
              type="radio"
              name="lab"
              checked={filters.laboratory_id === undefined}
              onChange={() => updateParam("laboratory_id", null)}
              className="accent-brand"
            />
            <span className="text-muted">Todos los laboratorios</span>
          </label>
          {laboratorios.map((l) => (
            <label
              key={l.laboratory_id}
              className="flex items-center gap-2 cursor-pointer text-sm py-1"
            >
              <input
                type="radio"
                name="lab"
                checked={filters.laboratory_id === l.laboratory_id}
                onChange={() =>
                  updateParam("laboratory_id", String(l.laboratory_id))
                }
                className="accent-brand"
              />
              <span className="text-text">{l.laboratory_name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Precio — rango con TOPE DINÁMICO: el máximo es el precio del producto
          más caro del conjunto filtrado actual (se recalcula al cambiar de
          categoría/laboratorio/sede). */}
      {maxPrice > 0 && priceRange && (
        <div>
          <label className="block font-semibold mb-3 text-sm text-text">
            Precio
          </label>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-semibold text-brand">
              {formatPrice(priceRange[0])}
            </span>
            <span className="font-semibold text-brand">
              {formatPrice(priceRange[1])}
            </span>
          </div>
          <PriceRangeSlider
            min={0}
            max={maxPrice}
            value={priceRange}
            onChange={setPriceRange}
          />
          <div className="flex items-center justify-between mt-1 text-xs text-faint">
            <span>{formatPrice(0)}</span>
            <span>{formatPrice(maxPrice)}</span>
          </div>
        </div>
      )}

      {/* Disponibilidad — agrupa los dos toggles bajo un título de sección
          coherente con "Categoría" / "Laboratorio". */}
      <div>
        <span className="block font-semibold mb-3 text-sm text-text">
          Disponibilidad
        </span>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters.is_offer}
              onChange={(e) =>
                updateParam("is_offer", e.target.checked ? "true" : null)
              }
              className="accent-brand w-4 h-4"
            />
            <span className="text-sm font-medium text-text">
              Solo productos en oferta
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="accent-brand w-4 h-4"
            />
            <span className="text-sm font-medium text-text">
              Solo con stock disponible
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-line">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              clearFilters();
              onApply?.();
            }}
            className="w-full text-muted text-sm font-medium underline hover:text-brand transition-colors"
          >
            Limpiar filtros
          </button>
        )}
        {onApply && (
          <button
            type="button"
            onClick={onApply}
            className="w-full bg-brand text-white py-2.5 rounded-lg font-semibold hover:bg-brand-hover transition-colors"
          >
            Aplicar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-page min-h-screen">
      <Container className="py-6 md:py-8">
        <PageHeader
          breadcrumbs={[
            { label: "Inicio", to: "/" },
            { label: "Catálogo", to: "/catalogo" },
            ...(activeCategory
              ? [{ label: activeCategory.category_name }]
              : []),
          ]}
          title={
            <>
              Catálogo
              {selectedLocation && (
                <span className="text-base font-normal text-faint ml-2">
                  · Sede{" "}
                  {selectedLocation.district || selectedLocation.location_name}
                </span>
              )}
            </>
          }
          subtitle={
            filters.nombre ? (
              <>
                Resultados para “
                <span className="font-medium text-text">{filters.nombre}</span>”
                <button
                  type="button"
                  onClick={() => updateParam("nombre", null)}
                  className="ml-2 text-brand hover:underline"
                >
                  quitar
                </button>
              </>
            ) : undefined
          }
        />

        {/* Active chips (mobile-friendly) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 bg-surface border border-line text-text text-xs font-medium px-3 py-1.5 rounded-full">
                {activeCategory.category_name}
                <button
                  type="button"
                  onClick={() => updateParam("category_id", null)}
                  aria-label="Quitar filtro categoría"
                  className="text-faint hover:text-error"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeLab && (
              <span className="inline-flex items-center gap-1.5 bg-surface border border-line text-text text-xs font-medium px-3 py-1.5 rounded-full">
                {activeLab.laboratory_name}
                <button
                  type="button"
                  onClick={() => updateParam("laboratory_id", null)}
                  aria-label="Quitar filtro laboratorio"
                  className="text-faint hover:text-error"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.is_offer && (
              <span className="inline-flex items-center gap-1.5 bg-brand-soft border border-brand text-brand text-xs font-semibold px-3 py-1.5 rounded-full">
                En oferta
                <button
                  type="button"
                  onClick={() => updateParam("is_offer", null)}
                  aria-label="Quitar filtro oferta"
                  className="hover:text-brand-hover"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {onlyInStock && (
              <span className="inline-flex items-center gap-1.5 bg-surface border border-line text-text text-xs font-medium px-3 py-1.5 rounded-full">
                Con stock
                <button
                  type="button"
                  onClick={() => setOnlyInStock(false)}
                  aria-label="Quitar filtro stock"
                  className="text-faint hover:text-error"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceFilterActive && priceRange && (
              <span className="inline-flex items-center gap-1.5 bg-surface border border-line text-text text-xs font-medium px-3 py-1.5 rounded-full">
                {formatPrice(priceRange[0])} – {formatPrice(priceRange[1])}
                <button
                  type="button"
                  onClick={resetPrice}
                  aria-label="Quitar filtro de precio"
                  className="text-faint hover:text-error"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted hover:text-brand underline"
            >
              Limpiar todos
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-surface rounded-2xl shadow-sm border border-line p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              {renderFiltersPanel()}
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Top bar */}
            <div className="bg-surface rounded-2xl shadow-sm border border-line p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-3 py-2 border border-line rounded-lg text-sm font-medium text-text hover:bg-page"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                </button>
                <span className="text-sm text-muted">
                  {isLoadingProducts
                    ? "Cargando..."
                    : `${productosVisibles.length} ${productosVisibles.length === 1 ? "producto encontrado" : "productos encontrados"}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">Ordenar</span>
                <FilterSelect
                  ariaLabel="Ordenar productos"
                  value={sortBy}
                  onChange={setSortBy}
                  options={SORT_OPTIONS}
                  align="right"
                />
              </div>
            </div>

            {/* Grid */}
            {productsError ? (
              <div className="bg-surface border border-error/30 rounded-2xl p-10 text-center">
                <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-text mb-2">
                  No pudimos cargar el catálogo
                </h3>
                <p className="text-sm text-muted mb-4">{productsError}</p>
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg font-semibold text-sm hover:bg-brand-hover transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : isLoadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={`cat-skel-${i}`} />
                ))}
              </div>
            ) : productosVisibles.length === 0 ? (
              <div className="bg-surface border border-line rounded-2xl p-12 text-center">
                {filters.nombre ? (
                  <Search className="w-12 h-12 text-faint mx-auto mb-3" />
                ) : (
                  <PackageX className="w-12 h-12 text-faint mx-auto mb-3" />
                )}
                <h3 className="text-lg font-semibold text-text mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-sm text-muted mb-5">
                  {hasActiveFilters
                    ? "Prueba ajustando los filtros o cambiando de sede."
                    : "Aún no hay productos disponibles en esta sede."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg font-semibold text-sm hover:bg-brand-hover transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {productosVisibles.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Drawer Mobile */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden
          />
          <div className="w-[85%] max-w-sm bg-surface h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-text">Filtros</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Cerrar filtros"
                className="p-2 text-muted hover:bg-page rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderFiltersPanel(() => setMobileFiltersOpen(false))}
          </div>
        </div>
      )}
    </div>
  );
}
