import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download, TrendingUp, TrendingDown, Package, Wallet, Receipt, Coins,
  MapPin, AlertTriangle, RefreshCw, Loader2, BarChart3, Activity, Sparkles, CalendarRange, Layers, Package2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { api, ApiError } from "../../lib/api";
import { useAdminScope } from "../../lib/AdminScopeContext";
import { todayInLima, addDaysISO, daysInclusive } from "../../lib/dates";
import { Segmented } from "../../components/Segmented";
import type { SalesReport } from "../../lib/types";

type Period = "today" | "week" | "month" | "custom";

const CAT_COLORS = ["var(--c-brand)", "var(--c-cool)", "var(--c-success)", "var(--c-warning)", "var(--c-violet)", "var(--c-faint)"];
// Equivalentes HEX (los <stop> de gradiente SVG de recharts no resuelven var(--…)).
const EVO_COLORS = ["#F15A29", "#4C82A8", "#16A34A", "#F59E0B", "#8B6FC9"];
const pct = (a: number, b: number) => (!b ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100));

export function Reportes() {
  const { selectedLocationId, scopeLabel } = useAdminScope();
  const today = todayInLima();

  const [period, setPeriod] = useState<Period>("week");
  const [customFrom, setCustomFrom] = useState(addDaysISO(today, -6));
  const [customTo, setCustomTo] = useState(today);

  const { from, to } = useMemo(() => {
    if (period === "today") return { from: today, to: today };
    if (period === "week") return { from: addDaysISO(today, -6), to: today };
    if (period === "month") return { from: addDaysISO(today, -29), to: today };
    const f = customFrom || addDaysISO(today, -6);
    const t = customTo || today;
    return f <= t ? { from: f, to: t } : { from: t, to: f };
  }, [period, customFrom, customTo, today]);

  const lenDays = Math.max(1, daysInclusive(from, to));
  const prevTo = addDaysISO(from, -1);
  const prevFrom = addDaysISO(prevTo, -(lenDays - 1));

  const [report, setReport] = useState<SalesReport | null>(null);
  const [prev, setPrev] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const loc = selectedLocationId ?? undefined;
      const [cur, pre] = await Promise.all([
        api.reports.getSales({ date_from: from, date_to: to, location_id: loc }),
        api.reports.getSales({ date_from: prevFrom, date_to: prevTo, location_id: loc }).catch(() => null),
      ]);
      setReport(cur);
      setPrev(pre);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [from, to, prevFrom, prevTo, selectedLocationId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await api.reports.exportExcel({ date_from: from, date_to: to, location_id: selectedLocationId ?? undefined });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Reporte exportado a Excel.");
    } catch (err) {
      const msg = err instanceof ApiError ? (err.body as { message?: string })?.message || err.message : "No se pudo exportar el reporte.";
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const avgDaily = (report?.totalSales ?? 0) / lenDays;
  const prevAvgDaily = (prev?.totalSales ?? 0) / Math.max(1, daysInclusive(prevFrom, prevTo));

  // Mapa de unidades del período anterior por producto (para la tendencia).
  const prevQty = useMemo(() => {
    const m = new Map<number, number>();
    prev?.topProducts.forEach((p) => m.set(p.product_id, p.quantity_sold));
    return m;
  }, [prev]);

  const catTotal = report?.byCategory.reduce((s, c) => s + c.total, 0) ?? 0;

  // Etiqueta legible del período (para la card "Ventas por categoría").
  const periodLabel =
    period === "today" ? "Hoy"
      : period === "week" ? "Última semana"
        : period === "month" ? "Último mes"
          : `${from} – ${to}`;

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text mb-1">Ventas y Rotación</h1>
          <p className="inline-flex items-center gap-1 text-sm text-muted">
            Análisis de rendimiento ·
            <span className="inline-flex items-center gap-1 font-medium text-text">
              <MapPin size={13} className="text-brand" /> {scopeLabel}
            </span>
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading || !report}
          className="inline-flex items-center justify-center gap-2 bg-brand text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {exporting ? "Generando…" : "Exportar Reporte"}
        </button>
      </div>

      {/* Filtros: período (+ rango personalizado) */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line p-3 sm:p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-muted">Período:</span>
          <Segmented
            ariaLabel="Período"
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            options={[
              { value: "today", label: "Hoy" },
              { value: "week", label: "Semana" },
              { value: "month", label: "Mes" },
              { value: "custom", label: "Personalizado" },
            ]}
          />
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} max={today} onChange={(e) => setCustomFrom(e.target.value)} className="h-10 px-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
              <span className="text-muted text-sm">a</span>
              <input type="date" value={customTo} max={today} onChange={(e) => setCustomTo(e.target.value)} className="h-10 px-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
            </div>
          )}
          <span className="ml-auto text-xs text-muted tabular-nums">{from} → {to}</span>
        </div>
      </div>

      {error && !report ? (
        <div className="bg-surface rounded-2xl shadow-soft border border-line p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">No se pudo cargar el reporte</h3>
          <p className="text-sm text-muted mb-5">Revisa tu conexión e inténtalo de nuevo.</p>
          <button onClick={() => { setLoading(true); load(); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover transition-colors">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          {loading ? (
            <KpiSkeletons />
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
              <ReportKpi icon={Wallet} label="Ventas totales" value={`S/ ${(report?.totalSales ?? 0).toFixed(2)}`} accent="var(--c-brand)" delta={pct(report?.totalSales ?? 0, prev?.totalSales ?? 0)} index={0} />
              <ReportKpi icon={Coins} label="Promedio diario" value={`S/ ${avgDaily.toFixed(2)}`} accent="var(--c-cool)" delta={pct(avgDaily, prevAvgDaily)} index={1} />
              <ReportKpi icon={Package} label="Productos vendidos" value={String(report?.totalUnits ?? 0)} accent="var(--c-success)" delta={pct(report?.totalUnits ?? 0, prev?.totalUnits ?? 0)} index={2} />
              <ReportKpi icon={Receipt} label="Ticket promedio" value={`S/ ${(report?.averageTicket ?? 0).toFixed(2)}`} accent="var(--c-warning)" delta={pct(report?.averageTicket ?? 0, prev?.averageTicket ?? 0)} index={3} />
            </div>
          )}

          {/* Gráfico de evolución por categoría (2/3) + Ventas por categoría (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {loading || !report ? <ChartSkeleton /> : <CategoryEvolutionChart report={report} from={from} to={to} className="lg:col-span-2" />}
            {loading ? <CatSkeleton /> : <CategoryCard items={report?.byCategory ?? []} total={catTotal} periodLabel={periodLabel} />}
          </div>

          {/* Ranking de productos más vendidos */}
          {loading ? <TableSkeleton /> : <TopProductsTable items={report?.topProducts ?? []} prevQty={prevQty} />}
        </>
      )}
    </div>
  );
}

// ============================================================
// KPI card con delta
// ============================================================

function ReportKpi({ icon: Icon, label, value, accent, delta, index }: {
  icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; accent: string; delta: number; index: number;
}) {
  const up = delta >= 0;
  return (
    <div className="animate-panel relative h-full overflow-hidden bg-surface rounded-2xl border border-line shadow-soft p-5 hover:shadow-card hover:-translate-y-0.5 transition-all" style={{ animationDelay: `${index * 60}ms` }}>
      <span className="absolute left-0 top-0 h-full w-1 rounded-r" style={{ backgroundColor: accent }} />
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}>
        <Icon size={22} />
      </div>
      <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-[26px] lg:text-[28px] leading-none font-bold text-text tabular-nums mb-2.5">{value}</p>
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-md ${up ? "text-success bg-success-soft" : "text-error bg-error-soft"}`}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{up ? "+" : ""}{delta}%
        </span>
        <span className="text-xs text-faint">vs. período anterior</span>
      </div>
    </div>
  );
}

// ============================================================
// Gráfico de EVOLUCIÓN por categoría (área multi-serie)
// ============================================================
// Muestra cómo evolucionan las ventas diarias de las principales categorías a
// lo largo del período (tendencia / rotación). NO es un ranking: cada serie es
// una categoría con su área degradada y línea suave.

function CategoryEvolutionChart({ report, from, to, className = "" }: {
  report: SalesReport; from: string; to: string; className?: string;
}) {
  // Filtro: null = todas las categorías; o el key de UNA serie aislada.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Al cambiar período/sede, se reinicia a "Todas" (los keys son posicionales).
  useEffect(() => { setActiveKey(null); }, [from, to, report]);

  const { data, series } = useMemo(() => {
    // Eje X: todos los días del período (incluye días sin ventas).
    const dates: string[] = [];
    for (let d = from; d <= to; d = addDaysISO(d, 1)) {
      dates.push(d);
      if (dates.length > 120) break; // tope de seguridad
    }
    // Top 5 categorías por ingresos del período (mayor → menor).
    const topCats = [...report.byCategory].sort((a, b) => b.total - a.total).slice(0, 5);
    const series = topCats.map((c, i) => ({
      key: `s${i}`,
      name: c.category_name,
      color: EVO_COLORS[i % EVO_COLORS.length],
      total: c.total,
    }));
    // Mapa fecha → (categoría → total).
    const byDate = new Map<string, Map<string, number>>();
    report.byDayCategory?.forEach((r) => {
      if (!byDate.has(r.date)) byDate.set(r.date, new Map());
      const m = byDate.get(r.date)!;
      m.set(r.category_name, (m.get(r.category_name) ?? 0) + r.total);
    });
    const data = dates.map((d) => {
      const row: Record<string, number | string> = { date: d, label: d.slice(5).replace("-", "/") };
      const dm = byDate.get(d);
      topCats.forEach((c, i) => { row[`s${i}`] = dm?.get(c.category_name) ?? 0; });
      return row;
    });
    return { data, series };
  }, [report, from, to]);

  const hasData = series.length > 0 && report.byCategory.some((c) => c.total > 0);
  const tooFewDays = data.length < 2;

  // Series a dibujar. Aislada = solo una; todas = pintamos de mayor a menor
  // total para que las pequeñas queden ENCIMA (mejor z-order y legibilidad).
  const single = activeKey ? series.find((s) => s.key === activeKey) : null;
  const drawn = single ? [single] : series;

  return (
    <section className={`animate-panel bg-surface rounded-2xl border border-line shadow-soft p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Activity size={18} className="text-brand" />
        <h2 className="font-bold text-lg text-text">Evolución por categoría</h2>
      </div>
      <p className="text-xs text-muted mb-4">Ventas diarias de las principales categorías · tendencia del período</p>

      {!hasData ? (
        <div className="h-[300px] flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 mb-2 rounded-2xl bg-page flex items-center justify-center"><BarChart3 size={24} className="text-faint" /></div>
          <p className="text-sm text-muted">Sin ventas en el período</p>
        </div>
      ) : tooFewDays ? (
        <div className="h-[300px] flex flex-col items-center justify-center text-center px-6">
          <div className="w-12 h-12 mb-3 rounded-2xl bg-brand-soft flex items-center justify-center"><CalendarRange size={24} className="text-brand" /></div>
          <p className="text-sm font-semibold text-text">La evolución se aprecia mejor en varios días</p>
          <p className="text-sm text-muted mt-1">Cambia el período a <span className="font-medium text-text">Semana</span> o <span className="font-medium text-text">Mes</span> para ver la tendencia por categoría.</p>
        </div>
      ) : (
        <>
          {/* Leyenda interactiva = filtro. "Todas" + un chip por categoría;
              clic en una la AÍSLA, clic de nuevo (o en "Todas") vuelve a todas. */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => setActiveKey(null)}
              aria-pressed={activeKey === null}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${activeKey === null ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:text-text hover:border-line-2"}`}
            >
              <Layers className="w-3 h-3" /> Todas
            </button>
            {series.map((s) => {
              const on = activeKey === s.key;
              const dim = activeKey !== null && !on;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveKey(on ? null : s.key)}
                  aria-pressed={on}
                  title={dim ? `Aislar ${s.name}` : on ? "Ver todas" : `Aislar ${s.name}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${on ? "border-line-2 bg-page text-text shadow-soft" : "border-line text-muted hover:text-text hover:border-line-2"} ${dim ? "opacity-45" : ""}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="max-w-[150px] truncate">{s.name}</span>
                </button>
              );
            })}
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  {series.map((s) => (
                    <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={single ? 0.26 : 0.14} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--c-faint)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={26} />
                {/* Escala raíz: comprime el pico dominante sin invertir el orden,
                    así las categorías pequeñas no se aplastan contra el eje. */}
                <YAxis scale="sqrt" domain={[0, "auto"]} tick={{ fontSize: 11, fill: "var(--c-faint)" }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => `S/ ${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`} />
                <Tooltip content={<EvolutionTooltip />} cursor={{ stroke: "var(--c-line)", strokeWidth: 1 }} />
                {drawn.map((s) => (
                  <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.25} fill={`url(#grad-${s.key})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}

function EvolutionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const rows = payload
    .map((p: any) => ({ name: p.name as string, value: Number(p.value), color: p.color || p.stroke || p.fill }))
    .filter((r: any) => r.value > 0)
    .sort((a: any, b: any) => b.value - a.value);
  const total = payload.reduce((s: number, p: any) => s + Number(p.value), 0);
  return (
    <div className="rounded-xl border border-line bg-surface shadow-card px-3 py-2.5 min-w-[190px]">
      <p className="text-xs font-semibold text-text mb-1.5">{label}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted">Sin ventas</p>
      ) : (
        rows.map((r: any) => (
          <div key={r.name} className="flex items-center justify-between gap-3 text-xs py-0.5">
            <span className="inline-flex items-center gap-1.5 text-muted min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
              <span className="truncate max-w-[120px]">{r.name}</span>
            </span>
            <span className="font-semibold text-text tabular-nums shrink-0">S/ {r.value.toFixed(2)}</span>
          </div>
        ))
      )}
      <div className="flex items-center justify-between gap-3 text-xs mt-1.5 pt-1.5 border-t border-line">
        <span className="text-faint">Total del día</span>
        <span className="font-bold text-brand tabular-nums">S/ {total.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ============================================================
// Ventas por categoría (lista con barras)
// ============================================================

function CategoryCard({ items, total, periodLabel }: { items: SalesReport["byCategory"]; total: number; periodLabel: string }) {
  return (
    <section className="animate-panel bg-surface rounded-2xl border border-line shadow-soft p-6">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-cool" />
          <h2 className="font-bold text-lg text-text">Ventas por categoría</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-page border border-line px-2.5 py-1 text-[11px] font-semibold text-muted whitespace-nowrap">
          <CalendarRange className="w-3 h-3 text-cool" /> {periodLabel}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted">Sin datos en el período</div>
      ) : (
        <div className="space-y-3.5">
          {items.slice(0, 7).map((c, i) => {
            const p = total > 0 ? Math.round((c.total / total) * 100) : 0;
            const color = CAT_COLORS[i % CAT_COLORS.length];
            return (
              <div key={c.category_id ?? c.category_name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium text-muted truncate">{c.category_name}</span>
                  </div>
                  <span className="text-sm font-bold text-text tabular-nums shrink-0">S/ {c.total.toFixed(2)}</span>
                </div>
                <div className="w-full bg-line-2 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${p}%`, backgroundColor: color }} />
                </div>
                <p className="text-[11px] text-faint mt-1 tabular-nums">{p}% · {c.count} pedido{c.count !== 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ============================================================
// Tabla: Productos más vendidos (ranking, centrado)
// ============================================================

function TopProductsTable({ items, prevQty }: { items: SalesReport["topProducts"]; prevQty: Map<number, number> }) {
  const rows = items.slice(0, 10); // Top 10
  return (
    <section className="animate-panel bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
      <div className="p-5 border-b border-line">
        <h2 className="font-bold text-lg text-text">Productos más vendidos</h2>
        <p className="text-xs text-muted mt-0.5">Top 10 por unidades del período</p>
      </div>

      {rows.length === 0 ? (
        <div className="p-12 text-center">
          <Package className="w-12 h-12 text-faint mx-auto mb-3" />
          <p className="font-semibold text-text">Sin ventas en el período</p>
          <p className="text-sm text-muted mt-0.5">Prueba con otro período o sede.</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[7%]" /><col className="w-[34%]" /><col className="w-[19%]" />
                <col className="w-[13%]" /><col className="w-[15%]" /><col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="bg-surface-2 text-center text-[11px] font-semibold uppercase tracking-wider text-faint border-b border-line">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Unidades</th>
                  <th className="px-4 py-3">Ingresos</th>
                  <th className="px-4 py-3">Tendencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((p, i) => (
                  <tr key={p.product_id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-center"><RankBadge rank={i + 1} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <ProductThumb url={p.image_url} />
                        <span className="font-semibold text-text truncate" title={p.product_name}>{p.product_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-muted truncate">{p.category_name || "—"}</td>
                    <td className="px-4 py-3 text-center font-bold text-text tabular-nums">{p.quantity_sold}</td>
                    <td className="px-4 py-3 text-center font-bold text-brand tabular-nums whitespace-nowrap">S/ {p.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center"><TrendBadge cur={p.quantity_sold} prev={prevQty.get(p.product_id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil */}
          <div className="md:hidden divide-y divide-line">
            {rows.map((p, i) => (
              <div key={p.product_id} className="flex items-center gap-3 p-4">
                <RankBadge rank={i + 1} />
                <ProductThumb url={p.image_url} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-text truncate">{p.product_name}</p>
                  <p className="text-xs text-muted truncate">{p.category_name || "—"} · {p.quantity_sold} u.</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-bold text-brand tabular-nums text-sm">S/ {p.total.toFixed(2)}</span>
                  <TrendBadge cur={p.quantity_sold} prev={prevQty.get(p.product_id)} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// Miniatura del producto (imagen principal o placeholder), estilo de las
// demás tablas del panel.
function ProductThumb({ url }: { url?: string | null }) {
  return url ? (
    <img src={url} alt="" loading="lazy" className="w-9 h-9 rounded-lg object-cover border border-line bg-page shrink-0" />
  ) : (
    <span className="w-9 h-9 rounded-lg bg-page border border-line flex items-center justify-center shrink-0">
      <Package2 className="w-4 h-4 text-faint" />
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const top = rank <= 3;
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold tabular-nums ${top ? "bg-brand-soft text-brand" : "bg-surface-2 text-muted"}`}>{rank}</span>
  );
}

function TrendBadge({ cur, prev }: { cur: number; prev?: number }) {
  if (prev == null) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-info-soft text-info">Nuevo</span>;
  }
  const d = pct(cur, prev);
  const up = d >= 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${up ? "bg-success-soft text-success" : "bg-error-soft text-error"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{up ? "+" : ""}{d}%
    </span>
  );
}

// ============================================================
// Skeletons
// ============================================================

const Skel = ({ className = "" }: { className?: string }) => <div className={`animate-pulse bg-line-2 rounded ${className}`} />;

function KpiSkeletons() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-surface rounded-2xl border border-line shadow-soft p-5">
          <Skel className="w-11 h-11 rounded-xl mb-4" /><Skel className="h-3 w-20 mb-3" /><Skel className="h-7 w-24 mb-3" /><Skel className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}
function ChartSkeleton() {
  return <div className="lg:col-span-2 bg-surface rounded-2xl border border-line shadow-soft p-6"><Skel className="h-5 w-52 mb-2" /><Skel className="h-3 w-64 mb-6" /><Skel className="h-[360px] w-full rounded-xl" /></div>;
}
function CatSkeleton() {
  return <div className="bg-surface rounded-2xl border border-line shadow-soft p-6"><Skel className="h-5 w-40 mb-5" /><div className="space-y-4">{[0, 1, 2, 3, 4].map((i) => <Skel key={i} className="h-9 w-full" />)}</div></div>;
}
function TableSkeleton() {
  return <div className="bg-surface rounded-2xl border border-line shadow-soft p-6"><Skel className="h-5 w-44 mb-5" /><div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skel key={i} className="h-10 w-full" />)}</div></div>;
}
