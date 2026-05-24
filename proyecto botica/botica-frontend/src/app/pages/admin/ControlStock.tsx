import { Package, TrendingUp, TrendingDown, RefreshCw, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function ControlStock() {
  const [selectedBranch, setSelectedBranch] = useState<"ate" | "santa-anita">("ate");
  const [showTransferModal, setShowTransferModal] = useState(false);

  const stockData = [
    {
      id: "PROD-001",
      name: "Paracetamol 500mg",
      category: "Analgésicos",
      stockAte: 5,
      stockSantaAnita: 18,
      minStock: 20,
      lastRestock: "15 Abr 2026",
      movement: "down",
    },
    {
      id: "PROD-002",
      name: "Ibuprofeno 400mg",
      category: "Analgésicos",
      stockAte: 25,
      stockSantaAnita: 12,
      minStock: 30,
      lastRestock: "18 Abr 2026",
      movement: "up",
    },
    {
      id: "PROD-003",
      name: "Amoxicilina 500mg",
      category: "Antibióticos",
      stockAte: 40,
      stockSantaAnita: 35,
      minStock: 25,
      lastRestock: "20 Abr 2026",
      movement: "up",
    },
    {
      id: "PROD-004",
      name: "Vitamina C 1000mg",
      category: "Vitaminas",
      stockAte: 8,
      stockSantaAnita: 22,
      minStock: 25,
      lastRestock: "10 Abr 2026",
      movement: "down",
    },
    {
      id: "PROD-005",
      name: "Omeprazol 20mg",
      category: "Gastroenterología",
      stockAte: 30,
      stockSantaAnita: 15,
      minStock: 20,
      lastRestock: "19 Abr 2026",
      movement: "stable",
    },
  ];

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { color: "text-red-600", bg: "bg-red-100", label: "Agotado" };
    if (stock < minStock / 2) return { color: "text-red-600", bg: "bg-red-100", label: "Crítico" };
    if (stock < minStock) return { color: "text-amber-600", bg: "bg-amber-100", label: "Bajo" };
    return { color: "text-green-600", bg: "bg-green-100", label: "Normal" };
  };

  const criticalProducts = stockData.filter(p =>
    (selectedBranch === "ate" ? p.stockAte : p.stockSantaAnita) < p.minStock / 2
  );

  const lowStockProducts = stockData.filter(p => {
    const stock = selectedBranch === "ate" ? p.stockAte : p.stockSantaAnita;
    return stock >= p.minStock / 2 && stock < p.minStock;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Control de Stock por Sede</h1>
          <p className="text-sm text-gray-600">Monitorea y gestiona el inventario de ambas sucursales</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 bg-[#2B7DBF] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#1E5A8F] transition-colors"
          >
            <ArrowRightLeft className="w-5 h-5" />
            Transferir Stock
          </button>
          <button className="flex items-center gap-2 bg-[#FF6633] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#E85522] transition-colors">
            <RefreshCw className="w-5 h-5" />
            Registrar Reposición
          </button>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-700">Ver stock de:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedBranch("ate")}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${
                selectedBranch === "ate"
                  ? "bg-[#FF6633] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Sede Ate
            </button>
            <button
              onClick={() => setSelectedBranch("santa-anita")}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${
                selectedBranch === "santa-anita"
                  ? "bg-[#2B7DBF] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Sede Santa Anita
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {criticalProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold text-sm mb-1">
                {criticalProducts.length} producto(s) en stock crítico en {selectedBranch === "ate" ? "Ate" : "Santa Anita"}
              </p>
              <p className="text-red-700 text-xs">
                Se requiere reposición urgente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium">Total productos</p>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stockData.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium">Stock crítico</p>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalProducts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium">Stock bajo</p>
            <TrendingDown className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{lowStockProducts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium">Stock normal</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stockData.length - criticalProducts.length - lowStockProducts.length}
          </p>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-bold text-lg">
            Inventario — {selectedBranch === "ate" ? "Sede Ate" : "Sede Santa Anita"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Categoría</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">Stock actual</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">Stock mínimo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Última reposición</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Tendencia</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((product) => {
                const currentStock = selectedBranch === "ate" ? product.stockAte : product.stockSantaAnita;
                const status = getStockStatus(currentStock, product.minStock);
                return (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{product.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-2xl font-bold ${status.color}`}>
                        {currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{product.minStock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.lastRestock}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {product.movement === "up" && (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Subiendo</span>
                          </>
                        )}
                        {product.movement === "down" && (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">Bajando</span>
                          </>
                        )}
                        {product.movement === "stable" && (
                          <span className="text-xs text-gray-600 font-medium">Estable</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-[#FF6633] hover:text-[#E85522] font-semibold text-sm transition-colors">
                        Reponer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-6">Transferir Stock entre Sedes</h2>

            <form className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Producto</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]">
                  <option>Seleccionar producto...</option>
                  {stockData.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Desde</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]">
                    <option>Ate</option>
                    <option>Santa Anita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Hacia</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]">
                    <option>Santa Anita</option>
                    <option>Ate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Cantidad a transferir</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Motivo (opcional)</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                  placeholder="Describe el motivo de la transferencia..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 bg-[#FF6633] text-white py-3 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
                >
                  Confirmar transferencia
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
