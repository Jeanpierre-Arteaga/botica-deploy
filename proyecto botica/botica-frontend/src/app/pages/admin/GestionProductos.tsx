import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Pill,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Tag,
  X,
  Upload,
  Link2,
  Loader2,
  ChevronDown,
  ImageOff,
  PackageX,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type {
  Product,
  Category,
  Laboratory,
  InventoryItem,
} from "../../lib/types";

// Sedes sembradas en la BD (ver CLAUDE.md).
const LOCATION_ATE = 1;
const LOCATION_SA = 2;

// ============================================================
// Helpers de stock
// ============================================================

type SedeStock = { current: number; min: number };
type StockMap = Map<number, Record<number, SedeStock>>;

function sedeOf(map: StockMap, productId: number, locationId: number): SedeStock {
  return map.get(productId)?.[locationId] ?? { current: 0, min: 0 };
}

type StockLevel = "ok" | "low" | "empty";

function stockStatus(total: number, totalMin: number): {
  level: StockLevel;
  label: string;
  cls: string;
} {
  if (total === 0) {
    return { level: "empty", label: "Sin stock", cls: "bg-error-soft text-error" };
  }
  if (totalMin > 0 && total < totalMin) {
    return { level: "low", label: "Stock bajo", cls: "bg-warning-soft text-warning" };
  }
  return { level: "ok", label: "Stock OK", cls: "bg-success-soft text-success" };
}

// ============================================================
// Página principal
// ============================================================

export function GestionProductos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [stockMap, setStockMap] = useState<StockMap>(new Map());

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Carga inicial de todo lo necesario.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    Promise.all([
      api.products.getAll({ include_inactive: true }),
      api.categories.getAll(),
      api.laboratories.getAll(),
      api.inventory.getAll(),
    ])
      .then(([prods, cats, labs, inv]) => {
        if (cancelled) return;
        setProducts(prods);
        setCategories(cats);
        setLaboratories(labs);
        setStockMap(buildStockMap(inv));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error cargando productos:", err);
        setLoadError("No se pudieron cargar los productos.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  // Filtrado client-side.
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
      if (categoryFilter && String(p.category_id ?? "") !== categoryFilter) return false;
      if (term) {
        const haystack = [
          p.product_name,
          p.category_name,
          p.active_ingredient,
          p.laboratory_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // Stats desde datos reales.
  const stats = useMemo(() => {
    let activos = 0;
    let bajo = 0;
    let ofertas = 0;
    for (const p of products) {
      if (p.is_active) activos += 1;
      if (p.is_offer) ofertas += 1;
      const ate = sedeOf(stockMap, p.product_id, LOCATION_ATE);
      const sa = sedeOf(stockMap, p.product_id, LOCATION_SA);
      const total = ate.current + sa.current;
      const totalMin = ate.min + sa.min;
      if (p.is_active && stockStatus(total, totalMin).level !== "ok") bajo += 1;
    }
    return { total: products.length, activos, bajo, ofertas };
  }, [products, stockMap]);

  const handleAddNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditing(product);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.products.delete(toDelete.product_id);
      toast.success(`"${toDelete.product_name}" se desactivó correctamente.`);
      setToDelete(null);
      refresh();
    } catch (err) {
      console.error("Error eliminando producto:", err);
      toast.error("No se pudo desactivar el producto.");
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters =
    searchTerm.trim() !== "" || categoryFilter !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("all");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Gestión de Productos</h1>
          <p className="text-sm text-muted">
            Administra el catálogo de medicamentos, su stock por sede y sus imágenes
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center justify-center gap-2 bg-brand text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <ProductStat icon={Package} label="Total productos" value={stats.total} accent="var(--c-brand)" index={0} loading={isLoading} />
        <ProductStat icon={CheckCircle2} label="Productos activos" value={stats.activos} accent="var(--c-success)" index={1} loading={isLoading} />
        <ProductStat icon={TrendingDown} label="Con stock bajo" value={stats.bajo} accent="var(--c-warning)" index={2} loading={isLoading} />
        <ProductStat icon={Tag} label="En oferta" value={stats.ofertas} accent="var(--c-violet)" index={3} loading={isLoading} />
      </div>

      {/* Search and Filters */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line p-4 sm:p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, categoría, principio activo o laboratorio..."
              className="w-full pl-12 pr-4 py-3 bg-page border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-page border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-3 bg-page border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla / estados */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line overflow-hidden">
        {loadError ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text mb-1">No pudimos cargar el catálogo</h3>
            <p className="text-sm text-muted mb-5">{loadError}</p>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        ) : isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            {hasFilters ? (
              <Search className="w-12 h-12 text-faint mx-auto mb-3" />
            ) : (
              <PackageX className="w-12 h-12 text-faint mx-auto mb-3" />
            )}
            <h3 className="text-lg font-semibold text-text mb-1">
              {hasFilters ? "Sin resultados" : "Aún no hay productos"}
            </h3>
            <p className="text-sm text-muted mb-5">
              {hasFilters
                ? "Prueba ajustando la búsqueda o los filtros."
                : "Crea tu primer producto para empezar a poblar el catálogo."}
            </p>
            {hasFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-page border border-line text-text rounded-xl font-semibold text-sm hover:bg-line-2 transition-colors"
              >
                Limpiar filtros
              </button>
            ) : (
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-page border-b border-line">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Producto</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Categoría</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-muted uppercase tracking-wide">Precio</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-semibold text-muted uppercase tracking-wide">Ate</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-semibold text-muted uppercase tracking-wide">S. Anita</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Stock</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Estado</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-muted uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const ate = sedeOf(stockMap, product.product_id, LOCATION_ATE);
                  const sa = sedeOf(stockMap, product.product_id, LOCATION_SA);
                  const total = ate.current + sa.current;
                  const totalMin = ate.min + sa.min;
                  const status = stockStatus(total, totalMin);
                  return (
                    <tr key={product.product_id} className="border-b border-line-2 last:border-0 hover:bg-page transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb url={product.image_url} alt={product.product_name} />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-text truncate max-w-[220px]">{product.product_name}</p>
                            {product.active_ingredient && (
                              <p className="text-xs text-muted truncate max-w-[220px]">{product.active_ingredient}</p>
                            )}
                            {product.is_offer && (
                              <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-semibold text-brand">
                                <Tag className="w-3 h-3" /> En oferta
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted">{product.category_name || "—"}</td>
                      <td className="px-5 py-3 text-sm font-bold text-text text-right tabular-nums">
                        S/ {Number(product.product_price).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StockPill value={ate.current} min={ate.min} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StockPill value={sa.current} min={sa.min} />
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.cls}`}>
                          {status.level !== "ok" && <AlertCircle className="w-3 h-3" />}
                          {total} u.
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          product.is_active ? "bg-success-soft text-success" : "bg-line-2 text-muted"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {product.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(product)}
                            aria-label={`Editar ${product.product_name}`}
                            className="p-2 hover:bg-info-soft rounded-lg transition-colors group"
                          >
                            <Edit2 className="w-4 h-4 text-muted group-hover:text-info" />
                          </button>
                          <button
                            onClick={() => setToDelete(product)}
                            aria-label={`Desactivar ${product.product_name}`}
                            disabled={!product.is_active}
                            className="p-2 hover:bg-error-soft rounded-lg transition-colors group disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="w-4 h-4 text-muted group-hover:text-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalOpen && (
        <ProductModal
          product={editing}
          categories={categories}
          laboratories={laboratories}
          stockMap={stockMap}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            refresh();
          }}
        />
      )}

      {/* Confirmación de eliminación */}
      {toDelete && (
        <ConfirmDialog
          title="Desactivar producto"
          message={`¿Seguro que deseas desactivar "${toDelete.product_name}"? Dejará de aparecer en el catálogo, pero su historial se conserva.`}
          confirmLabel="Desactivar"
          loading={deleting}
          onCancel={() => (deleting ? null : setToDelete(null))}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

// ============================================================
// Construye el mapa de stock por (producto, sede)
// ============================================================

function buildStockMap(items: InventoryItem[]): StockMap {
  const map: StockMap = new Map();
  for (const it of items) {
    const entry = map.get(it.product_id) ?? {};
    entry[it.location_id] = { current: it.current_stock, min: it.min_stock };
    map.set(it.product_id, entry);
  }
  return map;
}

// ============================================================
// Miniatura de producto
// ============================================================

function Thumb({ url, alt }: { url?: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (url && !errored) {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setErrored(true)}
        className="w-11 h-11 rounded-lg object-cover border border-line shrink-0"
      />
    );
  }
  return (
    <div className="w-11 h-11 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
      {errored ? <ImageOff className="w-5 h-5 text-faint" /> : <Pill className="w-5 h-5 text-brand" />}
    </div>
  );
}

function StockPill({ value, min }: { value: number; min: number }) {
  const danger = value === 0 || (min > 0 && value < min);
  return (
    <span className={`inline-block min-w-[2rem] px-2 py-1 rounded-full text-xs font-semibold tabular-nums ${
      danger ? "bg-error-soft text-error" : "bg-line-2 text-muted"
    }`}>
      {value}
    </span>
  );
}

// ============================================================
// Skeleton de tabla
// ============================================================

function TableSkeleton() {
  return (
    <div className="divide-y divide-line-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="w-11 h-11 rounded-lg bg-line-2 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 bg-line-2 rounded animate-pulse" />
            <div className="h-3 w-1/4 bg-line-2 rounded animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-line-2 rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-line-2 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Stat card
// ============================================================

function ProductStat({
  icon: Icon, label, value, accent, index, loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
  index: number;
  loading?: boolean;
}) {
  return (
    <div
      className="animate-panel relative overflow-hidden bg-surface rounded-2xl shadow-soft border border-line p-5 hover:shadow-card hover:-translate-y-0.5 transition-all"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="absolute left-0 top-0 h-full w-1 rounded-r" style={{ backgroundColor: accent }} />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
      >
        <Icon className="w-[22px] h-[22px]" />
      </div>
      <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5">{label}</p>
      {loading ? (
        <div className="h-7 w-12 bg-line-2 rounded animate-pulse" />
      ) : (
        <p className="text-[26px] lg:text-[28px] leading-none font-bold text-text tabular-nums">{value}</p>
      )}
    </div>
  );
}

// ============================================================
// Toggle minimalista
// ============================================================

function Toggle({
  checked, onChange, label, hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 w-full bg-page border border-line rounded-xl px-4 py-3 text-left hover:border-line-2 transition-colors"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-brand" : "bg-line-2"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

// ============================================================
// Modal Crear / Editar
// ============================================================

const FIELD_CLS =
  "w-full px-4 py-2.5 bg-page border border-line rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors";
const LABEL_CLS = "block text-sm font-semibold mb-1.5 text-text";

interface ProductForm {
  product_name: string;
  category_id: string;
  laboratory_id: string;
  product_price: string;
  old_price: string;
  stock_ate: string;
  stock_sa: string;
  min_stock: string;
  is_offer: boolean;
  is_generic: boolean;
  active_ingredient: string;
  product_composition: string;
  contraindications: string;
  adverse_effects: string;
  product_batch: string;
  expiration_date: string;
  health_record: string;
}

function ProductModal({
  product, categories, laboratories, stockMap, onClose, onSaved,
}: {
  product: Product | null;
  categories: Category[];
  laboratories: Laboratory[];
  stockMap: StockMap;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const ate = product ? sedeOf(stockMap, product.product_id, LOCATION_ATE) : { current: 0, min: 0 };
  const sa = product ? sedeOf(stockMap, product.product_id, LOCATION_SA) : { current: 0, min: 0 };

  const [form, setForm] = useState<ProductForm>({
    product_name: product?.product_name ?? "",
    category_id: product?.category_id != null ? String(product.category_id) : "",
    laboratory_id: product?.laboratory_id != null ? String(product.laboratory_id) : "",
    product_price: product != null ? String(product.product_price) : "",
    old_price: product?.old_price != null ? String(product.old_price) : "",
    stock_ate: String(ate.current ?? 0),
    stock_sa: String(sa.current ?? 0),
    min_stock: String(ate.min || sa.min || 0),
    is_offer: product?.is_offer ?? false,
    is_generic: product?.is_generic ?? false,
    active_ingredient: product?.active_ingredient ?? "",
    product_composition: product?.product_composition ?? "",
    contraindications: product?.contraindications ?? "",
    adverse_effects: product?.adverse_effects ?? "",
    product_batch: product?.product_batch ?? "",
    expiration_date: product?.expiration_date ? product.expiration_date.slice(0, 10) : "",
    health_record: product?.health_record ?? "",
  });

  // Imagen
  const [imageMode, setImageMode] = useState<"upload" | "url">("url");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [clinicalOpen, setClinicalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Limpia el object URL al desmontar.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleFile = (file: File | null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const preview = imageMode === "upload" ? filePreview : imageUrl.trim() || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // Validación mínima.
    if (!form.product_name.trim()) {
      toast.error("El nombre del producto es obligatorio.");
      return;
    }
    if (!form.category_id) {
      toast.error("Selecciona una categoría.");
      return;
    }
    const price = Number(form.product_price);
    if (form.product_price === "" || Number.isNaN(price) || price < 0) {
      toast.error("Ingresa un precio válido (mayor o igual a 0).");
      return;
    }
    // Precio anterior (tachado) es opcional, pero si se ingresa debe ser válido.
    const hasOldPrice = form.old_price.trim() !== "";
    const oldPrice = hasOldPrice ? Number(form.old_price) : null;
    if (hasOldPrice && (Number.isNaN(oldPrice as number) || (oldPrice as number) < 0)) {
      toast.error("El precio anterior debe ser un número válido (mayor o igual a 0).");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Product> = {
        product_name: form.product_name.trim(),
        active_ingredient: form.active_ingredient.trim() || null,
        product_composition: form.product_composition.trim() || null,
        contraindications: form.contraindications.trim() || null,
        adverse_effects: form.adverse_effects.trim() || null,
        product_batch: form.product_batch.trim() || null,
        expiration_date: form.expiration_date || null,
        health_record: form.health_record.trim() || null,
        is_generic: form.is_generic,
        product_price: price,
        old_price: oldPrice,
        laboratory_id: form.laboratory_id ? Number(form.laboratory_id) : null,
        category_id: Number(form.category_id),
        is_offer: form.is_offer,
      };
      // Modo "pegar URL": adjuntamos image_url al JSON.
      if (imageMode === "url" && imageUrl.trim()) {
        payload.image_url = imageUrl.trim();
      }

      const saved = isEdit
        ? await api.products.update(product!.product_id, payload)
        : await api.products.create(payload);

      const productId = saved.product_id;

      // Stock por sede.
      const min = Number(form.min_stock) || 0;
      await Promise.all([
        api.inventory.upsert({
          product_id: productId,
          location_id: LOCATION_ATE,
          current_stock: Number(form.stock_ate) || 0,
          min_stock: min,
        }),
        api.inventory.upsert({
          product_id: productId,
          location_id: LOCATION_SA,
          current_stock: Number(form.stock_sa) || 0,
          min_stock: min,
        }),
      ]);

      // Modo "subir archivo": subida a S3 después de tener el product_id.
      if (imageMode === "upload" && imageFile) {
        await api.products.uploadImage(productId, imageFile);
      }

      toast.success(isEdit ? "Producto actualizado." : "Producto creado.");
      onSaved();
    } catch (err) {
      console.error("Error guardando producto:", err);
      toast.error("No se pudo guardar el producto. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-pop border border-line w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-text">
              {isEdit ? "Editar producto" : "Nuevo producto"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 text-muted hover:bg-page rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Datos principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="pf-name">Nombre del producto *</label>
              <input
                id="pf-name"
                type="text"
                value={form.product_name}
                onChange={(e) => set("product_name", e.target.value)}
                className={FIELD_CLS}
                placeholder="Ej: Paracetamol 500mg"
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-cat">Categoría *</label>
              <select
                id="pf-cat"
                value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)}
                className={FIELD_CLS}
              >
                <option value="">Selecciona…</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-lab">Laboratorio</label>
              <select
                id="pf-lab"
                value={form.laboratory_id}
                onChange={(e) => set("laboratory_id", e.target.value)}
                className={FIELD_CLS}
              >
                <option value="">Sin especificar</option>
                {laboratories.map((l) => (
                  <option key={l.laboratory_id} value={l.laboratory_id}>{l.laboratory_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-price">Precio (S/) *</label>
              <input
                id="pf-price"
                type="number"
                min={0}
                step="0.01"
                value={form.product_price}
                onChange={(e) => set("product_price", e.target.value)}
                className={FIELD_CLS}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-oldprice">Precio anterior (tachado)</label>
              <input
                id="pf-oldprice"
                type="number"
                min={0}
                step="0.01"
                value={form.old_price}
                onChange={(e) => set("old_price", e.target.value)}
                className={FIELD_CLS}
                placeholder="Opcional · solo en ofertas"
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-min">Stock mínimo</label>
              <input
                id="pf-min"
                type="number"
                min={0}
                value={form.min_stock}
                onChange={(e) => set("min_stock", e.target.value)}
                className={FIELD_CLS}
                placeholder="0"
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-ate">Stock Ate</label>
              <input
                id="pf-ate"
                type="number"
                min={0}
                value={form.stock_ate}
                onChange={(e) => set("stock_ate", e.target.value)}
                className={FIELD_CLS}
                placeholder="0"
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-sa">Stock Santa Anita</label>
              <input
                id="pf-sa"
                type="number"
                min={0}
                value={form.stock_sa}
                onChange={(e) => set("stock_sa", e.target.value)}
                className={FIELD_CLS}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle
              checked={form.is_offer}
              onChange={(v) => set("is_offer", v)}
              label="En oferta"
              hint="Destaca el producto en el catálogo"
            />
            <Toggle
              checked={form.is_generic}
              onChange={(v) => set("is_generic", v)}
              label="Genérico"
              hint="Medicamento de marca genérica"
            />
          </div>

          {/* Imagen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={LABEL_CLS + " mb-0"}>Imagen del producto</span>
              <div className="inline-flex bg-page border border-line rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    imageMode === "url" ? "bg-surface text-brand shadow-soft" : "text-muted hover:text-text"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" /> Pegar URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    imageMode === "upload" ? "bg-surface text-brand shadow-soft" : "text-muted hover:text-text"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Subir archivo
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl border border-line bg-page flex items-center justify-center overflow-hidden shrink-0">
                {preview ? (
                  <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <Pill className="w-8 h-8 text-faint" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {imageMode === "url" ? (
                  <>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className={FIELD_CLS}
                      placeholder="https://…/imagen.jpg"
                    />
                    <p className="text-xs text-muted mt-1.5">
                      Pega el enlace de una imagen existente. Se guardará tal cual, sin subir a la nube.
                    </p>
                  </>
                ) : (
                  <>
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed border-line rounded-xl text-sm font-medium text-muted hover:border-brand hover:text-brand cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      {imageFile ? imageFile.name : "Selecciona una imagen (JPG, PNG o WEBP)"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <p className="text-xs text-muted mt-1.5">
                      Máximo 5 MB. Se subirá a AWS y se servirá vía CDN al guardar.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Información clínica (colapsable) */}
          <div className="border border-line rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setClinicalOpen((o) => !o)}
              className="flex items-center justify-between w-full px-4 py-3 bg-page hover:bg-line-2/40 transition-colors"
            >
              <span className="text-sm font-semibold text-text">Información clínica (opcional)</span>
              <ChevronDown className={`w-4 h-4 text-muted transition-transform ${clinicalOpen ? "rotate-180" : ""}`} />
            </button>
            {clinicalOpen && (
              <div className="p-4 space-y-4">
                <div>
                  <label className={LABEL_CLS} htmlFor="pf-ai">Principio activo</label>
                  <input id="pf-ai" type="text" value={form.active_ingredient} onChange={(e) => set("active_ingredient", e.target.value)} className={FIELD_CLS} placeholder="Ej: Paracetamol" />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="pf-comp">Composición</label>
                  <textarea id="pf-comp" rows={2} value={form.product_composition} onChange={(e) => set("product_composition", e.target.value)} className={FIELD_CLS} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS} htmlFor="pf-contra">Contraindicaciones</label>
                    <textarea id="pf-contra" rows={2} value={form.contraindications} onChange={(e) => set("contraindications", e.target.value)} className={FIELD_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS} htmlFor="pf-adv">Efectos adversos</label>
                    <textarea id="pf-adv" rows={2} value={form.adverse_effects} onChange={(e) => set("adverse_effects", e.target.value)} className={FIELD_CLS} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={LABEL_CLS} htmlFor="pf-batch">Lote</label>
                    <input id="pf-batch" type="text" value={form.product_batch} onChange={(e) => set("product_batch", e.target.value)} className={FIELD_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS} htmlFor="pf-exp">Vencimiento</label>
                    <input id="pf-exp" type="date" value={form.expiration_date} onChange={(e) => set("expiration_date", e.target.value)} className={FIELD_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS} htmlFor="pf-hr">Registro sanitario</label>
                    <input id="pf-hr" type="text" value={form.health_record} onChange={(e) => set("health_record", e.target.value)} className={FIELD_CLS} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-line">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-page text-muted border border-line py-3 rounded-xl font-semibold hover:bg-line-2 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Diálogo de confirmación
// ============================================================

function ConfirmDialog({
  title, message, confirmLabel, loading, onCancel, onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-pop border border-line p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-error-soft text-error flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <h2 className="text-lg font-bold text-text">{title}</h2>
        </div>
        <p className="text-sm text-muted mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-error text-white py-2.5 rounded-xl font-semibold hover:bg-[color-mix(in_srgb,var(--c-error)_85%,black)] active:scale-[0.99] transition-all disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Procesando…" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-page text-muted border border-line py-2.5 rounded-xl font-semibold hover:bg-line-2 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
