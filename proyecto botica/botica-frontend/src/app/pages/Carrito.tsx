import { Link, useNavigate } from 'react-router';
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/AuthContext';
import { useLocations } from '../lib/LocationContext';

export function Carrito() {
  const { items, itemCount, subtotal, updateAmount, removeItem, isEmpty } = useCart();
  const { user } = useAuth();
  const { selectedLocation } = useLocations();
  const navigate = useNavigate();

  const shippingCost = subtotal >= 50 ? 0 : 8;
  const total = subtotal + shippingCost;

  const handleCheckout = () => {
    if (isEmpty) {
      toast.error('Tu carrito está vacío');
      return;
    }
    if (!user || user.role !== 'cust') {
      toast.info('Inicia sesión para continuar');
      navigate('/login', { state: { from: '/carrito' } });
      return;
    }
    navigate('/checkout');
  };

  if (isEmpty) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <ShoppingCart size={64} className="mx-auto text-line mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-muted mb-6">
            Agrega productos para comenzar tu compra
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white font-medium rounded-md transition-colors"
          >
            <ArrowLeft size={18} />
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-sm text-muted mb-2">
        <Link to="/" className="hover:text-brand">Inicio</Link>
        <span className="mx-2">›</span>
        <span className="text-text font-medium">Carrito</span>
      </div>

      <h1 className="text-3xl font-bold text-text mb-2">Tu carrito</h1>
      <p className="text-muted mb-6">
        {itemCount} {itemCount === 1 ? 'producto' : 'productos'} en {selectedLocation?.location_name || 'tu sede'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="bg-surface rounded-xl border border-line p-4 flex gap-4"
            >
              <div className="w-24 h-24 flex-shrink-0 bg-brand-soft rounded-lg overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand">
                    <ShoppingCart size={32} />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-semibold text-text line-clamp-2 mb-1">
                    {item.product_name}
                  </h3>
                  <p className="text-sm text-brand font-medium">
                    S/ {item.unit_price.toFixed(2)} c/u
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 bg-page rounded-lg">
                    <button
                      onClick={() => updateAmount(item.product_id, item.amount - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-line rounded-l-lg transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center font-semibold text-sm">
                      {item.amount}
                    </span>
                    <button
                      onClick={() => updateAmount(item.product_id, item.amount + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-line rounded-r-lg transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-text">
                      S/ {(item.unit_price * item.amount).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-xs text-error hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Trash2 size={12} />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-brand hover:underline text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Seguir comprando
          </Link>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl border border-line p-6 sticky top-4">
            <h2 className="font-bold text-text text-lg mb-4">
              Resumen del pedido
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal ({itemCount} productos)</span>
                <span className="font-medium">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Envío</span>
                <span className="font-medium">
                  {shippingCost === 0 ? (
                    <span className="text-success">Gratis</span>
                  ) : (
                    `S/ ${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-muted italic">
                  Compra S/ {(50 - subtotal).toFixed(2)} más para envío gratis
                </p>
              )}
              <div className="border-t border-line pt-2 mt-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-text">Total</span>
                  <span className="font-bold text-brand text-xl">
                    S/ {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full mt-6 bg-brand hover:bg-brand-hover text-white font-medium py-3 rounded-md transition-colors"
            >
              Continuar al pago
            </button>

            <p className="text-xs text-center text-muted mt-3">
              Sede: {selectedLocation?.location_name || 'Sin seleccionar'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
