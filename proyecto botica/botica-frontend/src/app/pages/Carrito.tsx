import { Link } from "react-router";
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag, AlertCircle, ShoppingCart, Pill } from "lucide-react";
import { useState } from "react";

export function Carrito() {
  const [cartItems, setCartItems] = useState([
    { id: "1", name: "Paracetamol 500mg x 100 tabletas", activeIngredient: "Paracetamol", price: 12.50, quantity: 2, stock: 45, branch: "Ate", image: "https://images.unsplash.com/photo-1597068596627-717bd7124319?w=200&h=200&fit=crop" },
    { id: "2", name: "Ibuprofeno 400mg x 50 cápsulas", activeIngredient: "Ibuprofeno", price: 18.90, quantity: 1, stock: 32, branch: "Ate", image: "https://images.unsplash.com/photo-1622147459102-8a0f3727e4c4?w=200&h=200&fit=crop" },
  ]);

  const updateQuantity = (id: string, newQty: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.stock, newQty)) } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const delivery = 0; // Free pickup
  const total = subtotal + delivery;

  if (cartItems.length === 0) {
    return (
      <div className="bg-[#F5F5F5] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl p-12 shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-family-heading)' }}>
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-6">
              Agrega productos para comenzar tu compra
            </p>
            <Link
              to="/catalogo"
              className="inline-block bg-[#FF6633] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-family-heading)' }}>
          Carrito de Compras
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#FFCCAA]/30">
                        <Pill className="w-8 h-8 text-[#FF6633]" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link
                      to={`/producto/${item.id}`}
                      className="font-semibold hover:text-[#FF6633] transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-500 italic mt-1">
                      Principio activo: {item.activeIngredient}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Sede: {item.branch}
                    </p>

                    {/* Stock Warning */}
                    {item.quantity > item.stock && (
                      <div className="flex items-center gap-2 mt-2 text-[#FF6633] text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Solo {item.stock} unidades disponibles en sede {item.branch}</span>
                      </div>
                    )}
                  </div>

                  {/* Quantity & Price */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-12 text-center border border-gray-300 rounded py-1 text-sm font-semibold"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">S/ {item.price.toFixed(2)} c/u</p>
                      <p className="text-lg font-bold text-[#FF6633]">
                        S/ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[#E03131] hover:text-red-700 transition-colors p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-family-heading)' }}>
                Resumen de pedido
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="font-semibold text-[#3AAB4A]">
                    {delivery === 0 ? 'Gratis recojo en tienda' : `S/ ${delivery.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-[#FF6633]" style={{ fontFamily: 'var(--font-family-heading)' }}>
                    S/ {total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full bg-[#FF6633] text-white py-3.5 rounded-lg font-semibold hover:bg-[#E85522] transition-colors text-center mb-3"
              >
                Continuar al pago
              </Link>

              <Link
                to="/catalogo"
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-[#FF6633] transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
