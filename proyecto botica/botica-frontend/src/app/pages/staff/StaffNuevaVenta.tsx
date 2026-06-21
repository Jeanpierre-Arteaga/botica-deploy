// ============================================================
// StaffNuevaVenta — Punto de venta (POS) presencial
// ============================================================
// Pantalla de venta en mostrador para emp/admin. Grid de productos
// con búsqueda + carrito + identificación de cliente por DNI
// (obligatorio) + método de pago + comprobante. Confirma contra
// POST /api/orders/walk-in (transacción con descuento de stock).
//
// Reglas del proyecto respetadas:
//  - Toda llamada al backend pasa por api.ts
//  - Sin confirm()/alert() nativos: se usa modal de confirmación
//  - Feedback con sonner; estados loading/empty
//  - emp solo ve productos de SU sede (location_id del JWT)
// ============================================================

import { useState, useEffect } from 'react';
import {
  Search, Plus, Minus, Trash2, CheckCircle2,
  ShoppingBag, AlertCircle, User, Package,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useLocations } from '../../lib/LocationContext';
import { toast } from 'sonner';
import type {
  Product, Customer, Category, Order,
  PaymentMethod, VoucherType,
} from '../../lib/types';

interface CartItem {
  product_id: number;
  product_name: string;
  unit_price: number;
  amount: number;
  max_stock: number;
  image_url?: string | null;
}

const POS_PAYMENT_METHODS: Array<Extract<PaymentMethod, 'efectivo' | 'yape' | 'plin' | 'tarjeta'>> = [
  'efectivo', 'yape', 'plin', 'tarjeta',
];
const POS_VOUCHER_TYPES: VoucherType[] = ['boleta', 'ticket', 'factura'];

export default function StaffNuevaVenta() {
  const { user } = useAuth();
  const { locations } = useLocations();
  const locationId = user?.location_id ?? 1; // admin sin sede → sede 1 por defecto
  const sedeName = locations.find((l) => l.location_id === locationId)?.location_name;

  // Productos
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Cliente
  const [dni, setDni] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [voucherType, setVoucherType] = useState<VoucherType>('boleta');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Modal de éxito
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, selectedCategory]);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProducts() {
    setIsLoadingProducts(true);
    try {
      const data = await api.products.getAll({
        location_id: locationId,
        category_id: selectedCategory ?? undefined,
      });
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar productos');
    } finally {
      setIsLoadingProducts(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  }

  // Búsqueda local sobre los productos ya cargados de la sede (solo por nombre)
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return p.product_name?.toLowerCase().includes(q);
  });

  function addToCart(product: Product) {
    const stock = Number(product.current_stock ?? 0);
    if (stock <= 0) {
      toast.warning('Producto sin stock');
      return;
    }

    const existing = cart.find((c) => c.product_id === product.product_id);
    if (existing) {
      if (existing.amount >= stock) {
        toast.warning(`Stock máximo: ${stock} unidades`);
        return;
      }
      setCart(cart.map((c) =>
        c.product_id === product.product_id ? { ...c, amount: c.amount + 1 } : c
      ));
    } else {
      setCart([...cart, {
        product_id: product.product_id,
        product_name: product.product_name,
        unit_price: Number(product.product_price),
        amount: 1,
        max_stock: stock,
        image_url: product.image_url,
      }]);
    }
  }

  function updateAmount(product_id: number, delta: number) {
    setCart(cart.map((c) => {
      if (c.product_id !== product_id) return c;
      const newAmount = c.amount + delta;
      if (newAmount < 1) return c;
      if (newAmount > c.max_stock) {
        toast.warning(`Stock máximo: ${c.max_stock}`);
        return c;
      }
      return { ...c, amount: newAmount };
    }));
  }

  function removeFromCart(product_id: number) {
    setCart(cart.filter((c) => c.product_id !== product_id));
  }

  async function handleSearchCustomer() {
    if (dni.length !== 8) {
      toast.warning('DNI debe tener 8 dígitos');
      return;
    }
    setIsSearchingCustomer(true);
    try {
      const found = await api.customers.getByDni(dni);
      setCustomer(found);
      setShowCreateCustomer(false);
      toast.success(`Cliente: ${found.full_name}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setCustomer(null);
        setShowCreateCustomer(true);
        toast.info('Cliente nuevo. Completa los datos.');
      } else {
        toast.error('Error al buscar cliente');
      }
    } finally {
      setIsSearchingCustomer(false);
    }
  }

  async function handleCreateCustomer() {
    if (!newCustomerName.trim()) {
      toast.warning('Nombre obligatorio');
      return;
    }
    setIsCreatingCustomer(true);
    try {
      const created = await api.customers.create({
        full_name: newCustomerName.trim(),
        dni,
        phone: newCustomerPhone.trim() || undefined,
      });
      setCustomer(created);
      setShowCreateCustomer(false);
      toast.success('Cliente creado');
    } catch (err) {
      const message = err instanceof ApiError
        ? ((err.body as { message?: string })?.message || err.message)
        : 'Error al crear cliente';
      toast.error(message);
    } finally {
      setIsCreatingCustomer(false);
    }
  }

  function clearCustomer() {
    setDni('');
    setCustomer(null);
    setShowCreateCustomer(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
  }

  const subtotal = cart.reduce((sum, c) => sum + c.unit_price * c.amount, 0);

  function requestConfirm() {
    if (cart.length === 0) {
      toast.warning('Agrega productos al carrito');
      return;
    }
    if (!customer) {
      toast.warning('Identifica al cliente primero (DNI)');
      return;
    }
    setShowConfirm(true);
  }

  async function handleConfirmSale() {
    if (!customer) return;
    setIsProcessing(true);
    try {
      const order = await api.orders.createWalkIn({
        order: {
          delivery_type: 'pickup',
          location_id: locationId,
          customer_id: customer.customer_id,
          total_price: subtotal,
        },
        details: cart.map((c) => ({
          product_id: c.product_id,
          amount: c.amount,
          unit_price: c.unit_price,
          sub_total_price: c.unit_price * c.amount,
        })),
        payment: {
          payment_method: paymentMethod,
          voucher_type: voucherType,
        },
      });

      setShowConfirm(false);
      setSuccessOrder(order);
      setCart([]);
      clearCustomer();
      // Recargar productos para reflejar el stock actualizado
      await loadProducts();
    } catch (err) {
      const message = err instanceof ApiError
        ? ((err.body as { message?: string })?.message || err.message)
        : 'Error al procesar venta';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }

  // ---- Pantalla de éxito ----
  if (successOrder) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-surface rounded-2xl border border-line p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-success-soft rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-success" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">¡Venta registrada!</h1>
          <p className="text-muted mb-6">Pedido #{successOrder.order_id}</p>

          <div className="bg-brand-soft rounded-xl p-6 mb-6 text-left max-w-md mx-auto">
            <div className="flex justify-between mb-2">
              <span className="text-muted">Cliente:</span>
              <span className="font-medium">{successOrder.customer_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted">Método:</span>
              <span className="font-medium capitalize">{successOrder.payment?.payment_method}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted">Comprobante:</span>
              <span className="font-medium capitalize">{successOrder.payment?.voucher_type}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-line">
              <span className="font-bold">Total cobrado:</span>
              <span className="font-bold text-brand text-xl">
                S/ {Number(successOrder.total_price).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setSuccessOrder(null)}
            className="px-8 py-3 bg-brand hover:bg-brand-hover text-white font-medium rounded-md transition-colors"
          >
            Nueva venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text">Nueva venta</h1>
          <p className="text-sm text-muted">
            Sede: {sedeName || `#${locationId}`}
            {user?.role === 'admin' && ' (por defecto)'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* IZQUIERDA: productos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface rounded-xl border border-line p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto por nombre..."
                className="w-full pl-10 pr-3 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              <CategoryChip active={selectedCategory === null} onClick={() => setSelectedCategory(null)}>
                Todos
              </CategoryChip>
              {categories.slice(0, 8).map((c) => (
                <CategoryChip
                  key={c.category_id}
                  active={selectedCategory === c.category_id}
                  onClick={() => setSelectedCategory(c.category_id)}
                >
                  {c.category_name}
                </CategoryChip>
              ))}
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="text-center py-12">
              <div className="inline-block w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-surface rounded-xl border border-line p-12 text-center text-muted">
              {searchQuery
                ? `No se encontraron productos para "${searchQuery}"`
                : 'No hay productos en esta sede'}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const stock = Number(p.current_stock ?? 0);
                const inCart = cart.find((c) => c.product_id === p.product_id);
                return (
                  <div
                    key={p.product_id}
                    className={`bg-surface rounded-xl border-2 p-3 flex flex-col transition-all ${
                      stock === 0
                        ? 'opacity-50 border-line'
                        : inCart
                          ? 'border-brand shadow-md'
                          : 'border-line hover:border-brand hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-square bg-brand-soft rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Package size={40} className="text-brand" />
                      )}
                    </div>

                    <p className="font-medium text-xs text-text line-clamp-2 mb-1 min-h-[2rem]">
                      {p.product_name}
                    </p>

                    <p className={`text-xs mb-1 ${
                      stock > 10 ? 'text-success' : stock > 0 ? 'text-warning' : 'text-error'
                    }`}>
                      {stock > 0 ? `Stock: ${stock}` : 'Sin stock'}
                    </p>

                    <p className="text-brand font-bold text-sm mb-2">
                      S/ {Number(p.product_price).toFixed(2)}
                    </p>

                    <button
                      onClick={() => addToCart(p)}
                      disabled={stock === 0}
                      className={`mt-auto w-full px-3 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                        stock === 0
                          ? 'bg-line text-faint cursor-not-allowed'
                          : inCart
                            ? 'bg-brand text-white hover:bg-brand-hover'
                            : 'bg-ink text-white hover:bg-brand'
                      }`}
                    >
                      <Plus size={14} />
                      {stock === 0 ? 'Sin stock' : inCart ? `En carrito: ${inCart.amount}` : 'Agregar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DERECHA: cliente + carrito */}
        <div className="lg:col-span-1 space-y-4">
          {/* Cliente */}
          <section className="bg-surface rounded-xl border border-line p-4">
            <h2 className="font-bold text-text mb-3 flex items-center gap-2">
              <User size={16} className="text-brand" />
              Cliente
            </h2>

            {!customer && !showCreateCustomer && (
              <div className="space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchCustomer(); }}
                  placeholder="DNI (8 dígitos)"
                  className="w-full px-3 py-2 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  onClick={handleSearchCustomer}
                  disabled={dni.length !== 8 || isSearchingCustomer}
                  className="w-full px-3 py-2 bg-cool hover:bg-cool/90 text-white font-medium rounded-md text-sm disabled:opacity-50"
                >
                  {isSearchingCustomer ? 'Buscando...' : 'Buscar cliente'}
                </button>
                <p className="text-xs text-muted">
                  DNI obligatorio para emitir comprobante
                </p>
              </div>
            )}

            {showCreateCustomer && (
              <div className="space-y-2 bg-warning-soft rounded-md p-3">
                <p className="text-xs text-warning font-medium">Cliente nuevo · DNI: {dni}</p>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Nombre completo *"
                  className="w-full px-3 py-2 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Teléfono (opcional)"
                  className="w-full px-3 py-2 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateCustomer}
                    disabled={isCreatingCustomer}
                    className="flex-1 px-3 py-2 bg-success hover:bg-success/90 text-white font-medium rounded-md text-sm disabled:opacity-50"
                  >
                    {isCreatingCustomer ? 'Creando...' : 'Crear cliente'}
                  </button>
                  <button
                    onClick={clearCustomer}
                    className="px-3 py-2 border border-muted text-muted rounded-md text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {customer && (
              <div className="bg-success-soft border border-success rounded-md p-3">
                <p className="font-medium text-success text-sm">{customer.full_name}</p>
                <p className="text-xs text-success">DNI: {customer.dni || '—'}</p>
                {customer.phone && <p className="text-xs text-success">Tel: {customer.phone}</p>}
                <button
                  onClick={clearCustomer}
                  className="mt-2 text-xs text-success underline"
                >
                  Cambiar cliente
                </button>
              </div>
            )}
          </section>

          {/* Carrito */}
          <section className="bg-surface rounded-xl border border-line p-4">
            <h2 className="font-bold text-text mb-3 flex items-center gap-2">
              <ShoppingBag size={16} className="text-brand" />
              Venta actual ({cart.length})
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <ShoppingBag size={32} className="mx-auto text-line mb-2" />
                <p className="text-sm">No hay productos</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.product_id} className="bg-page rounded-md p-2">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-xs text-text line-clamp-2 flex-1">
                          {item.product_name}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-error hover:text-error ml-1"
                          aria-label="Quitar producto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateAmount(item.product_id, -1)}
                            className="w-6 h-6 border border-line rounded flex items-center justify-center hover:bg-surface"
                            aria-label="Restar"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.amount}</span>
                          <button
                            onClick={() => updateAmount(item.product_id, 1)}
                            className="w-6 h-6 border border-line rounded flex items-center justify-center hover:bg-surface"
                            aria-label="Sumar"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-brand">
                          S/ {(item.unit_price * item.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-line pt-3 space-y-3">
                  <div className="flex justify-between">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-brand text-xl">
                      S/ {subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-text mb-2">Método de pago</p>
                    <div className="grid grid-cols-2 gap-2">
                      {POS_PAYMENT_METHODS.map((m) => (
                        <button
                          key={m}
                          onClick={() => setPaymentMethod(m)}
                          className={`px-2 py-2 rounded-md text-xs font-medium capitalize transition-colors ${
                            paymentMethod === m
                              ? 'bg-brand text-white'
                              : 'bg-page text-muted hover:bg-line-2'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-text mb-2">Comprobante</p>
                    <div className="grid grid-cols-3 gap-2">
                      {POS_VOUCHER_TYPES.map((v) => (
                        <button
                          key={v}
                          onClick={() => setVoucherType(v)}
                          className={`px-2 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                            voucherType === v
                              ? 'bg-ink text-white'
                              : 'bg-page text-muted hover:bg-line-2'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={requestConfirm}
                    disabled={isProcessing || cart.length === 0 || !customer}
                    className="w-full px-4 py-3 bg-brand hover:bg-brand-hover text-white font-bold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? 'Procesando...' : `Confirmar venta · S/ ${subtotal.toFixed(2)}`}
                  </button>

                  {!customer && cart.length > 0 && (
                    <p className="text-xs text-error text-center flex items-center justify-center gap-1">
                      <AlertCircle size={12} />
                      Identifica al cliente primero
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Modal de confirmación de venta (sin confirm() nativo) */}
      {showConfirm && customer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-text mb-4">Confirmar venta</h2>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-muted">Cliente:</span>
                <span className="font-medium">{customer.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Productos:</span>
                <span className="font-medium">{cart.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Método:</span>
                <span className="font-medium capitalize">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Comprobante:</span>
                <span className="font-medium capitalize">{voucherType}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-line">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-brand text-lg">S/ {subtotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmSale}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-md disabled:opacity-50"
              >
                {isProcessing ? 'Procesando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isProcessing}
                className="px-4 py-2.5 border border-line text-muted rounded-md hover:bg-page disabled:opacity-50"
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

function CategoryChip({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-brand text-white'
          : 'bg-page text-muted hover:bg-line-2'
      }`}
    >
      {children}
    </button>
  );
}
