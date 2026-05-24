import { Search, Plus, Minus, Trash2, CheckCircle2, ShoppingCart, Banknote, ShoppingBag } from "lucide-react";
import { useState } from "react";
import yapeIcon from "../../../imports/image-3.png";

interface CartItem {
  id: string;
  name: string;
  activeIngredient: string;
  price: number;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  activeIngredient: string;
  laboratory: string;
  stock: number;
  price: number;
}

const mockProducts: Product[] = [
  { id: "1", name: "Paracetamol 500mg x 100 tab", activeIngredient: "Paracetamol", laboratory: "Laboratorios Unidos", stock: 45, price: 12.50 },
  { id: "2", name: "Ibuprofeno 400mg x 50 cáp", activeIngredient: "Ibuprofeno", laboratory: "Farma Plus", stock: 32, price: 18.90 },
  { id: "3", name: "Amoxicilina 500mg x 30 cáp", activeIngredient: "Amoxicilina", laboratory: "Antibióticos SA", stock: 0, price: 25.00 },
  { id: "4", name: "Vitamina C 1000mg x 60 tab", activeIngredient: "Ácido Ascórbico", laboratory: "Vitamax", stock: 78, price: 35.00 },
];

export function NuevaVenta() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "yape">("efectivo");
  const [showClientData, setShowClientData] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const filters = ["Todos", "Genéricos", "Vitaminas", "Pañales", "Ver más"];

  const filteredProducts = mockProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        name: product.name,
        activeIngredient: product.activeIngredient,
        price: product.price,
        quantity: 1,
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(cartItems.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleConfirmSale = () => {
    setShowConfirmModal(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCartItems([]);
      setPaymentMethod("efectivo");
      setShowClientData(false);
    }, 3000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#F8F9FA]">
      {/* Left - Product Search */}
      <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          {/* Search Bar */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, principio activo o laboratorio"
              className="w-full h-12 pl-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FF6633] text-white p-2 rounded-lg hover:bg-[#E85522]">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.toLowerCase()
                    ? 'bg-[#FF6633] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Product Results */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron productos para "{searchQuery}"
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-600 mb-1">
                        Principio activo: {product.activeIngredient}
                      </p>
                      <p className="text-xs text-[#2B7DBF]">{product.laboratory}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {product.stock > 0 ? (
                          <div className="flex items-center gap-1 text-xs text-[#3AAB4A] mb-1">
                            <div className="w-2 h-2 rounded-full bg-[#3AAB4A]"></div>
                            <span>Disponible: {product.stock} unid.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-[#E03131] mb-1">
                            <div className="w-2 h-2 rounded-full bg-[#E03131]"></div>
                            <span>Agotado</span>
                          </div>
                        )}
                        <p className="text-[#FF6633] font-bold">S/ {product.price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          product.stock > 0
                            ? 'bg-[#2B7DBF] text-white hover:bg-[#2369A3]'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right - Cart */}
      <div className="w-[480px] bg-white flex flex-col">
        {showSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-[#3AAB4A] rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#3AAB4A] mb-2">¡Venta registrada!</h2>
            <p className="text-lg mb-2">Total cobrado: S/ {subtotal.toFixed(2)}</p>
            {paymentMethod === "efectivo" && (
              <p className="text-gray-600">Cambio a devolver: S/ 0.00</p>
            )}
            <button
              onClick={() => setShowSuccess(false)}
              className="mt-8 bg-[#FF6633] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#E85522]"
            >
              Nueva venta
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-bold text-lg mb-1">Venta actual</h2>
              <p className="text-xs text-gray-600">Registrada por: Carlos Q.</p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-gray-400" />
                  </div>
                  <p>No hay productos en la venta</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{item.name}</h3>
                          <p className="text-xs text-gray-600">{item.activeIngredient}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#E03131] hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">S/ {item.price.toFixed(2)} c/u</p>
                          <p className="text-[#FF6633] font-bold">S/ {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals & Payment */}
            <div className="p-6 border-t border-gray-200 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900 font-semibold">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">TOTAL:</span>
                <span className="text-[#FF6633] font-extrabold text-2xl">S/ {subtotal.toFixed(2)}</span>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Método de pago</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("efectivo")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === "efectivo"
                        ? 'border-[#2B7DBF] bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-lg flex items-center justify-center">
                      <Banknote className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="font-semibold text-sm">Efectivo</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("yape")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === "yape"
                        ? 'border-[#2B7DBF] bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="mb-1">
                      <img src={yapeIcon} alt="Yape" className="w-12 h-12 mx-auto rounded-lg" />
                    </div>
                    <div className="font-semibold text-sm">Yape</div>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={cartItems.length === 0}
                className="w-full h-14 bg-[#FF6633] text-white rounded-lg font-semibold hover:bg-[#E85522] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar venta
              </button>
              <button
                onClick={() => setCartItems([])}
                className="w-full py-3 border-2 border-[#E03131] text-[#E03131] rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">¿Confirmar esta venta?</h2>
            <div className="mb-6 text-gray-600">
              <p>{cartItems.length} productos · Total S/ {subtotal.toFixed(2)}</p>
              <p>Método: {paymentMethod === "efectivo" ? "Efectivo" : "Yape"}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmSale}
                className="flex-1 bg-[#FF6633] text-white py-3 rounded-lg font-semibold hover:bg-[#E85522]"
              >
                Sí, confirmar
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
