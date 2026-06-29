import {
  Package, TrendingUp, TrendingDown, Minus, RefreshCw, ArrowRightLeft,
  AlertTriangle, AlertCircle, Search, ChevronLeft, ChevronRight, Pill, ImageOff,
  X, Check, Loader2, CalendarDays, PackageX, MapPin, LayoutGrid,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { api, ApiError } from "../../lib/api";
import { useAdminScope } from "../../lib/AdminScopeContext";
import { formatLimaDate } from "../../lib/dates";
import { CategoryChip } from "../../components/CategoryChip";
import { Segmented } from "../../components/Segmented";
import { ProductSearchAutocomplete } from "../../components/ProductSearchAutocomplete";
import type { InventoryItem, Location, Category } from "../../lib/types";

const PER_PAGE = 10;

// ============================================================
// Helpers de estado / tendencia
// ============================================================

type StatusKey = "critical" | "low" | "normal";

function stockStatus(current: number, min: number): { key: StatusKey; label: string; cls: string } {
  if (current === 0) return { key: "critical", label: "Agotado", cls: "bg-error-soft text-error" };
  if (min > 0 && current < Math.ceil(min / 2)) return { key: "critical", label: "Crítico", cls: "bg-error-soft text-error" };
  if (min > 0 && current < min) return { key: "low", label: "Bajo", cls: "bg-warning-soft text-warning" };
  return { key: "normal", label: "Normal", cls: "bg-success-soft text-success" };
}

// Nivel de stock frente al mínimo (señal real derivada de los datos actuales).
// Etiquetas claras de NIVEL (no de tendencia temporal, que no se registra):
// "Bajo mínimo" · "Suficiente" · "Abastecido".
function stockTrend(current: number, min: number): { Icon: typeof Minus; label: string; cls: string } {
  if (min > 0 && current < min) return { Icon: TrendingDown, label: "Bajo mínimo", cls: "text-error" };
  if (current >= Math.max(min, 1) * 1.5) return { Icon: TrendingUp, label: "Abastecido", cls: "text-success" };
  return { Icon: Minus, label: "Suficiente", cls: "text-muted" };
}

function fmtRestock(v?: string | null): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

// ============================================================
// Página
// ============================================================

export function ControlStock() {
  const { selectedLocationId, locations, setScope } = useAdminScope();
  const sedes = useMemo(() => [...locations].sort((a, b) => a.location_id - b.location_id), [locations]);
  const firstSedeId = sedes[0]?.location_id ?? 1;

  const [viewSede, setViewSede] = useState<number>(selectedLocationId ?? firstSedeId);

  // Sincroniza con el selector global del topbar cuando apunta a una sede concreta.
  useEffect(() => { if (selectedLocationId != null) setViewSede(selectedLocationId); }, [selectedLocationId]);
  // Si la sede vista no existe (al cargar sedes), cae a la primera.
  useEffect(() => {
    if (sedes.length && !sedes.some((s) => s.location_id === viewSede)) setViewSede(firstSedeId);
  }, [sedes, viewSede, firstSedeId]);

  const pickSede = (id: number) => { setViewSede(id); setScope(id); };

  const [rows, setRows] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(""); // category_id (string); "" = todas
  const [statusFilter, setStatusFilter] = useState<"all" | "critical" | "low" | "normal">("all");
  const [page, setPage] = useState(0);

  const [transferOpen, setTransferOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockPreset, setRestockPreset] = useState<{ product_id?: number; location_id?: number }>({});

  const load = useCallback(async () => {
    setError(false);
    try {
      const [data, cats] = await Promise.all([
        api.inventory.getAll(),
        api.categories.getAll().catch(() => [] as Category[]),
      ]);
      setRows(data);
      setCategories(cats);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setLoading(true); load(); }, [load]);
  const refresh = () => load();

  const sedeName = sedes.find((s) => s.location_id === viewSede)?.location_name ?? "Sede";
  const sedeRows = useMemo(() => rows.filter((r) => r.location_id === viewSede), [rows, viewSede]);

  // Mapa producto → sede → fila (para disponibilidad en transferencias).
  const productSedeMap = useMemo(() => {
    const m = new Map<number, Map<number, InventoryItem>>();
    for (const r of rows) {
      if (!m.has(r.product_id)) m.set(r.product_id, new Map());
      m.get(r.product_id)!.set(r.location_id, r);
    }
    return m;
  }, [rows]);

  // Lista de productos única (para los selects de los modales).
  const products = useMemo(() => {
    const seen = new Map<number, { product_id: number; product_name: string }>();
    for (const r of rows) if (!seen.has(r.product_id)) seen.set(r.product_id, { product_id: r.product_id, product_name: r.product_name ?? `#${r.product_id}` });
    return [...seen.values()].sort((a, b) => a.product_name.localeCompare(b.product_name));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // El chip da un category_id; la fila trae category_name → mapeamos por nombre.
    const catName = categoryFilter
      ? categories.find((c) => String(c.category_id) === categoryFilter)?.category_name ?? null
      : null;
    const list = sedeRows.filter((r) => {
      if (catName && (r.category_name ?? "") !== catName) return false;
      if (statusFilter !== "all" && stockStatus(r.current_stock, r.min_stock).key !== statusFilter) return false;
      if (q) {
        const hay = [r.product_name, r.category_name, r.active_ingredient].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Orden por defecto: recientes primero (product_id desc → último registrado arriba).
    return list.sort((a, b) => b.product_id - a.product_id);
  }, [sedeRows, search, categoryFilter, categories, statusFilter]);

  const counts = useMemo(() => {
    let critical = 0, low = 0, normal = 0;
    for (const r of sedeRows) {
      const k = stockStatus(r.current_stock, r.min_stock).key;
      if (k === "critical") critical++; else if (k === "low") low++; else normal++;
    }
    return { total: sedeRows.length, critical, low, normal };
  }, [sedeRows]);

  useEffect(() => { setPage(0); }, [viewSede, search, categoryFilter, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);
  const hasFilters = search.trim() !== "" || categoryFilter !== "" || statusFilter !== "all";

  const openRestock = (preset: { product_id?: number; location_id?: number }) => {
    setRestockPreset(preset);
    setRestockOpen(true);
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text mb-1">Control de Stock por Sede</h1>
          <p className="text-sm text-muted">Monitorea el inventario y registra movimientos de stock</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTransferOpen(true)}
            className="inline-flex items-center gap-2 bg-cool text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-[color-mix(in_srgb,var(--c-cool)_88%,black)] active:scale-[0.99] shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cool focus-visible:ring-offset-2"
          >
            <ArrowRightLeft className="w-5 h-5" /> Transferir Stock
          </button>
          <button
            onClick={() => openRestock({ location_id: viewSede })}
            className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-5 h-5" /> Registrar Reposición
          </button>
        </div>
      </div>

      {/* Toggle de sede (coherente con el selector global) */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line px-4 sm:px-5 py-3.5 mb-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted">
          <MapPin size={16} className="text-brand" /> Ver stock de:
        </span>
        <div role="group" aria-label="Sede" className="inline-flex items-center gap-1 rounded-full border border-line bg-page p-1">
          {sedes.map((s) => {
            const active = s.location_id === viewSede;
            return (
              <button
                key={s.location_id}
                type="button"
                onClick={() => pickSede(s.location_id)}
                aria-pressed={active}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${active ? "bg-brand text-white shadow-sm" : "text-muted hover:text-text"}`}
              >
                Sede {s.location_name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner stock crítico */}
      {!loading && counts.critical > 0 && (
        <div className="bg-error-soft border border-error/20 border-l-4 border-l-error p-4 rounded-2xl mb-6 flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-error" />
          </span>
          <div>
            <p className="text-error font-semibold text-sm">
              {counts.critical} producto{counts.critical !== 1 ? "s" : ""} en stock crítico en sede {sedeName}
            </p>
            <p className="text-error/80 text-xs mt-0.5">Se requiere reposición urgente</p>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <StockStat icon={Package} label="Total productos" value={counts.total} accent="var(--c-brand)" index={0} loading={loading} />
        <StockStat icon={AlertTriangle} label="Stock crítico" value={counts.critical} accent="var(--c-error)" index={1} loading={loading} />
        <StockStat icon={TrendingDown} label="Stock bajo" value={counts.low} accent="var(--c-warning)" index={2} loading={loading} />
        <StockStat icon={TrendingUp} label="Stock normal" value={counts.normal} accent="var(--c-success)" index={3} loading={loading} />
      </div>

      {/* Filtros estilo staff: búsqueda + chips de categoría + estado de stock */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line p-3 sm:p-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto por nombre, categoría o principio activo"
            className="w-full h-11 pl-11 pr-3 bg-surface border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
          />
        </div>

        {/* Chips de categoría con scroll horizontal */}
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

        {/* Estado de stock (útil en esta tabla) */}
        <div className="mt-3">
          <Segmented
            ariaLabel="Estado de stock"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            options={[
              { value: "all", label: "Todos" },
              { value: "critical", label: "Crítico" },
              { value: "low", label: "Bajo" },
              { value: "normal", label: "Normal" },
            ]}
          />
        </div>
      </div>

      {/* Tabla / estados */}
      {error ? (
        <div className="bg-surface rounded-2xl shadow-soft border border-line p-12 text-center">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">No pudimos cargar el inventario</h3>
          <p className="text-sm text-muted mb-5">Revisa tu conexión e inténtalo de nuevo.</p>
          <button onClick={refresh} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      ) : loading ? (
        <div className="bg-surface rounded-2xl shadow-soft border border-line overflow-hidden"><TableSkeleton /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl shadow-soft border border-line p-12 text-center">
          {hasFilters ? <Search className="w-12 h-12 text-faint mx-auto mb-3" /> : <PackageX className="w-12 h-12 text-faint mx-auto mb-3" />}
          <h3 className="text-lg font-semibold text-text mb-1">{hasFilters ? "Sin resultados" : "Sin inventario en esta sede"}</h3>
          <p className="text-sm text-muted">{hasFilters ? "Prueba ajustando la búsqueda, la categoría o el estado." : "Aún no hay productos con stock registrado aquí."}</p>
        </div>
      ) : (
        <>
          <StockTable items={pageItems} sedeName={sedeName} onRestock={(it) => openRestock({ product_id: it.product_id, location_id: viewSede })} />
          <Pager
            page={safePage} pageCount={pageCount} perPage={PER_PAGE} total={filtered.length}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          />
        </>
      )}

      {transferOpen && (
        <TransferModal
          products={products} productSedeMap={productSedeMap} sedes={sedes} defaultFrom={viewSede}
          onClose={() => setTransferOpen(false)}
          onDone={() => { setTransferOpen(false); refresh(); }}
        />
      )}

      {restockOpen && (
        <RestockModal
          products={products} sedes={sedes} preset={restockPreset}
          onClose={() => setRestockOpen(false)}
          onDone={() => { setRestockOpen(false); refresh(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// Tabla (desktop) + tarjetas (móvil) — patrón Gestión de Productos
// ============================================================

function StockTable({ items, sedeName, onRestock }: { items: InventoryItem[]; sedeName: string; onRestock: (it: InventoryItem) => void }) {
  return (
    <>
      <div className="hidden md:block bg-surface rounded-2xl shadow-soft border border-line overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[23%]" /><col className="w-[11%]" /><col className="w-[10%]" /><col className="w-[9%]" />
            <col className="w-[11%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="bg-surface-2 text-center text-[11px] font-semibold uppercase tracking-wider text-faint border-b border-line">
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Stock actual</th>
              <th className="px-4 py-3">Stock mínimo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Última reposición</th>
              <th className="px-4 py-3">Tendencia</th>
              <th className="px-4 py-3 pr-6">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((it) => {
              const status = stockStatus(it.current_stock, it.min_stock);
              const trend = stockTrend(it.current_stock, it.min_stock);
              const TrendIcon = trend.Icon;
              const restock = fmtRestock(it.last_restock);
              return (
                <tr key={it.inventory_id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Thumb url={it.image_url} alt={it.product_name ?? ""} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-text truncate">{it.product_name ?? "—"}</p>
                        <p className="text-xs text-muted font-mono">#{it.product_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-muted truncate">{it.category_name || "—"}</td>
                  {/* Stock actual: cifra grande y SOBRIA (la severidad la lleva el badge Estado) */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-2xl font-bold text-text tabular-nums">{it.current_stock}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted tabular-nums">{it.min_stock}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${status.cls}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" /> {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted whitespace-nowrap">
                    {restock ?? <span className="text-faint">Sin registro</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center gap-1 w-full text-xs font-medium ${trend.cls}`}>
                      <TrendIcon className="w-4 h-4" /> {trend.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 pr-6 text-center">
                    <button
                      onClick={() => onRestock(it)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-brand hover:border-brand hover:bg-brand-soft font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reponer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Móvil */}
      <div className="md:hidden space-y-2.5">
        {items.map((it) => {
          const status = stockStatus(it.current_stock, it.min_stock);
          const trend = stockTrend(it.current_stock, it.min_stock);
          const TrendIcon = trend.Icon;
          const restock = fmtRestock(it.last_restock);
          return (
            <div key={it.inventory_id} className="bg-surface rounded-2xl shadow-soft border border-line p-4">
              <div className="flex items-start gap-3">
                <Thumb url={it.image_url} alt={it.product_name ?? ""} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text truncate">{it.product_name ?? "—"}</p>
                      <p className="text-xs text-muted font-mono">#{it.product_id} · {it.category_name || "—"}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${status.cls}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" /> {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted">Actual <b className="text-text text-base tabular-nums">{it.current_stock}</b></span>
                    <span className="text-sm text-muted">Mín. <b className="text-text tabular-nums">{it.min_stock}</b></span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${trend.cls}`}><TrendIcon className="w-3.5 h-3.5" /> {trend.label}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-line-2">
                    <span className="text-xs text-muted">Repuesto: {restock ?? "—"}</span>
                    <button onClick={() => onRestock(it)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm font-semibold text-brand hover:border-brand transition-colors">
                      <RefreshCw className="w-4 h-4" /> Reponer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
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

function Pager({ page, pageCount, perPage, total, onPrev, onNext }: {
  page: number; pageCount: number; perPage: number; total: number; onPrev: () => void; onNext: () => void;
}) {
  const from = total === 0 ? 0 : page * perPage + 1;
  const to = Math.min((page + 1) * perPage, total);
  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      <p className="text-xs text-muted">Mostrando <span className="font-semibold text-text">{from}–{to}</span> de <span className="font-semibold text-text">{total}</span></p>
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
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className="w-10 h-10 flex items-center justify-center rounded-xl border border-line bg-surface text-ink-2 hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-ink-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
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
          <div className="flex-1 space-y-2"><div className="h-3.5 w-1/3 bg-line-2 rounded animate-pulse" /><div className="h-3 w-1/4 bg-line-2 rounded animate-pulse" /></div>
          <div className="h-8 w-12 bg-line-2 rounded animate-pulse" />
          <div className="h-6 w-20 bg-line-2 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function StockStat({ icon: Icon, label, value, accent, index, loading }: {
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
// Estilos de formulario compartidos por los modales
// ============================================================

const LABEL = "block text-sm font-semibold mb-1.5 text-text";
const field = (err: boolean) =>
  `w-full px-4 py-2.5 bg-page border rounded-xl text-sm text-text focus:outline-none focus:ring-2 transition-colors ${err ? "border-error focus:ring-error/30 focus:border-error" : "border-line focus:ring-brand/30 focus:border-brand"}`;

function ErrText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 flex items-center gap-1 text-xs font-medium text-error"><AlertCircle className="w-3 h-3 shrink-0" /> {msg}</p>;
}

// Overlay de retroalimentación (patrón del modal de éxito del staff).
function Feedback({ phase, title, lines, onDone }: {
  phase: "processing" | "success"; title: string; lines: { label: string; value: string }[]; onDone: () => void;
}) {
  if (phase === "processing") {
    return (
      <div className="py-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-soft flex items-center justify-center">
          <div className="w-9 h-9 border-[3px] border-brand border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-lg font-bold text-text">Procesando…</p>
        <p className="text-sm text-muted mt-1">Actualizando el inventario</p>
      </div>
    );
  }
  return (
    <div className="py-4 text-center">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <span className="absolute inset-0 rounded-full bg-success-soft" />
        <span className="absolute inset-[7px] rounded-full border-2 border-success/25" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-12 h-12 rounded-full bg-success flex items-center justify-center shadow-soft">
            <Check size={26} strokeWidth={3} className="text-white" />
          </span>
        </span>
      </div>
      <h2 className="text-xl font-bold text-text">{title}</h2>
      <div className="rounded-xl border border-line overflow-hidden text-left my-5">
        <div className="divide-y divide-line-2">
          {lines.map((l) => (
            <div key={l.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-faint">{l.label}</span>
              <span className="text-sm font-semibold text-text text-right">{l.value}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onDone} className="w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
        Listo
      </button>
    </div>
  );
}

// Shell de modal con foco, Esc, scroll-lock y click-fuera.
function ModalShell({ title, icon, accent, onClose, locked, children }: {
  title: string; icon: React.ReactNode; accent: string; onClose: () => void; locked: boolean; children: React.ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !locked) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [locked, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !locked) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-surface rounded-2xl shadow-pop border border-line w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}>{icon}</span>
            <h2 className="text-lg font-bold text-text">{title}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={locked} aria-label="Cerrar" className="p-2 text-muted hover:bg-page rounded-lg transition-colors disabled:opacity-40"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// Modal: Transferir stock entre sedes
// ============================================================

function TransferModal({ products, productSedeMap, sedes, defaultFrom, onClose, onDone }: {
  products: { product_id: number; product_name: string }[];
  productSedeMap: Map<number, Map<number, InventoryItem>>;
  sedes: Location[]; defaultFrom: number; onClose: () => void; onDone: () => void;
}) {
  const other = (id: number) => sedes.find((s) => s.location_id !== id)?.location_id ?? id;
  const [productId, setProductId] = useState<string>("");
  const [fromSede, setFromSede] = useState<number>(defaultFrom);
  const [toSede, setToSede] = useState<number>(other(defaultFrom));
  const [amount, setAmount] = useState("");
  const [motivo, setMotivo] = useState("");
  const [phase, setPhase] = useState<"form" | "processing" | "success">("form");
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const touch = (k: string) => setTouched((t) => new Set(t).add(k));

  const nameOf = (id: number) => sedes.find((s) => s.location_id === id)?.location_name ?? "—";
  const productName = products.find((p) => p.product_id === Number(productId))?.product_name ?? "";
  const available = productId ? productSedeMap.get(Number(productId))?.get(fromSede)?.current_stock ?? 0 : 0;
  const amt = Number(amount);

  const setFrom = (id: number) => { setFromSede(id); if (id === toSede) setToSede(other(id)); };
  const setTo = (id: number) => { setToSede(id); if (id === fromSede) setFromSede(other(id)); };

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!productId) e.product = "Selecciona un producto.";
    if (fromSede === toSede) e.sede = "Las sedes deben ser distintas.";
    if (amount.trim() === "") e.amount = "Indica la cantidad.";
    else if (!Number.isInteger(amt) || amt <= 0) e.amount = "Debe ser un entero mayor a 0.";
    else if (productId && amt > available) e.amount = `Solo hay ${available} u. en ${nameOf(fromSede)}.`;
    return e;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, fromSede, toSede, amount, amt, available]);
  const valid = Object.keys(errors).length === 0;
  const showErr = (k: string) => (touched.has(k) ? errors[k] : undefined);

  const submit = async () => {
    setTouched(new Set(["product", "sede", "amount"]));
    if (!valid) return;
    setPhase("processing");
    try {
      await Promise.all([
        new Promise((r) => setTimeout(r, 900)),
        api.inventory.transfer({ product_id: Number(productId), from_location: fromSede, to_location: toSede, amount: amt }),
      ]);
      setPhase("success");
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { message?: string })?.message || err.message) : "No se pudo transferir el stock.";
      toast.error(msg);
      setPhase("form");
    }
  };

  return (
    <ModalShell title="Transferir stock entre sedes" accent="var(--c-cool)" icon={<ArrowRightLeft className="w-5 h-5" />} onClose={onClose} locked={phase === "processing"}>
      {phase === "form" ? (
        <div className="space-y-4">
          <div>
            <label className={LABEL} htmlFor="tf-prod">Producto</label>
            <select id="tf-prod" value={productId} onChange={(e) => setProductId(e.target.value)} onBlur={() => touch("product")} className={field(!!showErr("product"))}>
              <option value="">Seleccionar producto…</option>
              {products.map((p) => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
            </select>
            <ErrText msg={showErr("product")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="tf-from">Desde</label>
              <select id="tf-from" value={fromSede} onChange={(e) => setFrom(Number(e.target.value))} className={field(false)}>
                {sedes.map((s) => <option key={s.location_id} value={s.location_id}>{s.location_name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="tf-to">Hacia</label>
              <select id="tf-to" value={toSede} onChange={(e) => setTo(Number(e.target.value))} className={field(!!showErr("sede"))}>
                {sedes.map((s) => <option key={s.location_id} value={s.location_id}>{s.location_name}</option>)}
              </select>
            </div>
          </div>
          <ErrText msg={showErr("sede")} />

          <div>
            <label className={LABEL} htmlFor="tf-amount">Cantidad a transferir</label>
            <input id="tf-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={() => touch("amount")} className={field(!!showErr("amount"))} placeholder="0" />
            {showErr("amount") ? <ErrText msg={showErr("amount")} /> : productId ? <p className="mt-1 text-xs text-muted">Disponible en {nameOf(fromSede)}: <b className="text-text tabular-nums">{available} u.</b></p> : null}
          </div>

          <div>
            <label className={LABEL} htmlFor="tf-motivo">Motivo (opcional)</label>
            <textarea id="tf-motivo" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={field(false) + " resize-none"} placeholder="Describe el motivo de la transferencia…" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={submit} disabled={!valid} className="flex-1 inline-flex items-center justify-center gap-2 bg-cool text-white py-3 rounded-xl font-semibold hover:bg-[color-mix(in_srgb,var(--c-cool)_88%,black)] active:scale-[0.99] shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cool focus-visible:ring-offset-2">
              <ArrowRightLeft className="w-4 h-4" /> Confirmar transferencia
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-page text-muted border border-line py-3 rounded-xl font-semibold hover:bg-line-2 transition-colors">Cancelar</button>
          </div>
        </div>
      ) : (
        <Feedback
          phase={phase} title="Transferencia realizada"
          lines={[
            { label: "Producto", value: productName },
            { label: "Movimiento", value: `${nameOf(fromSede)} → ${nameOf(toSede)}` },
            { label: "Cantidad", value: `${amt} u.` },
          ]}
          onDone={onDone}
        />
      )}
    </ModalShell>
  );
}

// ============================================================
// Modal: Registrar reposición
// ============================================================

function RestockModal({ products, sedes, preset, onClose, onDone }: {
  products: { product_id: number; product_name: string }[];
  sedes: Location[]; preset: { product_id?: number; location_id?: number }; onClose: () => void; onDone: () => void;
}) {
  const presetName = preset.product_id
    ? products.find((p) => p.product_id === preset.product_id)?.product_name ?? ""
    : "";
  const [productId, setProductId] = useState<string>(preset.product_id ? String(preset.product_id) : "");
  const [selectedName, setSelectedName] = useState<string>(presetName);
  const [sede, setSede] = useState<number>(preset.location_id ?? sedes[0]?.location_id ?? 1);
  const [amount, setAmount] = useState("");
  const [motivo, setMotivo] = useState("");
  const [phase, setPhase] = useState<"form" | "processing" | "success">("form");
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const touch = (k: string) => setTouched((t) => new Set(t).add(k));

  const today = formatLimaDate();
  const nameOf = (id: number) => sedes.find((s) => s.location_id === id)?.location_name ?? "—";
  const productName = selectedName || products.find((p) => p.product_id === Number(productId))?.product_name || "";
  const amt = Number(amount);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!productId) e.product = "Selecciona un producto.";
    if (amount.trim() === "") e.amount = "Indica la cantidad.";
    else if (!Number.isInteger(amt) || amt <= 0) e.amount = "Debe ser un entero mayor a 0.";
    return e;
  }, [productId, amount, amt]);
  const valid = Object.keys(errors).length === 0;
  const showErr = (k: string) => (touched.has(k) ? errors[k] : undefined);

  const submit = async () => {
    setTouched(new Set(["product", "amount"]));
    if (!valid) return;
    setPhase("processing");
    try {
      await Promise.all([
        new Promise((r) => setTimeout(r, 900)),
        api.inventory.restock({ product_id: Number(productId), location_id: sede, amount: amt }),
      ]);
      setPhase("success");
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { message?: string })?.message || err.message) : "No se pudo registrar la reposición.";
      toast.error(msg);
      setPhase("form");
    }
  };

  return (
    <ModalShell title="Registrar reposición" accent="var(--c-brand)" icon={<RefreshCw className="w-5 h-5" />} onClose={onClose} locked={phase === "processing"}>
      {phase === "form" ? (
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Producto</label>
            <ProductSearchAutocomplete
              initialQuery={presetName}
              placeholder="Buscar producto por nombre…"
              clearOnSelect={false}
              limit={6}
              inputClassName={`w-full h-11 pl-11 pr-4 rounded-xl border bg-page text-sm focus:outline-none focus:ring-2 transition-colors ${showErr("product") ? "border-error focus:ring-error/30 focus:border-error" : "border-line focus:ring-brand/30 focus:border-brand"}`}
              onSelect={(p) => { setProductId(String(p.product_id)); setSelectedName(p.product_name); touch("product"); }}
              onQueryChange={() => { if (productId) { setProductId(""); setSelectedName(""); } }}
            />
            <ErrText msg={showErr("product")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL} htmlFor="rs-sede">Sede</label>
              <select id="rs-sede" value={sede} onChange={(e) => setSede(Number(e.target.value))} className={field(false)}>
                {sedes.map((s) => <option key={s.location_id} value={s.location_id}>{s.location_name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="rs-amount">Cantidad a reponer</label>
              <input id="rs-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={() => touch("amount")} className={field(!!showErr("amount"))} placeholder="0" />
              <ErrText msg={showErr("amount")} />
            </div>
          </div>

          <div>
            <label className={LABEL}>Fecha de reposición</label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-page border border-line rounded-xl text-sm text-muted">
              <CalendarDays className="w-4 h-4 text-brand" /> Hoy · {today}
            </div>
          </div>

          <div>
            <label className={LABEL} htmlFor="rs-motivo">Observación (opcional)</label>
            <textarea id="rs-motivo" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={field(false) + " resize-none"} placeholder="Ej: compra a proveedor, ajuste de inventario…" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={submit} disabled={!valid} className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
              <RefreshCw className="w-4 h-4" /> Confirmar reposición
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-page text-muted border border-line py-3 rounded-xl font-semibold hover:bg-line-2 transition-colors">Cancelar</button>
          </div>
        </div>
      ) : (
        <Feedback
          phase={phase} title="Reposición registrada"
          lines={[
            { label: "Producto", value: productName },
            { label: "Sede", value: nameOf(sede) },
            { label: "Cantidad", value: `+${amt} u.` },
            { label: "Fecha", value: today },
          ]}
          onDone={onDone}
        />
      )}
    </ModalShell>
  );
}
