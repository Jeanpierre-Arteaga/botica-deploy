// ============================================================
// StaffNuevaVenta — Punto de venta (POS) presencial
// ============================================================
// Pantalla de venta en mostrador para emp/admin. Grilla de productos
// paginada (9 por página) con búsqueda + filtro de categoría + carrito
// + identificación de cliente por DNI (obligatorio) + método de pago +
// comprobante. Confirma contra POST /api/orders/walk-in (transacción con
// descuento de stock).
//
// Reglas del proyecto respetadas:
//  - Toda llamada al backend pasa por api.ts
//  - Sin confirm()/alert() nativos: se usa modal de confirmación
//  - Feedback con sonner; estados loading/empty
//  - emp solo ve productos de SU sede (location_id del JWT)
//  - Reutiliza Button/tokens de los prompts 1 y 2
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Minus, Trash2, CheckCircle2, Check, ShoppingBag, AlertCircle,
  User, Package, ChevronLeft, ChevronRight, X, IdCard, Wallet, Smartphone,
  CreditCard, Receipt, FileText, Download, LayoutGrid, type LucideIcon,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useLocations } from '../../lib/LocationContext';
import { toast } from 'sonner';
import type {
  Product, Customer, Category, Order,
  PaymentMethod, VoucherType,
} from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { CategoryChipsBar } from '../../components/CategoryChipsBar';
import { BillingFields } from '../../components/checkout/BillingFields';
import { isBillingValid, sanitizeRuc } from '../../lib/billing';

interface CartItem {
  product_id: number;
  product_name: string;
  unit_price: number;
  amount: number;
  max_stock: number;
  image_url?: string | null;
}

const POS_PAYMENT_METHODS: Array<{ value: Extract<PaymentMethod, 'efectivo' | 'yape' | 'plin' | 'tarjeta'>; label: string; icon: typeof Wallet }> = [
  { value: 'efectivo', label: 'Efectivo', icon: Wallet },
  { value: 'yape',     label: 'Yape',     icon: Smartphone },
  { value: 'plin',     label: 'Plin',     icon: Smartphone },
  { value: 'tarjeta',  label: 'Tarjeta',  icon: CreditCard },
];
const POS_VOUCHER_TYPES: VoucherType[] = ['boleta', 'ticket', 'factura'];

const PER_PAGE = 9; // 3x3 en desktop

export default function StaffNuevaVenta() {
  const { user } = useAuth();
  const { locations } = useLocations();
  const locationId = user?.location_id ?? 1; // admin sin sede → sede 1 por defecto
  const sedeName = locations.find((l) => l.location_id === locationId)?.location_name;

  // Productos (se cargan todos los de la sede; el filtrado es client-side)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Cliente
  const [dni, setDni] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [voucherType, setVoucherType] = useState<VoucherType>('boleta');
  // Datos fiscales (solo aplican a "factura"). Se limpian al cambiar de tipo.
  const [billingRuc, setBillingRuc] = useState('');
  const [billingName, setBillingName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Al salir de "factura" se ocultan y limpian los datos fiscales (igual que el
  // checkout del cliente). Misma validación reutilizada de lib/billing.
  function handleVoucherChange(v: VoucherType) {
    setVoucherType(v);
    if (v !== 'factura') {
      setBillingRuc('');
      setBillingName('');
    }
  }
  const billingValid = voucherType !== 'factura' || isBillingValid(billingRuc, billingName);

  // Modal de éxito (temporal, autocierra)
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  useEffect(() => {
    loadCategories();
  }, []);

  // Reiniciar a la primera página cuando cambian filtros/búsqueda
  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedCategory]);

  async function loadProducts() {
    setIsLoadingProducts(true);
    try {
      const data = await api.products.getAll({ location_id: locationId });
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

  // Filtro client-side por categoría + nombre
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      if (selectedCategory !== null && p.category_id !== selectedCategory) return false;
      if (q && !p.product_name?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filteredProducts.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

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
    // Email opcional: si se ingresa, validamos formato básico para no guardar
    // datos basura (el backend lo acepta tal cual). Sin email, queda "—" en el
    // detalle del pedido, que es correcto cuando el dato realmente no existe.
    const email = newCustomerEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.warning('El correo no tiene un formato válido');
      return;
    }
    setIsCreatingCustomer(true);
    try {
      const created = await api.customers.create({
        full_name: newCustomerName.trim(),
        dni,
        phone: newCustomerPhone.trim() || undefined,
        email: email || undefined,
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
    setNewCustomerEmail('');
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
    if (voucherType === 'factura' && !billingValid) {
      toast.warning('Completa los datos de facturación (RUC y razón social).');
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
          // Datos fiscales SOLO en factura (en boleta/ticket van ausentes).
          ...(voucherType === 'factura'
            ? { billing_ruc: sanitizeRuc(billingRuc), billing_name: billingName.trim() }
            : {}),
        },
      });

      setShowConfirm(false);
      setSuccessOrder(order);
      setCart([]);
      clearCustomer();
      // Restablece el comprobante y limpia los datos fiscales para la próxima venta.
      setVoucherType('boleta');
      setBillingRuc('');
      setBillingName('');
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-text">Nueva venta</h1>
        <p className="text-sm text-muted">
          Venta presencial (POS) · Sede: {sedeName || `#${locationId}`}
          {user?.role === 'admin' && ' (por defecto)'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* IZQUIERDA: productos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Buscador (ancho completo) + chips de categoría DEBAJO (flush izq.) */}
          <div className="bg-surface rounded-2xl border border-line shadow-soft p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto por nombre..."
                className="w-full h-11 pl-11 pr-3 bg-surface border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
              />
            </div>
            <div className="mt-3">
              <CategoryChipsBar
                categories={categories}
                selected={selectedCategory == null ? "" : String(selectedCategory)}
                onSelect={(v) => setSelectedCategory(v === "" ? null : Number(v))}
              />
            </div>
          </div>

          {/* Grilla paginada */}
          {isLoadingProducts ? (
            <div className="text-center py-12">
              <div className="inline-block w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-line shadow-soft p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-page flex items-center justify-center">
                <Package size={28} className="text-faint" />
              </div>
              <p className="font-semibold text-text">Sin resultados</p>
              <p className="text-sm text-muted mt-0.5">
                {searchQuery || selectedCategory !== null
                  ? 'No hay productos para este filtro'
                  : 'No hay productos en esta sede'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {pageItems.map((p) => (
                  <ProductCard
                    key={p.product_id}
                    product={p}
                    inCartAmount={cart.find((c) => c.product_id === p.product_id)?.amount ?? 0}
                    onAdd={() => addToCart(p)}
                  />
                ))}
              </div>

              {/* Paginación con flechas */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted">
                  Mostrando{' '}
                  <span className="font-semibold text-text">
                    {safePage * PER_PAGE + 1}–{Math.min((safePage + 1) * PER_PAGE, filteredProducts.length)}
                  </span>{' '}
                  de <span className="font-semibold text-text">{filteredProducts.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <PagerButton
                    label="Página anterior"
                    disabled={safePage === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft size={18} />
                  </PagerButton>
                  <span className="text-sm font-semibold text-text tabular-nums min-w-[4.5rem] text-center">
                    {safePage + 1} / {pageCount}
                  </span>
                  <PagerButton
                    label="Página siguiente"
                    disabled={safePage >= pageCount - 1}
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  >
                    <ChevronRight size={18} />
                  </PagerButton>
                </div>
              </div>
            </>
          )}
        </div>

        {/* DERECHA: cliente + carrito */}
        <div className="lg:col-span-1 space-y-4">
          <CustomerPanel
            dni={dni}
            setDni={setDni}
            customer={customer}
            isSearching={isSearchingCustomer}
            showCreate={showCreateCustomer}
            newName={newCustomerName}
            setNewName={setNewCustomerName}
            newPhone={newCustomerPhone}
            setNewPhone={setNewCustomerPhone}
            newEmail={newCustomerEmail}
            setNewEmail={setNewCustomerEmail}
            isCreating={isCreatingCustomer}
            onSearch={handleSearchCustomer}
            onCreate={handleCreateCustomer}
            onClear={clearCustomer}
          />

          <CartPanel
            cart={cart}
            subtotal={subtotal}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            voucherType={voucherType}
            setVoucherType={handleVoucherChange}
            billingRuc={billingRuc}
            setBillingRuc={setBillingRuc}
            billingName={billingName}
            setBillingName={setBillingName}
            billingValid={billingValid}
            hasCustomer={!!customer}
            isProcessing={isProcessing}
            onInc={(id) => updateAmount(id, 1)}
            onDec={(id) => updateAmount(id, -1)}
            onRemove={removeFromCart}
            onConfirm={requestConfirm}
          />
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirm && customer && (
        <ConfirmSaleModal
          customer={customer}
          itemCount={cart.length}
          paymentMethod={paymentMethod}
          voucherType={voucherType}
          billingRuc={billingRuc}
          billingName={billingName}
          total={subtotal}
          isProcessing={isProcessing}
          onConfirm={handleConfirmSale}
          onClose={() => setShowConfirm(false)}
        />
      )}

      {/* Modal de éxito temporal (~3s) */}
      {successOrder && (
        <SuccessModal order={successOrder} onClose={() => setSuccessOrder(null)} />
      )}
    </div>
  );
}

// ============================================================
// Tarjeta de producto (coherente con el catálogo público)
// ============================================================

function ProductCard({
  product, inCartAmount, onAdd,
}: {
  product: Product;
  inCartAmount: number;
  onAdd: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const stock = Number(product.current_stock ?? 0);
  const inCart = inCartAmount > 0;
  const stockTone =
    stock === 0 ? 'bg-error-soft text-error'
    : stock > 10 ? 'bg-success-soft text-success'
    : 'bg-warning-soft text-warning';

  return (
    <div
      className={`group bg-surface rounded-xl border p-3 flex flex-col h-full transition-all ${
        stock === 0
          ? 'opacity-60 border-line'
          : inCart
            ? 'border-brand shadow-card'
            : 'border-line hover:border-brand hover:shadow-card'
      }`}
    >
      <div className="relative aspect-square bg-photo rounded-lg mb-2 overflow-hidden flex items-center justify-center">
        <Package size={36} className="text-line" />
        {product.image_url && !imgError && (
          <img
            src={product.image_url}
            alt={product.product_name}
            className="absolute inset-0 w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        )}
        <span className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stockTone}`}>
          {stock > 0 ? `Stock ${stock}` : 'Agotado'}
        </span>
      </div>

      <p className="font-medium text-xs text-text line-clamp-2 mb-1.5 min-h-[2rem] leading-snug">
        {product.product_name}
      </p>

      <p className="text-brand font-bold text-sm mb-2 tabular-nums">
        S/ {Number(product.product_price).toFixed(2)}
      </p>

      <button
        onClick={onAdd}
        disabled={stock === 0}
        className={`mt-auto w-full h-9 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
          stock === 0
            ? 'bg-line-2 text-faint cursor-not-allowed'
            : inCart
              ? 'bg-brand-soft text-brand border border-brand'
              : 'bg-brand text-white hover:bg-brand-hover shadow-soft'
        }`}
      >
        {stock === 0 ? (
          'Sin stock'
        ) : inCart ? (
          <><CheckCircle2 size={14} /> En carrito: {inCartAmount}</>
        ) : (
          <><Plus size={14} /> Agregar</>
        )}
      </button>
    </div>
  );
}

function PagerButton({
  children, label, disabled, onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-10 h-10 flex items-center justify-center rounded-xl border border-line bg-surface text-ink-2 hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-ink-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand"
    >
      {children}
    </button>
  );
}

// CategoryChip se movió a components/CategoryChip.tsx (compartido con admin).

// ============================================================
// Panel Cliente
// ============================================================

function CustomerPanel({
  dni, setDni, customer, isSearching, showCreate, newName, setNewName,
  newPhone, setNewPhone, newEmail, setNewEmail, isCreating, onSearch, onCreate, onClear,
}: {
  dni: string;
  setDni: (v: string) => void;
  customer: Customer | null;
  isSearching: boolean;
  showCreate: boolean;
  newName: string;
  setNewName: (v: string) => void;
  newPhone: string;
  setNewPhone: (v: string) => void;
  newEmail: string;
  setNewEmail: (v: string) => void;
  isCreating: boolean;
  onSearch: () => void;
  onCreate: () => void;
  onClear: () => void;
}) {
  return (
    <section className="bg-surface rounded-2xl border border-line shadow-soft p-4">
      <h2 className="font-bold text-text mb-3 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <User size={16} />
        </span>
        Cliente
      </h2>

      {/* Estado: identificar por DNI */}
      {!customer && !showCreate && (
        <div className="space-y-2.5">
          <label className="block text-xs font-medium text-muted">DNI del cliente</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
                placeholder="8 dígitos"
                className="w-full h-10 pl-9 pr-3 bg-page border border-line rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
              />
            </div>
            <Button
              variant="info"
              iconLeft={Search}
              loading={isSearching}
              disabled={dni.length !== 8}
              onClick={onSearch}
            >
              Buscar
            </Button>
          </div>
          <p className="text-xs text-faint">DNI obligatorio para emitir el comprobante.</p>
        </div>
      )}

      {/* Estado: cliente nuevo (crear) */}
      {showCreate && (
        <div className="space-y-3 rounded-xl border border-warning/40 bg-warning-soft p-3">
          <p className="text-xs font-semibold text-warning flex items-center gap-1.5">
            <AlertCircle size={13} /> Cliente nuevo · DNI {dni}
          </p>
          <div>
            <label className="block text-xs font-medium text-text mb-1">Nombre completo *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Lucía Ramírez Soto"
              autoFocus
              className="w-full h-10 px-3 bg-surface border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text mb-1">Teléfono (opcional)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={9}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="9 dígitos"
              className="w-full h-10 px-3 bg-surface border border-line rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text mb-1">Correo (opcional)</label>
            <input
              type="email"
              inputMode="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="cliente@correo.com"
              className="w-full h-10 px-3 bg-surface border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
            />
            <p className="mt-1 text-[11px] text-faint">Para enviarle el comprobante y que pueda ver su pedido.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="success" iconLeft={Plus} loading={isCreating} onClick={onCreate} fullWidth>
              Crear cliente
            </Button>
            <Button variant="ghost" onClick={onClear} disabled={isCreating}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Estado: cliente encontrado */}
      {customer && (
        <div className="rounded-xl border border-success/40 bg-success-soft p-3">
          <div className="flex items-start gap-2.5">
            <span className="w-9 h-9 rounded-full bg-success text-white flex items-center justify-center font-bold shrink-0">
              {customer.full_name?.[0]?.toUpperCase() || 'C'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text text-sm truncate">{customer.full_name}</p>
              <p className="text-xs text-muted tabular-nums">DNI: {customer.dni || '—'}</p>
              {customer.phone && <p className="text-xs text-muted tabular-nums">Tel: {customer.phone}</p>}
              {customer.email && <p className="text-xs text-muted truncate">{customer.email}</p>}
            </div>
            <CheckCircle2 size={18} className="text-success shrink-0" />
          </div>
          <button
            onClick={onClear}
            className="mt-2.5 w-full text-xs font-medium text-muted hover:text-brand border border-line bg-surface rounded-lg py-1.5 transition-colors"
          >
            Cambiar cliente
          </button>
        </div>
      )}
    </section>
  );
}

// ============================================================
// Panel Venta actual (carrito)
// ============================================================

function CartPanel({
  cart, subtotal, paymentMethod, setPaymentMethod, voucherType, setVoucherType,
  billingRuc, setBillingRuc, billingName, setBillingName, billingValid,
  hasCustomer, isProcessing, onInc, onDec, onRemove, onConfirm,
}: {
  cart: CartItem[];
  subtotal: number;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  voucherType: VoucherType;
  setVoucherType: (v: VoucherType) => void;
  billingRuc: string;
  setBillingRuc: (v: string) => void;
  billingName: string;
  setBillingName: (v: string) => void;
  billingValid: boolean;
  hasCustomer: boolean;
  isProcessing: boolean;
  onInc: (id: number) => void;
  onDec: (id: number) => void;
  onRemove: (id: number) => void;
  onConfirm: () => void;
}) {
  return (
    <section className="bg-surface rounded-2xl border border-line shadow-soft p-4 lg:sticky lg:top-20">
      <h2 className="font-bold text-text mb-3 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <ShoppingBag size={16} />
        </span>
        Venta actual
        {cart.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-muted bg-surface-2 border border-line rounded-full px-2.5 py-0.5">
            {cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}
          </span>
        )}
      </h2>

      {cart.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-page flex items-center justify-center">
            <ShoppingBag size={24} className="text-faint" />
          </div>
          <p className="text-sm font-medium text-text">Carrito vacío</p>
          <p className="text-xs text-muted mt-0.5">Agrega productos desde la grilla</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-0.5">
            {cart.map((item) => (
              <div key={item.product_id} className="bg-surface-2 border border-line rounded-xl p-2.5">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="font-medium text-xs text-text line-clamp-2 flex-1 leading-snug">
                    {item.product_name}
                  </p>
                  <button
                    onClick={() => onRemove(item.product_id)}
                    className="shrink-0 text-faint hover:text-error transition-colors"
                    aria-label="Quitar producto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDec(item.product_id)}
                      className="w-7 h-7 border border-line rounded-lg flex items-center justify-center text-ink-2 hover:border-brand hover:text-brand bg-surface transition-colors disabled:opacity-40"
                      disabled={item.amount <= 1}
                      aria-label="Restar"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold tabular-nums">{item.amount}</span>
                    <button
                      onClick={() => onInc(item.product_id)}
                      className="w-7 h-7 border border-line rounded-lg flex items-center justify-center text-ink-2 hover:border-brand hover:text-brand bg-surface transition-colors"
                      aria-label="Sumar"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-text tabular-nums">
                    S/ {(item.unit_price * item.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-line pt-3 space-y-4">
            {/* Método de pago */}
            <div>
              <p className="text-xs font-semibold text-muted mb-2">Método de pago</p>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-2 border border-line">
                {POS_PAYMENT_METHODS.map((m) => {
                  const active = paymentMethod === m.value;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-surface text-brand shadow-soft'
                          : 'text-muted hover:text-ink-2'
                      }`}
                    >
                      <Icon size={14} /> {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comprobante */}
            <div>
              <p className="text-xs font-semibold text-muted mb-2">Comprobante</p>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-2 border border-line">
                {POS_VOUCHER_TYPES.map((v) => {
                  const active = voucherType === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setVoucherType(v)}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                        active
                          ? 'bg-surface text-brand shadow-soft'
                          : 'text-muted hover:text-ink-2'
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>

              {/* Datos fiscales: aparecen solo con "Factura" (mismo componente y
                  validación que el checkout del cliente). */}
              {voucherType === 'factura' && (
                <BillingFields
                  idPrefix="pos-billing"
                  ruc={billingRuc}
                  setRuc={setBillingRuc}
                  name={billingName}
                  setName={setBillingName}
                />
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold text-text">Total</span>
              <span className="text-2xl font-bold text-brand tabular-nums">S/ {subtotal.toFixed(2)}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isProcessing}
              disabled={cart.length === 0 || !hasCustomer || !billingValid}
              onClick={onConfirm}
            >
              Confirmar venta
            </Button>

            {!hasCustomer ? (
              <p className="text-xs text-error text-center flex items-center justify-center gap-1">
                <AlertCircle size={12} />
                Identifica al cliente primero
              </p>
            ) : voucherType === 'factura' && !billingValid ? (
              <p className="text-xs text-error text-center flex items-center justify-center gap-1">
                <AlertCircle size={12} />
                Completa los datos de facturación (RUC y razón social)
              </p>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}

// ============================================================
// Modales
// ============================================================

function ConfirmSaleModal({
  customer, itemCount, paymentMethod, voucherType, billingRuc, billingName, total, isProcessing, onConfirm, onClose,
}: {
  customer: Customer;
  itemCount: number;
  paymentMethod: PaymentMethod;
  voucherType: VoucherType;
  billingRuc: string;
  billingName: string;
  total: number;
  isProcessing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title="Confirmar venta" subtitle="Revisa el resumen antes de cobrar." icon={Receipt} onClose={onClose}>
      <div className="space-y-1 mb-5">
        <SummaryRow label="Cliente" value={customer.full_name} />
        <SummaryRow label="Productos" value={`${itemCount} ${itemCount === 1 ? 'ítem' : 'ítems'}`} />
        <SummaryRow label="Método de pago" value={paymentMethod} capitalize />
        <SummaryRow label="Comprobante" value={voucherType} capitalize />
        {voucherType === 'factura' && (
          <>
            <SummaryRow label="RUC" value={billingRuc} />
            <SummaryRow label="Razón social" value={billingName} />
          </>
        )}
      </div>
      <div className="flex items-center justify-between rounded-xl bg-brand-soft px-4 py-3 mb-5">
        <span className="font-semibold text-text">Total a cobrar</span>
        <span className="text-2xl font-bold text-brand tabular-nums">S/ {total.toFixed(2)}</span>
      </div>
      <div className="flex gap-2.5 justify-end">
        <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button variant="primary" iconLeft={CheckCircle2} loading={isProcessing} onClick={onConfirm}>
          Confirmar venta
        </Button>
      </div>
    </ModalShell>
  );
}

function SuccessModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const voucherType = (order.payment?.voucher_type as VoucherType) || 'boleta';
  const [phase, setPhase] = useState<'idle' | 'generating' | 'ready'>('idle');
  const [voucherUrl, setVoucherUrl] = useState<string | null>(order.payment?.voucher_pdf_url || null);

  async function handleGenerate() {
    setPhase('generating');
    try {
      // La animación dura mínimo ~3 s aunque el backend responda antes.
      const [, res] = await Promise.all([
        new Promise((r) => setTimeout(r, 3000)),
        api.orders.getVoucher(order.order_id),
      ]);
      setVoucherUrl(res.voucher_pdf_url);
      setPhase('ready');
    } catch (err) {
      const msg = err instanceof ApiError
        ? ((err.body as { message?: string })?.message || err.message)
        : 'Error al generar el comprobante';
      toast.error(msg);
      setPhase('idle');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={phase === 'generating' ? undefined : onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-pop max-w-sm w-full p-6 text-center animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Venta registrada"
      >
        {phase === 'generating' ? (
          // ---- Animación de carga ----
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-soft flex items-center justify-center">
              <div className="w-9 h-9 border-[3px] border-brand border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-lg font-bold text-text capitalize">Generando {voucherType}…</p>
            <p className="text-sm text-muted mt-1">Preparando tu comprobante en PDF</p>
          </div>
        ) : (
          <>
            {/* Check de éxito: anillo suave concéntrico + disco sólido */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <span className="absolute inset-0 rounded-full bg-success-soft" />
              <span className="absolute inset-[7px] rounded-full border-2 border-success/25" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-success flex items-center justify-center shadow-soft">
                  <Check size={26} strokeWidth={3} className="text-white" />
                </span>
              </span>
            </div>

            <h2 className="text-xl font-bold text-text">¡Venta registrada!</h2>
            <div className="mt-1.5 mb-5 flex justify-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted bg-surface-2 border border-line rounded-full px-3 py-1">
                <Receipt size={13} /> Pedido #{order.order_id}
              </span>
            </div>

            {/* Resumen: superficie neutra, divisores finos, total en naranja */}
            <div className="rounded-xl border border-line overflow-hidden text-left mb-5">
              <div className="divide-y divide-line-2">
                <SummaryRow label="Cliente" value={order.customer_name || '—'} padded />
                <SummaryRow label="Método" value={order.payment?.payment_method || '—'} capitalize padded />
                <SummaryRow label="Comprobante" value={voucherType} capitalize padded />
              </div>
              <div className="flex items-center justify-between bg-surface-2 border-t border-line px-4 py-3">
                <span className="font-semibold text-text">Total cobrado</span>
                <span className="text-xl font-bold text-brand tabular-nums">
                  S/ {Number(order.total_price).toFixed(2)}
                </span>
              </div>
            </div>

            {phase === 'ready' && voucherUrl ? (
              <div className="space-y-2">
                <a
                  href={voucherUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 h-12 px-6 rounded-xl bg-brand text-white font-semibold shadow-soft hover:bg-brand-hover active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <Download size={18} /> Ver / Descargar comprobante
                </a>
                <Button variant="ghost" fullWidth onClick={onClose}>
                  Nueva venta
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  iconLeft={FileText}
                  onClick={handleGenerate}
                >
                  Generar {voucherType}
                </Button>
                <Button variant="ghost" fullWidth onClick={onClose}>
                  Nueva venta
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, capitalize = false, padded = false }: { label: string; value: string; capitalize?: boolean; padded?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 text-sm ${padded ? 'px-4 py-2.5' : 'py-0.5'}`}>
      <span className="text-muted shrink-0">{label}</span>
      <span className={`text-right font-medium text-text truncate ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}

function ModalShell({
  title, subtitle, icon: Icon, children, onClose,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-pop max-w-md w-full max-h-[90vh] overflow-y-auto animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start gap-3 p-5 border-b border-line">
          {Icon && (
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
              <Icon size={20} />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-text leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-page hover:text-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
