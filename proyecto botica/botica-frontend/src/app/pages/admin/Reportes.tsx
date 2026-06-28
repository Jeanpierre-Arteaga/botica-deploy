import { Download, Calendar, TrendingUp, TrendingDown, Package, DollarSign, Receipt, Wallet } from "lucide-react";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export function Reportes() {
  const [dateRange, setDateRange] = useState("week");
  const [selectedBranch, setSelectedBranch] = useState<"both" | "ate" | "santa-anita">("both");

  const salesData = [
    { day: "Lun 14", ate: 1250, santaAnita: 1480, total: 2730 },
    { day: "Mar 15", ate: 1420, santaAnita: 1350, total: 2770 },
    { day: "Mié 16", ate: 1380, santaAnita: 1590, total: 2970 },
    { day: "Jue 17", ate: 1520, santaAnita: 1420, total: 2940 },
    { day: "Vie 18", ate: 1680, santaAnita: 1750, total: 3430 },
    { day: "Sáb 19", ate: 1890, santaAnita: 2100, total: 3990 },
    { day: "Dom 20", ate: 1650, santaAnita: 1820, total: 3470 },
  ];

  const topProducts = [
    { name: "Paracetamol 500mg", category: "Analgésicos", sold: 145, revenue: 1232.50, trend: "+12%" },
    { name: "Ibuprofeno 400mg", category: "Analgésicos", sold: 98, revenue: 1176.00, trend: "+8%" },
    { name: "Vitamina C 1000mg", category: "Vitaminas", sold: 87, revenue: 1609.50, trend: "+15%" },
    { name: "Omeprazol 20mg", category: "Gastroenterología", sold: 76, revenue: 1140.00, trend: "+5%" },
    { name: "Amoxicilina 500mg", category: "Antibióticos", sold: 65, revenue: 1618.50, trend: "-3%" },
  ];

  const categoryPerformance = [
    { category: "Analgésicos", sales: 4850, percentage: 28, color: "var(--c-brand)" },
    { category: "Vitaminas", sales: 3920, percentage: 23, color: "var(--c-success)" },
    { category: "Antibióticos", sales: 3150, percentage: 18, color: "var(--c-cool)" },
    { category: "Gastroenterología", sales: 2680, percentage: 16, color: "var(--c-warning)" },
    { category: "Otros", sales: 2550, percentage: 15, color: "var(--c-faint)" },
  ];

  const totalWeekSales = salesData.reduce((sum, d) => sum + d.total, 0);
  const avgDailySales = totalWeekSales / salesData.length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Reportes de Ventas y Rotación</h1>
          <p className="text-sm text-muted">Análisis de rendimiento y estadísticas de ventas</p>
        </div>
        <button className="flex items-center gap-2 bg-brand text-white px-5 py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors">
          <Download className="w-5 h-5" />
          Exportar Reporte
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted" />
              <span className="text-sm font-semibold text-muted">Periodo:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange("today")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateRange === "today"
                    ? "bg-brand text-white"
                    : "bg-line-2 text-muted hover:bg-line"
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setDateRange("week")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateRange === "week"
                    ? "bg-brand text-white"
                    : "bg-line-2 text-muted hover:bg-line"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setDateRange("month")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateRange === "month"
                    ? "bg-brand text-white"
                    : "bg-line-2 text-muted hover:bg-line"
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setDateRange("custom")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateRange === "custom"
                    ? "bg-brand text-white"
                    : "bg-line-2 text-muted hover:bg-line"
                }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted">Sede:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value as any)}
              className="px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="both">Ambas sedes</option>
              <option value="ate">Ate</option>
              <option value="santa-anita">Santa Anita</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <ReportKpi
          icon={Wallet} label="Ventas totales"
          value={`S/ ${totalWeekSales.toFixed(2)}`}
          accent="var(--c-brand)" change="+18%" trend="up" index={0}
        />
        <ReportKpi
          icon={DollarSign} label="Promedio diario"
          value={`S/ ${avgDailySales.toFixed(2)}`}
          accent="var(--c-cool)" change="+12%" trend="up" index={1}
        />
        <ReportKpi
          icon={Package} label="Productos vendidos"
          value="471"
          accent="var(--c-success)" change="+8%" trend="up" index={2}
        />
        <ReportKpi
          icon={Receipt} label="Ticket promedio"
          value="S/ 45.30"
          accent="var(--c-warning)" change="+5%" trend="up" index={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Sales Chart - 2/3 width */}
        <div className="col-span-2 bg-surface rounded-2xl shadow-soft border border-line p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-text">Evolución de Ventas — Última Semana</h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand"></div>
                <span className="text-muted">Ate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cool"></div>
                <span className="text-muted">Santa Anita</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" vertical={false} />
                <XAxis
                  dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fill: "var(--c-muted)", fontSize: 12 }} dy={8}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: "var(--c-faint)", fontSize: 11 }}
                  tickFormatter={(v) => `S/${v / 1000}k`} width={48}
                />
                <Tooltip content={<ReportTooltip />} cursor={{ fill: "var(--c-line-2)", opacity: 0.5 }} />
                <Bar dataKey="ate" name="Ate" fill="var(--c-brand)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Bar dataKey="santaAnita" name="Santa Anita" fill="var(--c-cool)" radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance - 1/3 width */}
        <div className="bg-surface rounded-2xl shadow-soft border border-line p-6">
          <h2 className="font-bold text-lg text-text mb-6">Ventas por Categoría</h2>
          <div className="space-y-4">
            {categoryPerformance.map((cat, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    ></div>
                    <span className="text-sm font-medium text-muted">{cat.category}</span>
                  </div>
                  <span className="text-sm font-bold text-text">S/ {cat.sales}</span>
                </div>
                <div className="w-full bg-line rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line mt-6 overflow-hidden">
        <div className="p-5 border-b border-line">
          <h2 className="font-bold text-lg text-text">Productos Más Vendidos</h2>
          <p className="text-xs text-muted mt-0.5">Ranking por unidades de la última semana</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-page border-b border-line">
              <tr>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">#</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Producto</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Categoría</th>
                <th className="px-6 py-3.5 text-center text-[11px] font-semibold text-muted uppercase tracking-wide">Unidades vendidas</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Ingresos</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={index} className="border-b border-line-2 hover:bg-page transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-faint tabular-nums">#{index + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-sm text-text">{product.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{product.category}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-text">{product.sold}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-brand">S/ {product.revenue.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {product.trend.startsWith("+") ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-success" />
                          <span className="text-sm font-semibold text-success">{product.trend}</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 text-error rotate-180" />
                          <span className="text-sm font-semibold text-error">{product.trend}</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---- KPI premium coherente con AdminDashboard ---- */
function ReportKpi({
  icon: Icon, label, value, accent, change, trend, index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
  change: string;
  trend: "up" | "down";
  index: number;
}) {
  return (
    <div
      className="animate-panel group bg-surface rounded-2xl shadow-soft hover:shadow-card border border-line p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
        >
          <Icon className="w-[22px] h-[22px]" />
        </div>
      </div>
      <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-[26px] lg:text-[28px] leading-none font-bold text-text tabular-nums mb-2.5">{value}</p>
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-md ${
            trend === "up" ? "text-success bg-success-soft" : "text-error bg-error-soft"
          }`}
        >
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
        <span className="text-xs text-faint">vs. anterior</span>
      </div>
    </div>
  );
}

/* ---- Tooltip de marca para recharts ---- */
function ReportTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-2 text-white rounded-lg shadow-pop px-3 py-2.5 border border-white/10">
      <p className="text-xs font-semibold mb-1.5 text-slate-300">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold tabular-nums">S/ {p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
