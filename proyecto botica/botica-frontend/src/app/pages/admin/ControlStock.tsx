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
      <div className="bg-surface rounded-2xl shadow-soft border border-line p-5 mb-6">
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
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <StockStat icon={Package} label="Total productos" value={stockData.length} accent="var(--c-muted)" index={0} />
        <StockStat icon={AlertTriangle} label="Stock crítico" value={criticalProducts.length} accent="var(--c-error)" index={1} />
        <StockStat icon={TrendingDown} label="Stock bajo" value={lowStockProducts.length} accent="var(--c-warning)" index={2} />
        <StockStat icon={TrendingUp} label="Stock normal" value={stockData.length - criticalProducts.length - lowStockProducts.length} accent="var(--c-success)" index={3} />
      </div>

      {/* Stock Table */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line overflow-hidden">
        <div className="p-5 border-b border-line">
          <h2 className="font-bold text-lg text-text">
            Inventario — {selectedBranch === "ate" ? "Sede Ate" : "Sede Santa Anita"}
          </h2>
          <p className="text-xs text-muted mt-0.5">Niveles de stock y estado de reposición</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-page border-b border-line">
              <tr>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Producto</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Categoría</th>
                <th className="px-6 py-3.5 text-center text-[11px] font-semibold text-muted uppercase tracking-wide">Stock actual</th>
                <th className="px-6 py-3.5 text-center text-[11px] font-semibold text-muted uppercase tracking-wide">Stock mínimo</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Estado</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Última reposición</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Tendencia</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Acciones</th>
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-pop border border-line p-8 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-xl bg-cool-soft text-cool flex items-center justify-center shrink-0">
                <ArrowRightLeft className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-text">Transferir Stock entre Sedes</h2>
            </div>

            <form className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Producto</label>
                <select className="w-full px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors">
                  <option>Seleccionar producto...</option>
                  {stockData.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text">Desde</label>
                  <select className="w-full px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors">
                    <option>Ate</option>
                    <option>Santa Anita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text">Hacia</label>
                  <select className="w-full px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors">
                    <option>Santa Anita</option>
                    <option>Ate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Cantidad a transferir</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Motivo (opcional)</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-page border border-line rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  placeholder="Describe el motivo de la transferencia..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-hover active:scale-[0.99] transition-all"
                >
                  Confirmar transferencia
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 bg-page text-muted border border-line py-3 rounded-lg font-semibold hover:bg-line-2 transition-colors"
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

function StockStat({
  icon: Icon, label, value, accent, index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
  index: number;
}) {
  return (
    <div
      className="animate-panel relative overflow-hidden bg-surface rounded-2xl shadow-soft border border-line p-5 hover:shadow-card hover:-translate-y-0.5 transition-all"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="absolute left-0 top-0 h-full w-1 rounded-r" style={{ backgroundColor: accent }} />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
      >
        <Icon className="w-[22px] h-[22px]" />
      </div>
      <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-[26px] lg:text-[28px] leading-none font-bold text-text tabular-nums">{value}</p>
    </div>
  );
}
