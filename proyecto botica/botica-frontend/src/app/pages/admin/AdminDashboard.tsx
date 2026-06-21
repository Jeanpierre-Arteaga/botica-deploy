import { AlertTriangle, TrendingUp, TrendingDown, ShoppingCart, Package, Receipt, Clock, Bell } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Line, LineChart,
} from "recharts";
import yapeIcon from "../../../imports/image-3.png";

export function AdminDashboard() {
  const kpis = [
    {
      label: "Ventas hoy", value: "S/ 8,450.00", change: "+12%", trend: "up",
      color: "#F15A29", icon: ShoppingCart,
      spark: [5800, 6100, 5900, 6800, 7200, 7100, 8450],
    },
    {
      label: "Transacciones", value: "47", change: "+8%", trend: "up",
      color: "#4C82A8", icon: Receipt,
      spark: [32, 38, 35, 41, 39, 44, 47],
    },
    {
      label: "Pedidos pendientes", value: "12", change: "-3%", trend: "down",
      color: "#F59E0B", icon: Clock,
      spark: [18, 16, 17, 15, 14, 13, 12],
    },
    {
      label: "Alertas de stock", value: "8", change: "+2", trend: "warning",
      color: "#DC2626", icon: AlertTriangle,
      spark: [4, 5, 5, 6, 6, 7, 8],
    },
  ];

  const recentSales = [
    { time: "16:45", branch: "Santa Anita", worker: "Ana Torres", products: 3, total: 145.50, method: "Yape" },
    { time: "16:32", branch: "Ate", worker: "Carlos Quispe", products: 2, total: 89.00, method: "Efectivo" },
    { time: "16:18", branch: "Santa Anita", worker: "Ana Torres", products: 5, total: 234.80, method: "Yape" },
    { time: "16:05", branch: "Ate", worker: "Carlos Quispe", products: 1, total: 45.00, method: "Efectivo" },
    { time: "15:50", branch: "Santa Anita", worker: "Ana Torres", products: 4, total: 178.90, method: "Efectivo" },
  ];

  const stockAlerts = [
    { product: "Paracetamol 500mg", branch: "Ate", current: 5, min: 20, status: "critical" },
    { product: "Ibuprofeno 400mg", branch: "Santa Anita", current: 12, min: 30, status: "warning" },
    { product: "Vitamina C 1000mg", branch: "Ate", current: 8, min: 25, status: "critical" },
    { product: "Omeprazol 20mg", branch: "Santa Anita", current: 15, min: 20, status: "warning" },
    { product: "Loratadina 10mg", branch: "Ate", current: 3, min: 15, status: "critical" },
  ];

  const ordersByStatus = [
    { status: "Pendiente", count: 12, color: "#F59E0B" },
    { status: "En proceso", count: 5, color: "#4C82A8" },
    { status: "Entregado", count: 28, color: "#16A34A" },
    { status: "Cancelado", count: 2, color: "#DC2626" },
  ];
  const totalOrders = ordersByStatus.reduce((sum, i) => sum + i.count, 0);

  const salesChartData = [
    { day: "Lun", ate: 1250, santaAnita: 1480 },
    { day: "Mar", ate: 1420, santaAnita: 1350 },
    { day: "Mié", ate: 1380, santaAnita: 1590 },
    { day: "Jue", ate: 1520, santaAnita: 1420 },
    { day: "Vie", ate: 1680, santaAnita: 1750 },
    { day: "Sáb", ate: 1890, santaAnita: 2100 },
    { day: "Dom", ate: 1650, santaAnita: 1820 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stock Alert Banner */}
      <div className="animate-panel bg-error-soft border border-error/20 border-l-4 border-l-error p-4 rounded-xl flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-error" />
        </div>
        <div>
          <p className="text-error font-semibold text-sm mb-0.5">
            8 productos con stock crítico o bajo mínimo
          </p>
          <p className="text-error/80 text-xs">
            Se requiere reposición urgente en ambas sedes
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const sparkData = kpi.spark.map((v, i) => ({ i, v }));
          return (
            <div
              key={index}
              className="animate-panel group bg-surface rounded-2xl shadow-soft hover:shadow-card border border-line p-5 transition-all duration-300 hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${kpi.color}1A` }}
                >
                  <Icon className="w-[22px] h-[22px]" style={{ color: kpi.color }} />
                </div>
                <div className="w-20 h-9 -mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
                      <Line
                        type="monotone" dataKey="v" stroke={kpi.color}
                        strokeWidth={2} dot={false} isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5">
                {kpi.label}
              </p>
              <p className="text-[28px] leading-none font-bold text-text mb-2.5 font-[var(--font-display)]">
                {kpi.value}
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-md ${
                    kpi.trend === "up" ? "text-success bg-success-soft" :
                    kpi.trend === "down" ? "text-success bg-success-soft" :
                    "text-error bg-error-soft"
                  }`}
                >
                  {kpi.trend === "up" && <TrendingUp className="w-3 h-3" />}
                  {kpi.trend === "down" && <TrendingDown className="w-3 h-3" />}
                  {kpi.trend === "warning" && <Bell className="w-3 h-3" />}
                  {kpi.change}
                </span>
                <span className="text-xs text-faint">vs. ayer</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Chart */}
          <div className="animate-panel bg-surface rounded-2xl shadow-soft border border-line p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-lg text-text">Ventas por día</h2>
                <p className="text-xs text-muted mt-0.5">Tendencia de la última semana</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand" />
                  <span className="text-muted font-medium">Ate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#4C82A8" }} />
                  <span className="text-muted font-medium">Santa Anita</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAte" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F15A29" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#F15A29" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4C82A8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4C82A8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Tooltip content={<SalesTooltip />} cursor={{ stroke: "var(--c-line)", strokeWidth: 1 }} />
                  <Area
                    type="monotone" dataKey="ate" name="Ate" stroke="#F15A29"
                    strokeWidth={2.5} fill="url(#gAte)" dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Area
                    type="monotone" dataKey="santaAnita" name="Santa Anita" stroke="#4C82A8"
                    strokeWidth={2.5} fill="url(#gSA)" dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="animate-panel bg-surface rounded-2xl shadow-soft border border-line p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-lg text-text">Ventas recientes</h2>
                <p className="text-xs text-muted mt-0.5">Actividad en tiempo real</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success-soft px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                En vivo
              </span>
            </div>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line">
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Hora</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Sede</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Trabajador</th>
                    <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted uppercase tracking-wide">Prod.</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted uppercase tracking-wide">Total</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale, index) => (
                    <tr key={index} className="border-b border-line-2 hover:bg-page transition-colors">
                      <td className="px-3 py-3 text-sm text-muted tabular-nums">{sale.time}</td>
                      <td className="px-3 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.branch === "Ate"
                            ? "bg-brand-soft text-brand"
                            : "bg-info-soft text-info"
                        }`}>
                          {sale.branch}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-text">{sale.worker}</td>
                      <td className="px-3 py-3 text-sm text-center text-muted">{sale.products}</td>
                      <td className="px-3 py-3 text-sm font-bold text-text text-right tabular-nums">S/ {sale.total.toFixed(2)}</td>
                      <td className="px-3 py-3 text-sm">
                        {sale.method === "Yape" ? (
                          <div className="flex items-center gap-2">
                            <img src={yapeIcon} alt="Yape" className="w-6 h-6 rounded" />
                            <span className="text-xs font-medium text-violet">Yape</span>
                          </div>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-success-soft text-success">
                            {sale.method}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Orders by Status - Donut */}
          <div className="animate-panel bg-surface rounded-2xl shadow-soft border border-line p-6">
            <h2 className="font-bold text-lg text-text mb-1">Pedidos por estado</h2>
            <p className="text-xs text-muted mb-4">Distribución actual</p>
            <div className="relative h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus} dataKey="count" nameKey="status"
                    cx="50%" cy="50%" innerRadius={58} outerRadius={82}
                    paddingAngle={2} stroke="none"
                  >
                    {ordersByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<OrdersTooltip total={totalOrders} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-text leading-none">{totalOrders}</span>
                <span className="text-xs text-muted mt-1">pedidos</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-4">
              {ordersByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted truncate">{item.status}</span>
                  </div>
                  <span className="text-xs font-bold text-text tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="animate-panel bg-surface rounded-2xl shadow-soft border border-line p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-text">Alertas de Stock</h2>
              <span className="bg-error-soft text-error text-xs font-bold px-2.5 py-1 rounded-full">
                {stockAlerts.length}
              </span>
            </div>
            <div className="space-y-3">
              {stockAlerts.map((alert, index) => {
                const pct = Math.min(100, Math.round((alert.current / alert.min) * 100));
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border ${
                      alert.status === "critical"
                        ? "bg-error-soft border-error/20"
                        : "bg-warning-soft border-warning/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-text flex-1">{alert.product}</p>
                      <Package className={`w-4 h-4 flex-shrink-0 ${
                        alert.status === "critical" ? "text-error" : "text-warning"
                      }`} />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted">{alert.branch}</p>
                      <span className="text-xs text-muted">
                        Stock: <span className={`font-bold ${
                          alert.status === "critical" ? "text-error" : "text-warning"
                        }`}>{alert.current}</span> / {alert.min}
                      </span>
                    </div>
                    <div className="w-full bg-line-2 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: alert.status === "critical" ? "#DC2626" : "#F59E0B",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Tooltips de marca para recharts ---- */
function SalesTooltip({ active, payload, label }: any) {
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

function OrdersTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = Math.round((item.value / total) * 100);
  return (
    <div className="bg-ink-2 text-white rounded-lg shadow-pop px-3 py-2 border border-white/10">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="text-slate-300">{item.name}:</span>
        <span className="font-bold">{item.value}</span>
        <span className="text-slate-400">({pct}%)</span>
      </div>
    </div>
  );
}
