import { Download, Calendar, TrendingUp, Package, DollarSign } from "lucide-react";
import { useState } from "react";

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
    { category: "Analgésicos", sales: 4850, percentage: 28, color: "#FF6633" },
    { category: "Vitaminas", sales: 3920, percentage: 23, color: "#3AAB4A" },
    { category: "Antibióticos", sales: 3150, percentage: 18, color: "#2B7DBF" },
    { category: "Gastroenterología", sales: 2680, percentage: 16, color: "#F59E0B" },
    { category: "Otros", sales: 2550, percentage: 15, color: "#94A3B8" },
  ];

  const maxSales = Math.max(...salesData.map(d => d.total));
  const totalWeekSales = salesData.reduce((sum, d) => sum + d.total, 0);
  const avgDailySales = totalWeekSales / salesData.length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Reportes de Ventas y Rotación</h1>
          <p className="text-sm text-gray-600">Análisis de rendimiento y estadísticas de ventas</p>
        </div>
        <button className="flex items-center gap-2 bg-[#FF6633] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#E85522] transition-colors">
          <Download className="w-5 h-5" />
          Exportar Reporte
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Periodo:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange("today")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateRange === "today"
                    ? "bg-[#FF6633] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setDateRange("week")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateRange === "week"
                    ? "bg-[#FF6633] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setDateRange("month")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateRange === "month"
                    ? "bg-[#FF6633] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setDateRange("custom")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  dateRange === "custom"
                    ? "bg-[#FF6633] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Sede:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
            >
              <option value="both">Ambas sedes</option>
              <option value="ate">Ate</option>
              <option value="santa-anita">Santa Anita</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Ventas totales</p>
            <DollarSign className="w-5 h-5 text-[#FF6633]" />
          </div>
          <p className="text-2xl font-bold text-[#FF6633] mb-2">S/ {totalWeekSales.toFixed(2)}</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span className="text-xs font-semibold text-green-600">+18%</span>
            <span className="text-xs text-gray-500">vs. anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Promedio diario</p>
            <DollarSign className="w-5 h-5 text-[#2B7DBF]" />
          </div>
          <p className="text-2xl font-bold text-[#2B7DBF] mb-2">S/ {avgDailySales.toFixed(2)}</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span className="text-xs font-semibold text-green-600">+12%</span>
            <span className="text-xs text-gray-500">vs. anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Productos vendidos</p>
            <Package className="w-5 h-5 text-[#3AAB4A]" />
          </div>
          <p className="text-2xl font-bold text-[#3AAB4A] mb-2">471</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span className="text-xs font-semibold text-green-600">+8%</span>
            <span className="text-xs text-gray-500">vs. anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Ticket promedio</p>
            <DollarSign className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <p className="text-2xl font-bold text-[#F59E0B] mb-2">S/ 45.30</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span className="text-xs font-semibold text-green-600">+5%</span>
            <span className="text-xs text-gray-500">vs. anterior</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Sales Chart - 2/3 width */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg">Evolución de Ventas — Última Semana</h2>
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

          <div className="flex items-end gap-3 h-72">
            {salesData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-3">
                <div className="w-full flex gap-1 items-end h-56">
                  <div
                    className="flex-1 bg-[#FF6633] rounded-t-lg relative group cursor-pointer hover:bg-[#E85522] transition-colors"
                    style={{ height: `${(data.ate / maxSales) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      S/ {data.ate}
                    </div>
                  </div>
                  <div
                    className="flex-1 bg-[#2B7DBF] rounded-t-lg relative group cursor-pointer hover:bg-[#1E5A8F] transition-colors"
                    style={{ height: `${(data.santaAnita / maxSales) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      S/ {data.santaAnita}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{data.day}</span>
                <span className="text-xs font-bold text-gray-800">S/ {data.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance - 1/3 width */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-lg mb-6">Ventas por Categoría</h2>
          <div className="space-y-4">
            {categoryPerformance.map((cat, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">S/ {cat.sales}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-bold text-lg">Productos Más Vendidos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">#</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Categoría</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">Unidades vendidas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Ingresos</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-sm text-gray-800">{product.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-gray-800">{product.sold}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#FF6633]">S/ {product.revenue.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {product.trend.startsWith("+") ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">{product.trend}</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                          <span className="text-sm font-semibold text-red-600">{product.trend}</span>
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
