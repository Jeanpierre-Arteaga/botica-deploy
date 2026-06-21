import { Search, Plus, Edit2, Trash2, Package, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stockAte: number;
  stockSantaAnita: number;
  minStock: number;
  requiresPrescription: boolean;
  status: "active" | "inactive";
}

export function GestionProductos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const products: Product[] = [
    {
      id: "PROD-001",
      name: "Paracetamol 500mg",
      category: "Analgésicos",
      price: 8.50,
      stockAte: 5,
      stockSantaAnita: 18,
      minStock: 20,
      requiresPrescription: false,
      status: "active",
    },
    {
      id: "PROD-002",
      name: "Ibuprofeno 400mg",
      category: "Analgésicos",
      price: 12.00,
      stockAte: 25,
      stockSantaAnita: 12,
      minStock: 30,
      requiresPrescription: false,
      status: "active",
    },
    {
      id: "PROD-003",
      name: "Amoxicilina 500mg",
      category: "Antibióticos",
      price: 24.90,
      stockAte: 40,
      stockSantaAnita: 35,
      minStock: 25,
      requiresPrescription: true,
      status: "active",
    },
    {
      id: "PROD-004",
      name: "Vitamina C 1000mg",
      category: "Vitaminas",
      price: 18.50,
      stockAte: 8,
      stockSantaAnita: 22,
      minStock: 25,
      requiresPrescription: false,
      status: "active",
    },
    {
      id: "PROD-005",
      name: "Omeprazol 20mg",
      category: "Gastroenterología",
      price: 15.00,
      stockAte: 30,
      stockSantaAnita: 15,
      minStock: 20,
      requiresPrescription: false,
      status: "active",
    },
  ];

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const getTotalStock = (product: Product) => product.stockAte + product.stockSantaAnita;

  const getStockStatus = (product: Product) => {
    const total = getTotalStock(product);
    if (total === 0) return { color: "text-error", bg: "bg-error-soft", label: "Sin stock" };
    if (total < product.minStock) return { color: "text-warning", bg: "bg-warning-soft", label: "Stock bajo" };
    return { color: "text-success", bg: "bg-success-soft", label: "Stock OK" };
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Gestión de Productos</h1>
          <p className="text-sm text-muted">Administra el catálogo completo de medicamentos y productos</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-brand text-white px-5 py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface rounded-xl shadow-sm border border-line p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, código o categoría..."
              className="w-full pl-12 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <select className="px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
            <option>Todas las categorías</option>
            <option>Analgésicos</option>
            <option>Antibióticos</option>
            <option>Vitaminas</option>
            <option>Gastroenterología</option>
          </select>
          <select className="px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
            <option>Todos los estados</option>
            <option>Activos</option>
            <option>Inactivos</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
          <p className="text-xs text-muted mb-1">Total productos</p>
          <p className="text-2xl font-bold text-brand">{products.length}</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
          <p className="text-xs text-muted mb-1">Productos activos</p>
          <p className="text-2xl font-bold text-success">{products.filter(p => p.status === "active").length}</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
          <p className="text-xs text-muted mb-1">Con stock bajo</p>
          <p className="text-2xl font-bold text-warning">{products.filter(p => getTotalStock(p) < p.minStock).length}</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
          <p className="text-xs text-muted mb-1">Requieren receta</p>
          <p className="text-2xl font-bold text-cool">{products.filter(p => p.requiresPrescription).length}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-page border-b border-line">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Código</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Categoría</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Precio</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Stock Ate</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Stock S.A.</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);
                return (
                  <tr key={product.id} className="border-b border-line-2 hover:bg-page transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-muted">{product.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-text">{product.name}</p>
                          {product.requiresPrescription && (
                            <p className="text-xs text-purple-600 font-medium">Requiere receta</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{product.category}</td>
                    <td className="px-6 py-4 text-sm font-bold text-text">S/ {product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className={`px-2 py-1 rounded-full ${
                        product.stockAte < product.minStock / 2 ? "bg-error-soft text-error" : "bg-line-2 text-muted"
                      } font-medium`}>
                        {product.stockAte}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className={`px-2 py-1 rounded-full ${
                        product.stockSantaAnita < product.minStock / 2 ? "bg-error-soft text-error" : "bg-line-2 text-muted"
                      } font-medium`}>
                        {product.stockSantaAnita}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.bg}`}>
                        {getTotalStock(product) < product.minStock && (
                          <AlertCircle className={`w-3 h-3 ${status.color}`} />
                        )}
                        <span className={`font-semibold ${status.color}`}>{getTotalStock(product)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.status === "active"
                          ? "bg-success-soft text-success"
                          : "bg-line-2 text-muted"
                      }`}>
                        {product.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 hover:bg-info-soft rounded-lg transition-colors group"
                        >
                          <Edit2 className="w-4 h-4 text-muted group-hover:text-cool" />
                        </button>
                        <button className="p-2 hover:bg-error-soft rounded-lg transition-colors group">
                          <Trash2 className="w-4 h-4 text-muted group-hover:text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </h2>

            <form className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-muted">Nombre del producto</label>
                  <input
                    type="text"
                    defaultValue={editingProduct?.name}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Ej: Paracetamol 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-muted">Categoría</label>
                  <select
                    defaultValue={editingProduct?.category}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option>Analgésicos</option>
                    <option>Antibióticos</option>
                    <option>Vitaminas</option>
                    <option>Gastroenterología</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-muted">Precio (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={editingProduct?.price}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-muted">Stock Ate</label>
                  <input
                    type="number"
                    defaultValue={editingProduct?.stockAte}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-muted">Stock S.A.</label>
                  <input
                    type="number"
                    defaultValue={editingProduct?.stockSantaAnita}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-muted">Stock mínimo</label>
                <input
                  type="number"
                  defaultValue={editingProduct?.minStock}
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requiresPrescription"
                  defaultChecked={editingProduct?.requiresPrescription}
                  className="w-5 h-5 rounded border-line text-brand focus:ring-brand"
                />
                <label htmlFor="requiresPrescription" className="text-sm font-semibold text-muted">
                  Requiere receta médica
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors"
                >
                  {editingProduct ? "Guardar cambios" : "Crear producto"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
