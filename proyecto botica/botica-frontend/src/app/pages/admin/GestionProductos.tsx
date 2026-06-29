import {
  Search, Plus, Edit2, Trash2, Package, Pill, AlertCircle, AlertTriangle,
  CheckCircle2, TrendingDown, Tag, X, Upload, Link2, Loader2, ChevronDown,
  ChevronLeft, ChevronRight, ImageOff, PackageX, RotateCcw, ZoomIn, LayoutGrid,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { CategoryChip } from "../../components/CategoryChip";
import { Segmented } from "../../components/Segmented";
import type { Product, Category, Laboratory, InventoryItem } from "../../lib/types";

// Sedes sembradas en la BD (ver CLAUDE.md).
const LOCATION_ATE = 1;
const LOCATION_SA = 2;
const PER_PAGE = 10;

// ============================================================
// Helpers de stock
// ============================================================

type SedeStock = { current: number; min: number };
type StockMap = Map<number, Record<number, SedeStock>>;

function sedeOf(map: StockMap, productId: number, locationId: number): SedeStock {
  return map.get(productId)?.[locationId] ?? { current: 0, min: 0 };
}

type StockLevel = "ok" | "low" | "empty";

function stockStatus(total: number, totalMin: number): { level: StockLevel; label: string; cls: string } {
  if (total === 0) return { level: "empty", label: "Sin stock", cls: "bg-error-soft text-error" };
  if (totalMin > 0 && total < totalMin) return { level: "low", label: "Stock bajo", cls: "bg-warning-soft text-warning" };
  return { level: "ok", label: "Stock OK", cls: "bg-success-soft text-success" };
}

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
  // Orden por defecto: "recientes primero" (product_id desc). "A–Z" es opcional.
  const [sortMode, setSortMode] = useState<"recent" | "az">("recent");
  const [page, setPage] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
      if (categoryFilter && String(p.category_id ?? "") !== categoryFilter) return false;
      if (term) {
        const haystack = [p.product_name, p.category_name, p.active_ingredient, p.laboratory_name]
          .filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // Orden aplicado: por defecto recientes primero (id desc); A–Z si se activa.
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortMode === "az") arr.sort((a, b) => a.product_name.localeCompare(b.product_name, "es"));
    else arr.sort((a, b) => b.product_id - a.product_id);
    return arr;
  }, [filtered, sortMode]);

  // Reinicia a la página 1 cuando cambian filtros u orden.
  useEffect(() => { setPage(0); }, [searchTerm, categoryFilter, statusFilter, sortMode]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = sorted.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  const stats = useMemo(() => {
    let activos = 0, bajo = 0, ofertas = 0;
    for (const p of products) {
      if (p.is_active) activos += 1;
      if (p.is_offer) ofertas += 1;
      const ate = sedeOf(stockMap, p.product_id, LOCATION_ATE);
      const sa = sedeOf(stockMap, p.product_id, LOCATION_SA);
      if (p.is_active && stockStatus(ate.current + sa.current, ate.min + sa.min).level !== "ok") bajo += 1;
    }
    return { total: products.length, activos, bajo, ofertas };
  }, [products, stockMap]);

  const handleAddNew = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (product: Product) => { setEditing(product); setModalOpen(true); };

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

  const hasFilters = searchTerm.trim() !== "" || categoryFilter !== "" || statusFilter !== "all";
  const clearFilters = () => { setSearchTerm(""); setCategoryFilter(""); setStatusFilter("all"); };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text mb-1">Gestión de Productos</h1>
          <p className="text-sm text-muted">Administra el catálogo, su stock por sede y sus imágenes</p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center justify-center gap-2 bg-brand text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <ProductStat icon={Package} label="Total productos" value={stats.total} accent="var(--c-brand)" index={0} loading={isLoading} />
        <ProductStat icon={CheckCircle2} label="Productos activos" value={stats.activos} accent="var(--c-success)" index={1} loading={isLoading} />
        <ProductStat icon={TrendingDown} label="Con stock bajo" value={stats.bajo} accent="var(--c-warning)" index={2} loading={isLoading} />
        <ProductStat icon={Tag} label="En oferta" value={stats.ofertas} accent="var(--c-violet)" index={3} loading={isLoading} />
      </div>

      {/* Filtros estilo staff: búsqueda + chips de categoría + estado + orden */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line p-3 sm:p-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, categoría, principio activo o laboratorio"
            className="w-full h-11 pl-11 pr-3 bg-surface border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
          />
        </div>

        {/* Chips de categoría con scroll horizontal (mismo patrón del staff) */}
        {categories.length > 0 && (
          <div className="mt-3 -mb-1 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <CategoryChip
              label="Todas"
              icon={LayoutGrid}
              active={categoryFilter === ""}
              onClick={() => setCategoryFilter("")}
            />
            {categories.map((c) => (
              <CategoryChip
                key={c.category_id}
                label={c.category_name}
                iconName={c.icon_name}
                colorHex={c.color_hex}
                active={categoryFilter === String(c.category_id)}
                onClick={() => setCategoryFilter(String(c.category_id))}
              />
            ))}
          </div>
        )}

        {/* Estado + orden alfabético */}
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <Segmented
            ariaLabel="Estado"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            options={[
              { value: "all", label: "Todos" },
              { value: "active", label: "Activos" },
              { value: "inactive", label: "Inactivos" },
            ]}
          />
          <span className="hidden sm:block w-px h-6 bg-line" />
          <Segmented
            ariaLabel="Orden"
            value={sortMode}
            onChange={setSortMode}
            options={[
              { value: "recent", label: "Recientes" },
              { value: "az", label: "A–Z" },
            ]}
          />
        </div>
      </div>

      {!isLoading && !loadError && filtered.length > 0 && (
        <p className="text-xs text-muted mb-3 px-1">
          {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
          {hasFilters ? " (filtrados)" : ""}
        </p>
      )}

      {/* Tabla / estados */}
      {loadError ? (
        <div className="bg-surface rounded-2xl shadow-soft border border-line p-12 text-center">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">No pudimos cargar el catálogo</h3>
          <p className="text-sm text-muted mb-5">{loadError}</p>
          <button onClick={refresh} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors">
            <RotateCcw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      ) : isLoading ? (
        <div className="bg-surface rounded-2xl shadow-soft border border-line overflow-hidden"><TableSkeleton /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl shadow-soft border border-line p-12 text-center">
          {hasFilters ? <Search className="w-12 h-12 text-faint mx-auto mb-3" /> : <PackageX className="w-12 h-12 text-faint mx-auto mb-3" />}
          <h3 className="text-lg font-semibold text-text mb-1">{hasFilters ? "Sin resultados" : "Aún no hay productos"}</h3>
          <p className="text-sm text-muted mb-5">
            {hasFilters ? "Prueba ajustando la búsqueda o los filtros." : "Crea tu primer producto para empezar a poblar el catálogo."}
          </p>
          {hasFilters ? (
            <button onClick={clearFilters} className="inline-flex items-center gap-2 px-5 py-2.5 bg-page border border-line text-text rounded-xl font-semibold text-sm hover:bg-line-2 transition-colors">
              Limpiar filtros
            </button>
          ) : (
            <button onClick={handleAddNew} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors">
              <Plus className="w-4 h-4" /> Nuevo Producto
            </button>
          )}
        </div>
      ) : (
        <>
          <ProductsTable items={pageItems} stockMap={stockMap} onEdit={handleEdit} onDelete={setToDelete} />
          <Pager
            page={safePage} pageCount={pageCount} perPage={PER_PAGE} total={filtered.length}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          />
        </>
      )}

      {modalOpen && (
        <ProductModal
          product={editing}
          categories={categories}
          laboratories={laboratories}
          stockMap={stockMap}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); refresh(); }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          product={toDelete}
          loading={deleting}
          onCancel={() => (deleting ? null : setToDelete(null))}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

// ============================================================
// Tabla de productos (desktop) + tarjetas (móvil) — patrón staff
// ============================================================

function ProductsTable({
  items, stockMap, onEdit, onDelete,
}: {
  items: Product[];
  stockMap: StockMap;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block bg-surface rounded-2xl shadow-soft border border-line overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[28%]" /><col className="w-[12%]" /><col className="w-[11%]" />
            <col className="w-[8%]" /><col className="w-[9%]" /><col className="w-[11%]" />
            <col className="w-[11%]" /><col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="bg-surface-2 text-center text-[11px] font-semibold uppercase tracking-wider text-faint border-b border-line">
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Ate</th>
              <th className="px-4 py-3">S. Anita</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((product) => {
              const ate = sedeOf(stockMap, product.product_id, LOCATION_ATE);
              const sa = sedeOf(stockMap, product.product_id, LOCATION_SA);
              const total = ate.current + sa.current;
              const status = stockStatus(total, ate.min + sa.min);
              return (
                <tr key={product.product_id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Thumb url={product.image_url} alt={product.product_name} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-text truncate">{product.product_name}</p>
                        {product.active_ingredient && (
                          <p className="text-xs text-muted truncate">{product.active_ingredient}</p>
                        )}
                        {product.is_offer && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-semibold text-brand">
                            <Tag className="w-3 h-3" /> En oferta
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-muted truncate">{product.category_name || "—"}</td>
                  <td className="px-4 py-3 text-center font-bold text-text tabular-nums whitespace-nowrap">S/ {Number(product.product_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center"><StockPill value={ate.current} min={ate.min} /></td>
                  <td className="px-4 py-3 text-center"><StockPill value={sa.current} min={sa.min} /></td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${status.cls}`}>
                      {status.level !== "ok" && <AlertCircle className="w-3 h-3" />} {total} u.
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center"><ActiveBadge active={product.is_active} /></td>
                  <td className="px-4 py-3">
                    <RowActions product={product} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Móvil: tarjetas */}
      <div className="md:hidden space-y-2.5">
        {items.map((product) => {
          const ate = sedeOf(stockMap, product.product_id, LOCATION_ATE);
          const sa = sedeOf(stockMap, product.product_id, LOCATION_SA);
          const total = ate.current + sa.current;
          const status = stockStatus(total, ate.min + sa.min);
          return (
            <div key={product.product_id} className="bg-surface rounded-2xl shadow-soft border border-line p-4">
              <div className="flex items-start gap-3">
                <Thumb url={product.image_url} alt={product.product_name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text truncate">{product.product_name}</p>
                      {product.active_ingredient && <p className="text-xs text-muted truncate">{product.active_ingredient}</p>}
                    </div>
                    <ActiveBadge active={product.is_active} />
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-muted">{product.category_name || "—"}</span>
                    <span className="text-faint">·</span>
                    <span className="text-sm font-bold text-text tabular-nums">S/ {Number(product.product_price).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-muted">Ate <b className="text-text tabular-nums">{ate.current}</b></span>
                    <span className="text-xs text-muted">S.Anita <b className="text-text tabular-nums">{sa.current}</b></span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}>
                      {status.level !== "ok" && <AlertCircle className="w-3 h-3" />} {total} u.
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-line-2">
                <button onClick={() => onEdit(product)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-semibold text-muted hover:text-info hover:border-info transition-colors">
                  <Edit2 className="w-4 h-4" /> Editar
                </button>
                <button onClick={() => onDelete(product)} disabled={!product.is_active} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-semibold text-muted hover:text-error hover:border-error transition-colors disabled:opacity-40 disabled:hover:text-muted disabled:hover:border-line">
                  <Trash2 className="w-4 h-4" /> Desactivar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function RowActions({ product, onEdit, onDelete }: { product: Product; onEdit: (p: Product) => void; onDelete: (p: Product) => void }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onEdit(product)}
        aria-label={`Editar ${product.product_name}`}
        title="Editar"
        className="p-2 hover:bg-info-soft rounded-lg transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
      >
        <Edit2 className="w-4 h-4 text-muted group-hover:text-info" />
      </button>
      <button
        onClick={() => onDelete(product)}
        aria-label={`Desactivar ${product.product_name}`}
        title={product.is_active ? "Desactivar" : "Ya inactivo"}
        disabled={!product.is_active}
        className="p-2 hover:bg-error-soft rounded-lg transition-colors group disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
      >
        <Trash2 className="w-4 h-4 text-muted group-hover:text-error" />
      </button>
    </div>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${active ? "bg-success-soft text-success" : "bg-line-2 text-muted"}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function Thumb({ url, alt }: { url?: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (url && !errored) {
    return <img src={url} alt={alt} loading="lazy" onError={() => setErrored(true)} className="w-11 h-11 rounded-lg object-cover border border-line shrink-0" />;
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
    <span className={`inline-block min-w-[2rem] px-2 py-1 rounded-full text-xs font-semibold tabular-nums ${danger ? "bg-error-soft text-error" : "bg-line-2 text-muted"}`}>
      {value}
    </span>
  );
}

// ============================================================
// Paginación (patrón staff)
// ============================================================

function Pager({ page, pageCount, perPage, total, onPrev, onNext }: {
  page: number; pageCount: number; perPage: number; total: number; onPrev: () => void; onNext: () => void;
}) {
  const from = total === 0 ? 0 : page * perPage + 1;
  const to = Math.min((page + 1) * perPage, total);
  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      <p className="text-xs text-muted">
        Mostrando <span className="font-semibold text-text">{from}–{to}</span> de <span className="font-semibold text-text">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <PagerButton label="Página anterior" disabled={page === 0} onClick={onPrev}><ChevronLeft size={18} /></PagerButton>
        <span className="text-sm font-semibold text-text tabular-nums min-w-[4.5rem] text-center">{page + 1} / {pageCount}</span>
        <PagerButton label="Página siguiente" disabled={page >= pageCount - 1} onClick={onNext}><ChevronRight size={18} /></PagerButton>
      </div>
    </div>
  );
}

function PagerButton({ children, label, disabled, onClick }: { children: React.ReactNode; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className="w-10 h-10 flex items-center justify-center rounded-xl border border-line bg-surface text-ink-2 hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-ink-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {children}
    </button>
  );
}

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
// Stat card (coherente con KPI del Dashboard)
// ============================================================

function ProductStat({ icon: Icon, label, value, accent, index, loading }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number; accent: string; index: number; loading?: boolean;
}) {
  return (
    <div className="animate-panel relative overflow-hidden bg-surface rounded-2xl shadow-soft border border-line p-5 hover:shadow-card hover:-translate-y-0.5 transition-all" style={{ animationDelay: `${index * 60}ms` }}>
      <span className="absolute left-0 top-0 h-full w-1 rounded-r" style={{ backgroundColor: accent }} />
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}>
        <Icon className="w-[22px] h-[22px]" />
      </div>
      <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5">{label}</p>
      {loading ? <div className="h-7 w-12 bg-line-2 rounded animate-pulse" /> : <p className="text-[26px] lg:text-[28px] leading-none font-bold text-text tabular-nums">{value}</p>}
    </div>
  );
}

// ============================================================
// Toggle minimalista
// ============================================================

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 w-full bg-page border border-line rounded-xl px-4 py-3 text-left hover:border-line-2 transition-colors">
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
// Modal Crear / Editar — validación en vivo + preview clicable
// ============================================================

const LABEL_CLS = "block text-sm font-semibold mb-1.5 text-text";
const fieldCls = (hasError: boolean) =>
  `w-full px-4 py-2.5 bg-page border rounded-xl text-sm text-text focus:outline-none focus:ring-2 transition-colors ${
    hasError ? "border-error focus:ring-error/30 focus:border-error" : "border-line focus:ring-brand/30 focus:border-brand"
  }`;

const MAX_IMG_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProductForm {
  product_name: string; category_id: string; laboratory_id: string;
  product_price: string; old_price: string;
  stock_ate: string; stock_sa: string; min_stock: string;
  is_offer: boolean; is_generic: boolean;
  active_ingredient: string; product_composition: string; contraindications: string;
  adverse_effects: string; product_batch: string; expiration_date: string; health_record: string;
}

type FieldKey = "product_name" | "category_id" | "product_price" | "old_price" | "stock_ate" | "stock_sa" | "min_stock" | "image";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-error">
      <AlertCircle className="w-3 h-3 shrink-0" /> {msg}
    </p>
  );
}

function ProductModal({ product, categories, laboratories, stockMap, onClose, onSaved }: {
  product: Product | null; categories: Category[]; laboratories: Laboratory[]; stockMap: StockMap; onClose: () => void; onSaved: () => void;
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

  const [imageMode, setImageMode] = useState<"upload" | "url">("url");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [clinicalOpen, setClinicalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const touch = (k: FieldKey) => setTouched((t) => new Set(t).add(k));

  // Foco al primer campo + bloqueo de scroll del fondo.
  useEffect(() => {
    firstFieldRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Esc cierra (modal o, primero, el lightbox). No cierra mientras guarda.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (lightbox) { setLightbox(null); return; }
      if (!saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, saving, onClose]);

  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);

  const handleFile = (file: File | null) => {
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    setFileError(null);
    if (!file) { setImageFile(null); setFilePreview(null); return; }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageFile(null); setFilePreview(null);
      setFileError("Formato no válido. Usa JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_IMG_BYTES) {
      setImageFile(null); setFilePreview(null);
      setFileError(`La imagen supera 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageFile(file);
    setFilePreview(url);
  };

  const preview = imageMode === "upload" ? filePreview : imageUrl.trim() || null;

  // Validación en vivo.
  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!form.product_name.trim()) e.product_name = "El nombre es obligatorio.";
    if (!form.category_id) e.category_id = "Selecciona una categoría.";

    const price = Number(form.product_price);
    if (form.product_price.trim() === "") e.product_price = "El precio es obligatorio.";
    else if (Number.isNaN(price) || price < 0) e.product_price = "Ingresa un precio válido (≥ 0).";

    if (form.old_price.trim() !== "") {
      const op = Number(form.old_price);
      if (Number.isNaN(op) || op < 0) e.old_price = "Debe ser un número ≥ 0.";
      else if (form.is_offer && !Number.isNaN(price) && op <= price) e.old_price = "Debe ser mayor al precio actual.";
    }

    (["stock_ate", "stock_sa", "min_stock"] as const).forEach((k) => {
      const v = form[k].trim();
      if (v === "") return;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0) e[k] = "Número entero ≥ 0.";
    });

    if (imageMode === "url" && imageUrl.trim() && !/^https?:\/\//i.test(imageUrl.trim())) e.image = "La URL debe empezar con http:// o https://";
    if (imageMode === "upload" && fileError) e.image = fileError;

    return e;
  }, [form, imageMode, imageUrl, fileError]);

  const isValid = Object.keys(errors).length === 0;
  const showErr = (k: FieldKey) => ((submitAttempted || touched.has(k)) ? errors[k] : undefined);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitAttempted(true);
    if (saving || !isValid) return;

    setSaving(true);
    try {
      const price = Number(form.product_price);
      const oldPrice = form.old_price.trim() !== "" ? Number(form.old_price) : null;
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
      if (imageMode === "url" && imageUrl.trim()) payload.image_url = imageUrl.trim();

      const saved = isEdit
        ? await api.products.update(product!.product_id, payload)
        : await api.products.create(payload);
      const productId = saved.product_id;

      const min = Number(form.min_stock) || 0;
      await Promise.all([
        api.inventory.upsert({ product_id: productId, location_id: LOCATION_ATE, current_stock: Number(form.stock_ate) || 0, min_stock: min }),
        api.inventory.upsert({ product_id: productId, location_id: LOCATION_SA, current_stock: Number(form.stock_sa) || 0, min_stock: min }),
      ]);

      if (imageMode === "upload" && imageFile) await api.products.uploadImage(productId, imageFile);

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
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label={isEdit ? "Editar producto" : "Nuevo producto"} className="bg-surface rounded-2xl shadow-pop border border-line w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0"><Package className="w-5 h-5" /></span>
            <h2 className="text-lg font-bold text-text">{isEdit ? "Editar producto" : "Nuevo producto"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 text-muted hover:bg-page rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Datos principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={LABEL_CLS} htmlFor="pf-name">Nombre del producto *</label>
              <input ref={firstFieldRef} id="pf-name" type="text" value={form.product_name}
                onChange={(e) => set("product_name", e.target.value)} onBlur={() => touch("product_name")}
                className={fieldCls(!!showErr("product_name"))} placeholder="Ej: Paracetamol 500mg" />
              <FieldError msg={showErr("product_name")} />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-cat">Categoría *</label>
              <select id="pf-cat" value={form.category_id} onChange={(e) => set("category_id", e.target.value)} onBlur={() => touch("category_id")} className={fieldCls(!!showErr("category_id"))}>
                <option value="">Selecciona…</option>
                {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
              <FieldError msg={showErr("category_id")} />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-lab">Laboratorio</label>
              <select id="pf-lab" value={form.laboratory_id} onChange={(e) => set("laboratory_id", e.target.value)} className={fieldCls(false)}>
                <option value="">Sin especificar</option>
                {laboratories.map((l) => <option key={l.laboratory_id} value={l.laboratory_id}>{l.laboratory_name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-price">Precio (S/) *</label>
              <input id="pf-price" type="number" min={0} step="0.01" value={form.product_price}
                onChange={(e) => set("product_price", e.target.value)} onBlur={() => touch("product_price")}
                className={fieldCls(!!showErr("product_price"))} placeholder="0.00" />
              <FieldError msg={showErr("product_price")} />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-oldprice">Precio anterior (tachado)</label>
              <input id="pf-oldprice" type="number" min={0} step="0.01" value={form.old_price}
                onChange={(e) => set("old_price", e.target.value)} onBlur={() => touch("old_price")}
                className={fieldCls(!!showErr("old_price"))} placeholder="Opcional · solo en ofertas" />
              <FieldError msg={showErr("old_price")} />
              {!showErr("old_price") && form.is_offer && (
                <p className="mt-1 text-xs text-muted">Debe ser mayor al precio actual para mostrar el descuento.</p>
              )}
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-min">Stock mínimo</label>
              <input id="pf-min" type="number" min={0} value={form.min_stock}
                onChange={(e) => set("min_stock", e.target.value)} onBlur={() => touch("min_stock")}
                className={fieldCls(!!showErr("min_stock"))} placeholder="0" />
              <FieldError msg={showErr("min_stock")} />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-ate">Stock Ate</label>
              <input id="pf-ate" type="number" min={0} value={form.stock_ate}
                onChange={(e) => set("stock_ate", e.target.value)} onBlur={() => touch("stock_ate")}
                className={fieldCls(!!showErr("stock_ate"))} placeholder="0" />
              <FieldError msg={showErr("stock_ate")} />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="pf-sa">Stock Santa Anita</label>
              <input id="pf-sa" type="number" min={0} value={form.stock_sa}
                onChange={(e) => set("stock_sa", e.target.value)} onBlur={() => touch("stock_sa")}
                className={fieldCls(!!showErr("stock_sa"))} placeholder="0" />
              <FieldError msg={showErr("stock_sa")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle checked={form.is_offer} onChange={(v) => set("is_offer", v)} label="En oferta" hint="Destaca el producto en el catálogo" />
            <Toggle checked={form.is_generic} onChange={(v) => set("is_generic", v)} label="Genérico" hint="Medicamento de marca genérica" />
          </div>

          {/* Imagen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={LABEL_CLS + " mb-0"}>Imagen del producto</span>
              <div className="inline-flex bg-page border border-line rounded-lg p-0.5">
                <button type="button" onClick={() => setImageMode("url")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${imageMode === "url" ? "bg-surface text-brand shadow-soft" : "text-muted hover:text-text"}`}>
                  <Link2 className="w-3.5 h-3.5" /> Pegar URL
                </button>
                <button type="button" onClick={() => setImageMode("upload")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${imageMode === "upload" ? "bg-surface text-brand shadow-soft" : "text-muted hover:text-text"}`}>
                  <Upload className="w-3.5 h-3.5" /> Subir archivo
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              {/* Preview clicable → lightbox */}
              <button
                type="button"
                onClick={() => preview && setLightbox(preview)}
                disabled={!preview}
                aria-label={preview ? "Ampliar vista previa de la imagen" : "Sin imagen"}
                className="group relative w-24 h-24 rounded-xl border border-line bg-page flex items-center justify-center overflow-hidden shrink-0 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <ZoomIn className="w-6 h-6 text-white" />
                    </span>
                  </>
                ) : (
                  <Pill className="w-8 h-8 text-faint" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                {imageMode === "url" ? (
                  <>
                    <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onBlur={() => touch("image")} className={fieldCls(!!showErr("image"))} placeholder="https://…/imagen.jpg" />
                    {showErr("image") ? <FieldError msg={showErr("image")} /> : <p className="text-xs text-muted mt-1.5">Pega el enlace de una imagen existente. Se guardará tal cual.</p>}
                  </>
                ) : (
                  <>
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed border-line rounded-xl text-sm font-medium text-muted hover:border-brand hover:text-brand cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="truncate">{imageFile ? imageFile.name : "Selecciona una imagen (JPG, PNG o WEBP)"}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
                    </label>
                    {fileError ? <FieldError msg={fileError} /> : <p className="text-xs text-muted mt-1.5">Máximo 5 MB. Se subirá a la nube y se servirá vía CDN al guardar.</p>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Información clínica (colapsable) — columnas reales en la BD */}
          <div className="border border-line rounded-xl overflow-hidden">
            <button type="button" onClick={() => setClinicalOpen((o) => !o)} className="flex items-center justify-between w-full px-4 py-3 bg-page hover:bg-line-2/40 transition-colors">
              <span className="text-sm font-semibold text-text">Información clínica (opcional)</span>
              <ChevronDown className={`w-4 h-4 text-muted transition-transform ${clinicalOpen ? "rotate-180" : ""}`} />
            </button>
            {clinicalOpen && (
              <div className="p-4 space-y-4">
                <div>
                  <label className={LABEL_CLS} htmlFor="pf-ai">Principio activo</label>
                  <input id="pf-ai" type="text" value={form.active_ingredient} onChange={(e) => set("active_ingredient", e.target.value)} className={fieldCls(false)} placeholder="Ej: Paracetamol" />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="pf-comp">Descripción</label>
                  <textarea id="pf-comp" rows={2} value={form.product_composition} onChange={(e) => set("product_composition", e.target.value)} className={fieldCls(false)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS} htmlFor="pf-contra">Contraindicaciones</label>
                    <textarea id="pf-contra" rows={2} value={form.contraindications} onChange={(e) => set("contraindications", e.target.value)} className={fieldCls(false)} />
                  </div>
                  <div>
                    <label className={LABEL_CLS} htmlFor="pf-adv">Efectos adversos</label>
                    <textarea id="pf-adv" rows={2} value={form.adverse_effects} onChange={(e) => set("adverse_effects", e.target.value)} className={fieldCls(false)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={LABEL_CLS} htmlFor="pf-batch">Lote</label>
                    <input id="pf-batch" type="text" value={form.product_batch} onChange={(e) => set("product_batch", e.target.value)} className={fieldCls(false)} />
                  </div>
                  <div>
                    <label className={LABEL_CLS} htmlFor="pf-exp">Vencimiento</label>
                    <input id="pf-exp" type="date" value={form.expiration_date} onChange={(e) => set("expiration_date", e.target.value)} className={fieldCls(false)} />
                  </div>
                  <div>
                    <label className={LABEL_CLS} htmlFor="pf-hr">Registro sanitario</label>
                    <input id="pf-hr" type="text" value={form.health_record} onChange={(e) => set("health_record", e.target.value)} className={fieldCls(false)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-line">
          <button
            type="button" onClick={() => handleSubmit()} disabled={saving || !isValid}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 bg-page text-muted border border-line py-3 rounded-xl font-semibold hover:bg-line-2 transition-colors disabled:opacity-60">
            Cancelar
          </button>
        </div>
      </div>

      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ============================================================
// Lightbox de vista previa de imagen
// ============================================================

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-label="Vista previa de la imagen"
    >
      <button type="button" onClick={onClose} aria-label="Cerrar vista previa" className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        <X className="w-5 h-5" />
      </button>
      <img src={src} alt="Vista previa ampliada" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-pop" />
    </div>
  );
}

// ============================================================
// Diálogo de desactivar (accesible: foco, Esc, aria)
// ============================================================

function ConfirmDialog({ product, loading, onCancel, onConfirm }: {
  product: Product; loading?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [loading, onCancel]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="del-title" aria-describedby="del-desc" className="bg-surface rounded-2xl shadow-pop border border-line p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-error-soft text-error flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></span>
          <h2 id="del-title" className="text-lg font-bold text-text">Desactivar producto</h2>
        </div>
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-page border border-line">
          <Thumb url={product.image_url} alt={product.product_name} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text truncate">{product.product_name}</p>
            {product.category_name && <p className="text-xs text-muted truncate">{product.category_name}</p>}
          </div>
        </div>
        <p id="del-desc" className="text-sm text-muted mb-6">
          Dejará de aparecer en el catálogo, pero su historial (pedidos y stock) se conserva. Podrás reactivarlo editándolo.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onConfirm} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 bg-error text-white py-2.5 rounded-xl font-semibold hover:bg-[color-mix(in_srgb,var(--c-error)_85%,black)] active:scale-[0.99] transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Procesando…" : "Desactivar"}
          </button>
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className="flex-1 bg-page text-muted border border-line py-2.5 rounded-xl font-semibold hover:bg-line-2 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
