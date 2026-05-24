import { AlertTriangle, TrendingUp, ShoppingCart, Package, Bell } from "lucide-react";
import yapeIcon from "../../../imports/image-3.png";

export function AdminDashboard() {
  const kpis = [
    { label: "Ventas hoy", value: "S/ 8,450.00", change: "+12%", trend: "up", color: "#FF6633" },
    { label: "Transacciones", value: "47", change: "+8%", trend: "up", color: "#2B7DBF" },
    { label: "Pedidos pendientes", value: "12", change: "-3%", trend: "down", color: "#F59E0B" },
    { label: "Alertas de stock", value: "8", change: "+2", trend: "warning", color: "#E03131" },
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
    { status: "En proceso", count: 5, color: "#2B7DBF" },
    { status: "Entregado", count: 28, color: "#3AAB4A" },
    { status: "Cancelado", count: 2, color: "#E03131" },
  ];

  const salesChartData = [
    { day: "Lun", ate: 1250, santaAnita: 1480 },
    { day: "Mar", ate: 1420, santaAnita: 1350 },
    { day: "Mié", ate: 1380, santaAnita: 1590 },
    { day: "Jue", ate: 1520, santaAnita: 1420 },
    { day: "Vie", ate: 1680, santaAnita: 1750 },
    { day: "Sáb", ate: 1890, santaAnita: 2100 },
    { day: "Dom", ate: 1650, santaAnita: 1820 },
  ];

  const maxValue = Math.max(...salesChartData.flatMap(d => [d.ate, d.santaAnita]));

  return (
    <div className="p-6">
      {/* Stock Alert Banner */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-semibold text-sm mb-1">
              8 productos con stock crítico o bajo mínimo
            </p>
            <p className="text-red-700 text-xs">
              Se requiere reposición urgente en ambas sedes
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{kpi.label}</p>
              {kpi.trend === "warning" && <Bell className="w-4 h-4 text-red-500" />}
            </div>
            <p className="text-2xl font-bold mb-2" style={{ color: kpi.color }}>
              {kpi.value}
            </p>
            <div className="flex items-center gap-1">
              {kpi.trend === "up" && <TrendingUp className="w-3 h-3 text-green-600" />}
              {kpi.trend === "down" && <TrendingUp className="w-3 h-3 text-green-600 rotate-180" />}
              <span className={`text-xs font-semibold ${
                kpi.trend === "up" ? "text-green-600" :
                kpi.trend === "down" ? "text-green-600" :
                "text-gray-600"
              }`}>
                {kpi.change}
              </span>
              <span className="text-xs text-gray-500">vs. ayer</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="col-span-2 space-y-6">
          {/* Sales Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Ventas por día — Última semana</h2>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF6633]"></div>
                  <span className="text-gray-600">Ate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#2B7DBF]"></div>
                  <span className="text-gray-600">Santa Anita</span>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-4 h-64">
              {salesChartData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end h-48">
                    <div
                      className="flex-1 bg-[#FF6633] rounded-t-lg relative group cursor-pointer hover:bg-[#E85522] transition-colors"
                      style={{ height: `${(data.ate / maxValue) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        S/ {data.ate}
                      </div>
                    </div>
                    <div
                      className="flex-1 bg-[#2B7DBF] rounded-t-lg relative group cursor-pointer hover:bg-[#1E5A8F] transition-colors"
                      style={{ height: `${(data.santaAnita / maxValue) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        S/ {data.santaAnita}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-lg mb-4">Ventas recientes — Tiempo real</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Sede</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Trabajador</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Productos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm">{sale.time}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.branch === "Ate"
                            ? "bg-[#FFCCAA] text-[#FF6633]"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {sale.branch}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{sale.worker}</td>
                      <td className="px-4 py-3 text-sm text-center">{sale.products}</td>
                      <td className="px-4 py-3 text-sm font-bold">S/ {sale.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">
                        {sale.method === "Yape" ? (
                          <div className="flex items-center gap-2">
                            <img src={yapeIcon} alt="Yape" className="w-6 h-6 rounded" />
                            <span className="text-xs font-medium text-purple-700">Yape</span>
                          </div>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
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
          {/* Stock Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Alertas de Stock</h2>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                {stockAlerts.length}
              </span>
            </div>
            <div className="space-y-3">
              {stockAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.status === "critical"
                      ? "bg-red-50 border-red-500"
                      : "bg-amber-50 border-amber-500"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-800 flex-1">{alert.product}</p>
                    <Package className={`w-4 h-4 flex-shrink-0 ${
                      alert.status === "critical" ? "text-red-600" : "text-amber-600"
                    }`} />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{alert.branch}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Stock: <span className={`font-bold ${
                        alert.status === "critical" ? "text-red-700" : "text-amber-700"
                      }`}>{alert.current}</span> / {alert.min}
                    </span>
                    {alert.status === "critical" && (
                      <span className="text-xs font-bold text-red-700">¡Crítico!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-lg mb-4">Pedidos por estado</h2>
            <div className="space-y-3">
              {ordersByStatus.map((item, index) => {
                const total = ordersByStatus.reduce((sum, i) => sum + i.count, 0);
                const percentage = ((item.count / total) * 100).toFixed(0);
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">{item.status}</span>
                      </div>
                      <span className="text-sm font-bold">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total pedidos</span>
                <span className="text-lg font-bold text-[#FF6633]">
                  {ordersByStatus.reduce((sum, i) => sum + i.count, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
