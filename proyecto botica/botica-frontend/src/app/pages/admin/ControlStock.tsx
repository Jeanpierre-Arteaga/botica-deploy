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
    if (stock === 0) return { color: "text-error", bg: "bg-error-soft", label: "Agotado" };
    if (stock < minStock / 2) return { color: "text-error", bg: "bg-error-soft", label: "Crítico" };
    if (stock < minStock) return { color: "text-warning", bg: "bg-warning-soft", label: "Bajo" };
    return { color: "text-success", bg: "bg-success-soft", label: "Normal" };
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
          <h1 className="text-2xl font-bold text-text mb-1">Control de Stock por Sede</h1>
          <p className="text-sm text-muted">Monitorea y gestiona el inventario de ambas sucursales</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 bg-cool text-white px-5 py-3 rounded-lg font-semibold hover:bg-cool/90 transition-colors"
          >
            <ArrowRightLeft className="w-5 h-5" />
            Transferir Stock
          </button>
          <button className="flex items-center gap-2 bg-brand text-white px-5 py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors">
            <RefreshCw className="w-5 h-5" />
            Registrar Reposición
          </button>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="bg-surface rounded-xl shadow-sm border border-line p-5 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-muted">Ver stock de:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedBranch("ate")}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${
                selectedBranch === "ate"
                  ? "bg-brand text-white"
                  : "bg-line-2 text-muted hover:bg-line"
              }`}
            >
              Sede Ate
            </button>
            <button
              onClick={() => setSelectedBranch("santa-anita")}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${
                selectedBranch === "santa-anita"
                  ? "bg-cool text-white"
                  : "bg-line-2 text-muted hover:bg-line"
              }`}
            >
              Sede Santa Anita
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {criticalProducts.length > 0 && (
        <div className="bg-error-soft border-l-4 border-error p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-error font-semibold text-sm mb-1">
                {criticalProducts.length} producto(s) en stock crítico en {selectedBranch === "ate" ? "Ate" : "Santa Anita"}
              </p>
              <p className="text-error text-xs">
                Se requiere reposición urgente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-xl shadow-sm border border-line p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-medium">Total productos</p>
            <Package className="w-5 h-5 text-faint" />
          </div>
          <p className="text-2xl font-bold text-text">{stockData.length}</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-line p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-medium">Stock crítico</p>
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
          <p className="text-2xl font-bold text-error">{criticalProducts.length}</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-line p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-medium">Stock bajo</p>
            <TrendingDown className="w-5 h-5 text-warning" />
          </div>
          <p className="text-2xl font-bold text-warning">{lowStockProducts.length}</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-line p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-medium">Stock normal</p>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-success">
            {stockData.length - criticalProducts.length - lowStockProducts.length}
          </p>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
        <div className="p-5 border-b border-line">
          <h2 className="font-bold text-lg">
            Inventario — {selectedBranch === "ate" ? "Sede Ate" : "Sede Santa Anita"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-page border-b border-line">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Categoría</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-muted">Stock actual</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-muted">Stock mínimo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Última reposición</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Tendencia</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((product) => {
                const currentStock = selectedBranch === "ate" ? product.stockAte : product.stockSantaAnita;
                const status = getStockStatus(currentStock, product.minStock);
                return (
                  <tr key={product.id} className="border-b border-line-2 hover:bg-page transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-sm text-text">{product.name}</p>
                        <p className="text-xs text-muted font-mono">{product.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{product.category}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-2xl font-bold ${status.color}`}>
                        {currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-muted">{product.minStock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{product.lastRestock}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {product.movement === "up" && (
                          <>
                            <TrendingUp className="w-4 h-4 text-success" />
                            <span className="text-xs text-success font-medium">Subiendo</span>
                          </>
                        )}
                        {product.movement === "down" && (
                          <>
                            <TrendingDown className="w-4 h-4 text-error" />
                            <span className="text-xs text-error font-medium">Bajando</span>
                          </>
                        )}
                        {product.movement === "stable" && (
                          <span className="text-xs text-muted font-medium">Estable</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-brand hover:text-brand-hover font-semibold text-sm transition-colors">
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
          <div className="bg-surface rounded-xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-6">Transferir Stock entre Sedes</h2>

            <form className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted">Producto</label>
                <select className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                  <option>Seleccionar producto...</option>
                  {stockData.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-muted">Desde</label>
                  <select className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                    <option>Ate</option>
                    <option>Santa Anita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-muted">Hacia</label>
                  <select className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                    <option>Santa Anita</option>
                    <option>Ate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-muted">Cantidad a transferir</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-muted">Motivo (opcional)</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-line rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Describe el motivo de la transferencia..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors"
                >
                  Confirmar transferencia
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 bg-line text-muted py-3 rounded-lg font-semibold hover:bg-line-2 transition-colors"
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
