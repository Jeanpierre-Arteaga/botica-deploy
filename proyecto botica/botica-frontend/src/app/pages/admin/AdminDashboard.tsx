import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import {
  AlertTriangle, TrendingUp, TrendingDown, ShoppingCart, Receipt, Clock,
  Package, PackageX, ArrowRight, ArrowUpRight, MapPin, RefreshCw,
  Banknote, CreditCard, ArrowLeftRight, Inbox, Wallet,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { api } from "../../lib/api";
import { useAdminScope } from "../../lib/AdminScopeContext";
import { formatLimaDate } from "../../lib/dates";
import type {
  DashboardSummary, SalesSeriesPoint, Order, InventoryItem, PaymentMethod, OrderState,
} from "../../lib/types";

// Paleta de series del gráfico (Ate primero → naranja; Santa Anita → azul).
const SERIES_PALETTE = ["var(--c-brand)", "var(--c-cool)", "var(--c-violet)", "var(--c-success)"];

const STATE_META: { key: keyof DashboardSummary["pedidos_por_estado"]; label: string; color: string }[] = [
  { key: "pendiente", label: "Pendiente", color: "var(--c-warning)" },
  { key: "en proceso", label: "En proceso", color: "var(--c-info)" },
  { key: "entregado", label: "Entregado", color: "var(--c-success)" },
  { key: "cancelado", label: "Cancelado", color: "var(--c-error)" },
];

interface ChartSeries {
  id: number;
  name: string;
  color: string;
  points: SalesSeriesPoint[];
  total: number;
}

export function AdminDashboard() {
  const { selectedLocationId, isBoth, scopeLabel, locations } = useAdminScope();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chart, setChart] = useState<ChartSeries[]>([]);
  const [recent, setRecent] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<InventoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const locParam = selectedLocationId ?? undefined;

      // Sedes para el gráfico: si "Ambas", una línea por sede; si una, solo esa.
      const chartSedes = isBoth
        ? locations
        : locations.filter((l) => l.location_id === selectedLocationId);

      // El gráfico se resuelve en paralelo. Si las sedes aún no cargaron,
      // cae a una sola serie combinada para evitar parpadeo en el primer render.
      const chartPromise = (async (): Promise<ChartSeries[]> => {
        if (chartSedes.length > 0) {
          const lists = await Promise.all(
            chartSedes.map((l) => api.orders.getSalesSeries(7, l.location_id).catch(() => null)),
          );
          return chartSedes.map((l, i) => {
            const points = lists[i]?.series ?? [];
            return {
              id: l.location_id,
              name: l.location_name,
              color: SERIES_PALETTE[i % SERIES_PALETTE.length],
              points,
              total: points.reduce((s, p) => s + p.ventas, 0),
            };
          });
        }
        const r = await api.orders.getSalesSeries(7, locParam).catch(() => null);
        const points = r?.series ?? [];
        return points.length
          ? [{ id: selectedLocationId ?? 0, name: scopeLabel, color: SERIES_PALETTE[0], points, total: points.reduce((s, p) => s + p.ventas, 0) }]
          : [];
      })();

      const [summaryRes, recentRes, alertsRes, builtSeries] = await Promise.all([
        api.dashboard.getSummary({ location_id: locParam }).catch(() => null),
        api.orders.getAll({ location_id: locParam }).catch(() => [] as Order[]),
        api.inventory.getLowStock().catch(() => [] as InventoryItem[]),
        chartPromise,
      ]);

      if (!summaryRes) setError(true);
      else setSummary(summaryRes);

      // Ventas recientes: últimas no canceladas, máx. 6.
      setRecent(recentRes.filter((o) => o.order_state !== "cancelado").slice(0, 6));

      // Alertas: filtra por sede activa (el endpoint trae todas), máx. 6.
      setAlerts(
        alertsRes.filter((it) => isBoth || it.location_id === selectedLocationId).slice(0, 6),
      );

      setChart(builtSeries);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLocationId, isBoth, locations, scopeLabel]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text">Resumen general</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1 font-medium text-text">
              <MapPin size={14} className="text-brand" />
              {scopeLabel}
            </span>
            <span className="text-faint">·</span>
            <span>{formatLimaDate()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            En vivo
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted shadow-soft hover:border-brand hover:text-brand transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Banner de stock crítico/bajo */}
      {!loading && summary && summary.stock.bajo_stock_count > 0 && (
        <Link
          to="/admin/stock"
          className="group animate-panel flex items-start gap-3 rounded-2xl border border-error/20 border-l-4 border-l-error bg-error-soft p-4 transition-colors hover:bg-error-soft/70"
        >
          <span className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-error" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-error font-semibold text-sm">
              {summary.stock.bajo_stock_count} producto
              {summary.stock.bajo_stock_count !== 1 ? "s" : ""} con stock crítico o bajo mínimo
            </p>
            <p className="text-error/80 text-xs mt-0.5">
              Requieren reposición en {scopeLabel.toLowerCase()} · ir a Control de Stock
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-error/70 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
        </Link>
      )}

      {/* Error global (summary no cargó) */}
      {!loading && error && !summary && (
        <ErrorState onRetry={handleRefresh} />
      )}

      {/* KPIs */}
      {loading ? (
        <KpiSkeletons />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          <KpiCard
            icon={Wallet}
            label="Ventas hoy"
            value={`S/ ${(summary?.hoy.ventas ?? 0).toFixed(2)}`}
            accent="var(--c-brand)"
            delta={summary?.hoy.ventas_vs_ayer_pct}
            index={0}
          />
          <KpiCard
            icon={Receipt}
            label="Transacciones"
            value={String(summary?.hoy.pedidos ?? 0)}
            accent="var(--c-cool)"
            delta={summary?.hoy.pedidos_vs_ayer_pct}
            index={1}
          />
          <KpiCard
            icon={Clock}
            label="Pedidos pendientes"
            value={String(summary?.hoy.pendientes ?? 0)}
            accent="var(--c-warning)"
            hint="Requieren atención"
            link="/admin/pedidos?state=pendiente"
            index={2}
          />
          <KpiCard
            icon={AlertTriangle}
            label="Alertas de stock"
            value={String(summary?.stock.bajo_stock_count ?? 0)}
            accent="var(--c-error)"
            hint="Bajo mínimo"
            link="/admin/stock"
            index={3}
          />
        </div>
      )}

      {/* Gráficos — grilla 2 filas: (gráfico | dona) y (ventas recientes | alertas).
          Cada fila estira sus celdas a la misma altura (items-stretch por defecto),
          así "Ventas recientes" y "Alertas de stock" quedan parejas y alineadas. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fila 1 */}
        {loading ? <div className="lg:col-span-2"><ChartSkeleton /></div> : <SalesChart series={chart} className="lg:col-span-2" />}
        {loading ? <DonutSkeleton /> : <OrdersDonut summary={summary} />}
        {/* Fila 2 */}
        {loading ? <div className="lg:col-span-2"><TableSkeleton /></div> : <RecentSalesCard orders={recent} className="lg:col-span-2" />}
        {loading ? (
          <AlertsSkeleton />
        ) : (
          <StockAlertsCard alerts={alerts} total={summary?.stock.bajo_stock_count ?? alerts.length} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// KPI Card (sin sparkline; barra de acento + delta discreto)
// ============================================================

interface KpiCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  accent: string;
  delta?: number;
  hint?: string;
  link?: string;
  index: number;
}

function KpiCard({ icon: Icon, label, value, accent, delta, hint, link, index }: KpiCardProps) {
  const content = (
    <div
      className="animate-panel group relative h-full overflow-hidden bg-surface rounded-2xl border border-line shadow-soft p-5 hover:shadow-card hover:-translate-y-0.5 transition-all"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="absolute left-0 top-0 h-full w-1 rounded-r" style={{ backgroundColor: accent }} />
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
        >
          <Icon size={22} />
        </div>
        {link && <ArrowUpRight size={18} className="text-faint group-hover:text-brand transition-colors" />}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">{label}</p>
      <p className="text-[26px] lg:text-[28px] leading-none font-bold text-text tabular-nums mb-2.5">{value}</p>
      {delta !== undefined ? (
        <div className="flex items-center gap-1.5">
          <DeltaBadge pct={delta} />
          <span className="text-xs text-faint">vs. ayer</span>
        </div>
      ) : (
        <p className="text-xs text-faint">{hint}</p>
      )}
    </div>
  );

  return link ? <Link to={link} className="block h-full">{content}</Link> : content;
}

function DeltaBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-md ${
        up ? "text-success bg-success-soft" : "text-error bg-error-soft"
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}{pct}%
    </span>
  );
}

// ============================================================
// Gráfico "Ventas por día" — una línea por sede
// ============================================================

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-PE", { weekday: "short", day: "2-digit" });
}
function formatDayLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long" });
}

// Hex equivalente de cada color de marca, para los stops del gradiente del
// área (los <stop> SVG no resuelven var(--…); el resto sí usa el token).
const SERIES_HEX: Record<string, string> = {
  "var(--c-brand)": "#F15A29",
  "var(--c-cool)": "#4C82A8",
  "var(--c-violet)": "#8B6FC9",
  "var(--c-success)": "#16A34A",
};

function SalesChart({ series, className = "" }: { series: ChartSeries[]; className?: string }) {
  const data = useMemo(() => {
    const allDates = Array.from(
      new Set(series.flatMap((s) => s.points.map((p) => p.date))),
    ).sort();
    return allDates.map((date) => {
      const row: Record<string, number | string> = { date, label: formatDay(date) };
      series.forEach((s) => {
        row[`s${s.id}`] = s.points.find((p) => p.date === date)?.ventas ?? 0;
      });
      return row;
    });
  }, [series]);

  const weekTotal = useMemo(() => series.reduce((sum, s) => sum + s.total, 0), [series]);
  const hasData = data.length > 0;
  const hasSales = weekTotal > 0;

  return (
    <section className={`animate-panel bg-surface rounded-2xl border border-line shadow-soft p-6 flex flex-col h-full ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-bold text-lg text-text">Ventas por día</h2>
          <p className="text-xs text-muted mt-0.5">Últimos 7 días · pedidos validados y entregados</p>
        </div>
        <div className="flex items-center gap-4">
          {series.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-muted font-medium">{s.name}</span>
            </div>
          ))}
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted leading-none">Total semana</p>
            <p className="text-lg font-bold text-text tabular-nums leading-tight mt-0.5">S/ {weekTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <ChartEmpty />
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 min-h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  {series.map((s) => {
                    const hex = SERIES_HEX[s.color] ?? "#F15A29";
                    return (
                      <linearGradient key={s.id} id={`adSalesFill-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={hex} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={hex} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" vertical={false} />
                <XAxis
                  dataKey="label" tick={{ fontSize: 12, fill: "var(--c-muted)" }}
                  axisLine={{ stroke: "var(--c-line)" }} tickLine={false} tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--c-muted)" }} axisLine={false} tickLine={false}
                  width={52} tickFormatter={(v) => `S/ ${v}`} allowDecimals={false}
                />
                <Tooltip content={<SalesTooltip series={series} />} cursor={{ stroke: "var(--c-brand)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                {series.map((s) => (
                  <Area
                    key={s.id} type="monotone" dataKey={`s${s.id}`} name={s.name}
                    stroke={s.color} strokeWidth={2.5} fill={`url(#adSalesFill-${s.id})`}
                    dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: s.color, stroke: "var(--c-surface)", strokeWidth: 2 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {!hasSales && (
            <p className="text-xs text-faint text-center mt-1">
              Aún no se registran ventas en los últimos 7 días.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function SalesTooltip({ active, payload, label, series }: any) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date as string;
  return (
    <div className="rounded-xl border border-line bg-surface shadow-card px-3 py-2.5">
      <p className="text-xs font-semibold text-text capitalize mb-1.5">{date ? formatDayLong(date) : label}</p>
      {payload.map((p: any) => {
        const s = series.find((x: ChartSeries) => `s${x.id}` === p.dataKey);
        return (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s?.color ?? p.color ?? p.stroke }} />
            <span className="text-muted">{s?.name ?? p.name}:</span>
            <span className="font-bold text-text tabular-nums">S/ {Number(p.value).toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 mb-2 rounded-2xl bg-page flex items-center justify-center">
        <TrendingUp size={24} className="text-faint" />
      </div>
      <p className="text-sm text-muted">No hay datos de ventas para mostrar</p>
    </div>
  );
}

// ============================================================
// Dona "Pedidos por estado" (del mes)
// ============================================================

function OrdersDonut({ summary }: { summary: DashboardSummary | null }) {
  const items = useMemo(
    () =>
      STATE_META.map((m) => ({
        label: m.label,
        color: m.color,
        count: summary?.pedidos_por_estado[m.key] ?? 0,
      })),
    [summary],
  );
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <section className="animate-panel bg-surface rounded-2xl border border-line shadow-soft p-6 flex flex-col h-full">
      <h2 className="font-bold text-lg text-text mb-1">Pedidos por estado</h2>
      <p className="text-xs text-muted mb-4">Distribución del mes</p>

      {total === 0 ? (
        <div className="flex-1 min-h-52 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 mb-2 rounded-2xl bg-page flex items-center justify-center">
            <Inbox size={24} className="text-faint" />
          </div>
          <p className="text-sm text-muted">Sin pedidos este mes</p>
        </div>
      ) : (
        <>
          <div className="relative flex-1 min-h-[13rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items} dataKey="count" nameKey="label"
                  cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={2} stroke="none"
                >
                  {items.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-text leading-none tabular-nums">{total}</span>
              <span className="text-xs text-muted mt-1">pedidos</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-4">
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted truncate">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-text tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function DonutTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-line bg-surface shadow-card px-3 py-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="text-muted">{item.name}:</span>
        <span className="font-bold text-text">{item.value}</span>
        <span className="text-faint">({pct}%)</span>
      </div>
    </div>
  );
}

// ============================================================
// Tabla "Ventas recientes" (patrón staff: tabla desktop + cards móvil)
// ============================================================

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

function RecentSalesCard({ orders, className = "" }: { orders: Order[]; className?: string }) {
  return (
    <section className={`animate-panel bg-surface rounded-2xl border border-line shadow-soft overflow-hidden flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between gap-3 p-5 border-b border-line">
        <div>
          <h2 className="font-bold text-lg text-text">Ventas recientes</h2>
          <p className="text-xs text-muted mt-0.5">Últimos movimientos del día</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success-soft px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          En vivo
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-2 flex items-center justify-center">
            <Receipt size={26} className="text-faint" />
          </div>
          <p className="font-semibold text-text">Sin ventas recientes</p>
          <p className="text-sm text-muted mt-0.5">Las ventas aparecerán aquí en tiempo real</p>
        </div>
      ) : (
        <div className="flex-1">
          {/* Desktop: tabla centrada (Producto/Atención separados y centrados) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[10%]" /><col className="w-[14%]" /><col className="w-[18%]" />
                <col className="w-[8%]" /><col className="w-[14%]" /><col className="w-[18%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="bg-surface-2 text-center text-[11px] font-semibold uppercase tracking-wider text-faint border-b border-line">
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Sede</th>
                  <th className="px-4 py-3">Atención</th>
                  <th className="px-4 py-3">Prod.</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.order_id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-center text-muted tabular-nums whitespace-nowrap">{fmtTime(o.order_date)}</td>
                    <td className="px-4 py-3 text-center"><SedeBadge name={o.location_name} /></td>
                    <td className="px-4 py-3 text-center">
                      <span className="block truncate text-text font-medium" title={o.employee_name || "Venta web"}>
                        {o.employee_name || <span className="text-muted font-normal">Venta web</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted tabular-nums">{o.detail_count ?? o.details?.length ?? 0}</td>
                    <td className="px-4 py-3 text-center font-bold text-text tabular-nums whitespace-nowrap">S/ {Number(o.total_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center"><PaymentBadge method={o.payment?.payment_method ?? null} /></td>
                    <td className="px-4 py-3 text-center"><StatusBadge state={o.order_state} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas */}
          <div className="md:hidden divide-y divide-line">
            {orders.map((o) => (
              <div key={o.order_id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-soft flex items-center justify-center">
                  <Receipt size={18} className="text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text text-sm truncate">{o.employee_name || "Venta web"}</span>
                    <SedeBadge name={o.location_name} />
                  </div>
                  <p className="text-xs text-muted mt-0.5 tabular-nums">
                    {fmtTime(o.order_date)} · {o.detail_count ?? o.details?.length ?? 0} prod.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-bold text-text tabular-nums">S/ {Number(o.total_price).toFixed(2)}</span>
                  <div className="flex items-center gap-1.5">
                    <PaymentBadge method={o.payment?.payment_method ?? null} />
                    <StatusBadge state={o.order_state} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pie: enlace a Pedidos Web (mismo estilo que el de Alertas de stock) */}
      <Link
        to="/admin/pedidos"
        className="flex items-center justify-center gap-1.5 p-4 border-t border-line text-sm font-semibold text-brand hover:gap-2.5 transition-all"
      >
        Ver más en Pedidos Web <ArrowRight size={14} />
      </Link>
    </section>
  );
}

function SedeBadge({ name }: { name?: string | null }) {
  if (!name) return <span className="text-xs text-faint">—</span>;
  const santa = /santa/i.test(name);
  // Etiqueta compacta para la tabla: "Botica Central Ate" → "Ate".
  const short = name.replace(/^Botica\s+Central\s+/i, "");
  return (
    <span
      title={name}
      className={`inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        santa ? "bg-cool-soft text-cool" : "bg-brand-soft text-brand"
      }`}
    >
      <MapPin size={11} className="shrink-0" />
      <span className="truncate">{short}</span>
    </span>
  );
}

const PAYMENT_META: Record<
  PaymentMethod,
  { label: string; cls: string; logo?: string; icon?: React.ComponentType<{ size?: number; className?: string }> }
> = {
  efectivo: { label: "Efectivo", cls: "bg-success-soft text-success", icon: Banknote },
  yape: { label: "Yape", cls: "bg-violet-soft text-violet", logo: "/payments/yape.png" },
  plin: { label: "Plin", cls: "bg-cool-soft text-cool", logo: "/payments/plin.png" },
  tarjeta: { label: "Tarjeta", cls: "bg-surface-2 text-ink-2", icon: CreditCard },
  transferencia: { label: "Transfer.", cls: "bg-info-soft text-info", icon: ArrowLeftRight },
};

function PaymentBadge({ method }: { method: PaymentMethod | null }) {
  if (!method || !PAYMENT_META[method]) {
    return <span className="text-xs text-faint">Sin pago</span>;
  }
  const m = PAYMENT_META[method];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${m.cls}`}>
      {m.logo ? (
        <img src={m.logo} alt="" className="w-3.5 h-3.5 rounded-sm object-contain" />
      ) : Icon ? (
        <Icon size={12} />
      ) : null}
      {m.label}
    </span>
  );
}

// Badge de estado del pedido. Mismos colores que la leyenda de la dona
// "Pedidos por estado" (STATE_META): pendiente=ámbar, en proceso=azul,
// entregado=verde, cancelado=rojo. Deja ver de un vistazo si el pedido ya
// cuenta como venta ('en proceso'/'entregado') o todavía no ('pendiente').
const STATUS_META: Record<OrderState, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: "bg-warning-soft text-warning" },
  "en proceso": { label: "En proceso", cls: "bg-info-soft text-info" },
  entregado: { label: "Entregado", cls: "bg-success-soft text-success" },
  cancelado: { label: "Cancelado", cls: "bg-error-soft text-error" },
};

function StatusBadge({ state }: { state: OrderState }) {
  const m = STATUS_META[state] ?? { label: state, cls: "bg-surface-2 text-muted" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${m.cls}`}>
      {m.label}
    </span>
  );
}

// ============================================================
// Panel "Alertas de stock" con miniatura real del producto
// ============================================================

function StockAlertsCard({ alerts, total }: { alerts: InventoryItem[]; total: number }) {
  return (
    <section className="animate-panel bg-surface rounded-2xl border border-line shadow-soft p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-text">Alertas de stock</h2>
        {total > 0 && (
          <span className="bg-error-soft text-error text-xs font-bold px-2.5 py-1 rounded-full">{total}</span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-success-soft flex items-center justify-center">
            <Package size={24} className="text-success" />
          </div>
          <p className="text-sm font-semibold text-text">Stock en orden</p>
          <p className="text-xs text-muted mt-0.5">No hay productos bajo mínimo</p>
        </div>
      ) : (
        <>
        <div className="flex-1 space-y-2.5">
          {alerts.map((it) => {
            const critical = it.current_stock <= Math.ceil(it.min_stock / 2);
            const pct = it.min_stock > 0 ? Math.min(100, Math.round((it.current_stock / it.min_stock) * 100)) : 0;
            return (
              <Link
                key={it.inventory_id}
                to="/admin/stock"
                className="group flex items-center gap-3 p-2.5 rounded-xl border border-line hover:border-brand hover:bg-page transition-all"
              >
                <Thumb src={it.image_url} alt={it.product_name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text truncate">{it.product_name ?? "Producto"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={11} className="text-faint shrink-0" />
                    <span className="text-xs text-muted truncate">{it.location_name ?? "—"}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-line-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: critical ? "var(--c-error)" : "var(--c-warning)" }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${critical ? "bg-error-soft text-error" : "bg-warning-soft text-warning"}`}>
                    {critical ? "Crítico" : "Bajo"}
                  </span>
                  <p className="text-xs text-muted mt-1 tabular-nums">
                    <span className={`font-bold ${critical ? "text-error" : "text-warning"}`}>{it.current_stock}</span>
                    {" / "}{it.min_stock}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        <Link
          to="/admin/stock"
          className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-line text-sm font-semibold text-brand hover:gap-2.5 transition-all"
        >
          {total > alerts.length ? `Ver ${total - alerts.length} más en Control de Stock` : "Ver Control de Stock"}
          <ArrowRight size={14} />
        </Link>
        </>
      )}
    </section>
  );
}

function Thumb({ src, alt }: { src?: string | null; alt?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-11 h-11 shrink-0 rounded-lg bg-surface-2 flex items-center justify-center">
        <PackageX size={18} className="text-faint" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt ?? ""}
      onError={() => setFailed(true)}
      className="w-11 h-11 shrink-0 rounded-lg object-cover border border-line"
    />
  );
}

// ============================================================
// Estados de carga / error
// ============================================================

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-surface rounded-2xl border border-line shadow-soft p-8 text-center">
      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-error-soft flex items-center justify-center">
        <AlertTriangle size={28} className="text-error" />
      </div>
      <p className="font-semibold text-text">No se pudo cargar el resumen</p>
      <p className="text-sm text-muted mt-0.5 mb-4">Revisa tu conexión e inténtalo de nuevo.</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-hover transition-colors"
      >
        <RefreshCw size={16} /> Reintentar
      </button>
    </div>
  );
}

function Skel({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-line-2 rounded ${className}`} />;
}

function KpiSkeletons() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-surface rounded-2xl border border-line shadow-soft p-5">
          <Skel className="w-11 h-11 rounded-xl mb-4" />
          <Skel className="h-3 w-20 mb-3" />
          <Skel className="h-7 w-24 mb-3" />
          <Skel className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-line shadow-soft p-6">
      <Skel className="h-5 w-40 mb-2" />
      <Skel className="h-3 w-56 mb-6" />
      <Skel className="h-[260px] w-full rounded-xl" />
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-line shadow-soft p-6">
      <Skel className="h-5 w-40 mb-2" />
      <Skel className="h-3 w-32 mb-6" />
      <div className="flex justify-center"><Skel className="w-40 h-40 rounded-full" /></div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-line shadow-soft p-6">
      <Skel className="h-5 w-40 mb-5" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => <Skel key={i} className="h-10 w-full" />)}
      </div>
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-line shadow-soft p-6">
      <Skel className="h-5 w-36 mb-5" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skel className="w-11 h-11 rounded-lg" />
            <div className="flex-1"><Skel className="h-3 w-32 mb-2" /><Skel className="h-2 w-20" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
