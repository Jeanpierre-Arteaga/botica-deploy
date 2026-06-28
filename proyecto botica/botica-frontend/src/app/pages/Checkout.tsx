import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Truck, Store, CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { CardPayment } from '@mercadopago/sdk-react';
import { api } from '../lib/api';
import { ApiError } from '../lib/api';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/AuthContext';
import { useLocations } from '../lib/LocationContext';
import { Stepper } from '../components/Stepper';
import { Container } from '../components/Container';
import { PageHeader } from '../components/PageHeader';

type Step = 1 | 2 | 3;
type DeliveryType = 'delivery' | 'pickup';
type PaymentMethod = 'tarjeta' | 'yape' | 'plin' | 'efectivo' | 'transferencia';
type VoucherType = 'boleta' | 'factura' | 'ticket';

const STEPS = [
  { number: 1, label: 'Datos' },
  { number: 2, label: 'Pago' },
  { number: 3, label: 'Resumen' },
];

export function Checkout() {
  const { items, itemCount, subtotal, isEmpty, clear } = useCart();
  const { user } = useAuth();
  const { selectedLocation } = useLocations();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>(1);

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tarjeta');
  const [voucherType, setVoucherType] = useState<VoucherType>('boleta');

  const shippingCost = deliveryType === 'pickup' ? 0 : (subtotal >= 50 ? 0 : 8);
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (isEmpty) {
      toast.error('Tu carrito está vacío');
      navigate('/carrito');
      return;
    }
    if (!user || user.role !== 'cust') {
      toast.error('Debes iniciar sesión como cliente');
      navigate('/login');
      return;
    }
  }, [isEmpty, user, navigate]);

  const canGoNext = (): boolean => {
    if (currentStep === 1) {
      if (deliveryType === 'delivery') {
        return address.trim().length > 5 && phone.trim().length >= 9;
      }
      return phone.trim().length >= 9;
    }
    if (currentStep === 2) {
      return !!paymentMethod;
    }
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      toast.warning('Completa todos los campos requeridos');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const buildOrderPayload = (extra?: Partial<Parameters<typeof api.orders.create>[0]>) => ({
    items: items.map((i) => ({
      product_id: i.product_id,
      amount: i.amount,
      unit_price: i.unit_price,
    })),
    delivery_type: deliveryType,
    address: deliveryType === 'delivery' ? address : null,
    phone,
    notes,
    payment_method: paymentMethod,
    voucher_type: voucherType,
    location_id: selectedLocation?.location_id ?? 0,
    ...extra,
  });

  const handleOrderError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.status === 402) {
        const detail =
          (err.body as { status_detail?: string } | undefined)?.status_detail ||
          'Inténtalo de nuevo';
        toast.error('Pago rechazado: ' + detail);
        return;
      }
      if (err.status === 409) {
        toast.error('Stock insuficiente. Revisa tu carrito.');
        return;
      }
      toast.error(err.message || 'Error al crear el pedido');
      return;
    }
    toast.error('Error al crear el pedido');
  };

  // Submit cuando el Card Brick devuelve el token.
  // El SDK pasa el formData directamente como primer argumento (no envuelto).
  const handleCardPaymentSubmit = async (formData: any) => {
    if (!selectedLocation?.location_id) {
      toast.error('Selecciona una sede primero.');
      return;
    }
    try {
      const order = await api.orders.create(
        buildOrderPayload({
          card_token: formData.token,
          mp_payment_method_id: formData.payment_method_id,
          installments: formData.installments,
          payer_email: formData.payer?.email,
          payer_identification: formData.payer?.identification,
        })
      );

      clear();
      toast.success(`Pedido #${order.order_id} creado correctamente`);
      navigate(`/confirmacion/${order.order_id}`);
    } catch (err) {
      handleOrderError(err);
    }
  };

  // Submit para métodos manuales (yape/plin/efectivo/transferencia)
  const handleManualPaymentSubmit = async () => {
    if (!selectedLocation?.location_id) {
      toast.error('Selecciona una sede primero.');
      return;
    }
    setIsSubmitting(true);
    try {
      const order = await api.orders.create(buildOrderPayload());

      clear();
      const msg =
        paymentMethod === 'efectivo'
          ? `Pedido #${order.order_id} creado. Paga al recibir.`
          : `Pedido #${order.order_id} registrado. Esperando validación de pago.`;
      toast.success(msg);
      navigate(`/confirmacion/${order.order_id}`);
    } catch (err) {
      handleOrderError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmpty || !user) return null;

  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/' },
          { label: 'Carrito', to: '/carrito' },
          { label: 'Finalizar compra' },
        ]}
        title="Finalizar compra"
      />

      <Stepper steps={STEPS} currentStep={currentStep} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl border border-line p-6">
            {currentStep === 1 && (
              <StepDatos
                deliveryType={deliveryType}
                setDeliveryType={setDeliveryType}
                address={address}
                setAddress={setAddress}
                phone={phone}
                setPhone={setPhone}
                notes={notes}
                setNotes={setNotes}
              />
            )}
            {currentStep === 2 && (
              <StepPago
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                voucherType={voucherType}
                setVoucherType={setVoucherType}
              />
            )}
            {currentStep === 3 && (
              <>
                <StepResumen
                  items={items}
                  deliveryType={deliveryType}
                  address={address}
                  phone={phone}
                  notes={notes}
                  paymentMethod={paymentMethod}
                  voucherType={voucherType}
                  subtotal={subtotal}
                  shippingCost={shippingCost}
                  total={total}
                  customer={user}
                  location={selectedLocation}
                />

                <div className="mt-6 border-t border-line pt-6">
                  {paymentMethod === 'tarjeta' && (
                    <div>
                      <h3 className="font-bold text-text mb-3">Datos de la tarjeta</h3>
                      <p className="text-sm text-muted mb-4">
                        Tus datos están protegidos por MercadoPago. La botica nunca verá tu tarjeta.
                      </p>
                      <CardPayment
                        initialization={{ amount: total }}
                        onSubmit={handleCardPaymentSubmit}
                        onError={(err) => {
                          console.error('MP error:', err);
                          toast.error('Error en el formulario de pago');
                        }}
                      />
                      <div className="mt-4 p-3 bg-brand-soft rounded-md text-xs text-muted">
                        <strong>Tarjetas de prueba (sandbox):</strong>
                        <br />
                        Visa: 4509 9535 6623 3704
                        <br />
                        Mastercard: 5031 7557 3453 0604
                        <br />
                        CVV: 123 — Vencimiento: 11/30 — Titular: APRO
                      </div>
                    </div>
                  )}

                  {(paymentMethod === 'yape' || paymentMethod === 'plin') && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-text">
                        Instrucciones de pago — {paymentMethod === 'yape' ? 'Yape' : 'Plin'}
                      </h3>
                      <div className="bg-brand-soft border border-brand rounded-lg p-4 space-y-2">
                        <p className="font-semibold text-text">Realiza el pago a:</p>
                        <p className="text-2xl font-bold text-brand">987 654 321</p>
                        <p className="text-sm text-muted">Botica Central S.A.C.</p>
                        <p className="text-sm text-muted">
                          Monto: <strong>S/ {total.toFixed(2)}</strong>
                        </p>
                      </div>
                      <p className="text-sm text-muted">
                        Una vez completado el pago, confirma tu pedido. El staff validará el pago
                        y procesará tu pedido en las próximas horas.
                      </p>
                      <button
                        onClick={handleManualPaymentSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-medium py-3 rounded-md"
                      >
                        {isSubmitting
                          ? 'Procesando...'
                          : `Confirmar que ya pagué con ${paymentMethod === 'yape' ? 'Yape' : 'Plin'}`}
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'efectivo' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-text">Pago en efectivo contra entrega</h3>
                      <div className="bg-brand-soft border border-brand rounded-lg p-4">
                        <p className="text-sm text-text">
                          Pagarás <strong>S/ {total.toFixed(2)}</strong> en efectivo cuando recibas
                          tu pedido.
                        </p>
                        <p className="text-xs text-muted mt-2">
                          Por favor, ten el monto exacto preparado para facilitar la entrega.
                        </p>
                      </div>
                      <button
                        onClick={handleManualPaymentSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-medium py-3 rounded-md"
                      >
                        {isSubmitting ? 'Procesando...' : 'Confirmar pedido (pago contra entrega)'}
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'transferencia' && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-text">Transferencia bancaria</h3>
                      <div className="bg-brand-soft border border-brand rounded-lg p-4 space-y-2 text-sm">
                        <p><strong>Banco:</strong> BCP</p>
                        <p><strong>Cuenta:</strong> 191-1234567890-0-12</p>
                        <p><strong>CCI:</strong> 002-191-001234567890-12</p>
                        <p><strong>Titular:</strong> Botica Central S.A.C.</p>
                        <p><strong>RUC:</strong> 20512345678</p>
                        <p><strong>Monto:</strong> S/ {total.toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-muted">
                        Realiza la transferencia y confirma tu pedido. El staff validará el pago
                        y procesará tu pedido.
                      </p>
                      <button
                        onClick={handleManualPaymentSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-medium py-3 rounded-md"
                      >
                        {isSubmitting ? 'Procesando...' : 'Confirmar pedido (transferencia)'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={currentStep === 1 ? () => navigate('/carrito') : handleBack}
              className="flex items-center gap-2 px-4 py-2 text-muted hover:text-text font-medium"
            >
              <ArrowLeft size={18} />
              {currentStep === 1 ? 'Volver al carrito' : 'Anterior'}
            </button>

            {currentStep < 3 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-hover text-white font-medium rounded-md transition-colors"
              >
                Siguiente
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl border border-line p-6 sticky top-4">
            <h3 className="font-bold text-text mb-3">Resumen</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Productos ({itemCount})</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Envío</span>
                <span>
                  {shippingCost === 0 ? (
                    <span className="text-success">Gratis</span>
                  ) : (
                    `S/ ${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="border-t border-line pt-2 mt-2 flex justify-between items-baseline">
                <span className="font-bold">Total</span>
                <span className="font-bold text-brand text-lg">
                  S/ {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

// ============================================================
// SUB-COMPONENTES POR PASO
// ============================================================

interface StepDatosProps {
  deliveryType: DeliveryType;
  setDeliveryType: (v: DeliveryType) => void;
  address: string;
  setAddress: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}

function StepDatos(props: StepDatosProps) {
  const { deliveryType, setDeliveryType, address, setAddress, phone, setPhone, notes, setNotes } = props;

  return (
    <div>
      <h2 className="font-bold text-text text-xl mb-4">Datos de entrega</h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setDeliveryType('delivery')}
          className={`p-4 rounded-lg border-2 text-left transition-colors ${
            deliveryType === 'delivery'
              ? 'border-brand bg-brand-soft'
              : 'border-line hover:border-brand/40'
          }`}
        >
          <Truck className="mb-2 text-brand" size={24} />
          <p className="font-semibold text-text">Delivery</p>
          <p className="text-xs text-muted">Recibe en tu domicilio</p>
        </button>

        <button
          onClick={() => setDeliveryType('pickup')}
          className={`p-4 rounded-lg border-2 text-left transition-colors ${
            deliveryType === 'pickup'
              ? 'border-brand bg-brand-soft'
              : 'border-line hover:border-brand/40'
          }`}
        >
          <Store className="mb-2 text-brand" size={24} />
          <p className="font-semibold text-text">Recojo en tienda</p>
          <p className="text-xs text-muted">Gratis, en la sede</p>
        </button>
      </div>

      <div className="space-y-4">
        {deliveryType === 'delivery' && (
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Dirección de entrega <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Av. Javier Prado 123, San Isidro"
              className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Teléfono de contacto <span className="text-error">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="987654321"
            maxLength={9}
            className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Notas adicionales <span className="text-faint text-xs">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Referencias del lugar, instrucciones especiales..."
            rows={3}
            className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand resize-none"
          />
        </div>
      </div>
    </div>
  );
}

interface StepPagoProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  voucherType: VoucherType;
  setVoucherType: (v: VoucherType) => void;
}

function StepPago(props: StepPagoProps) {
  const { paymentMethod, setPaymentMethod, voucherType, setVoucherType } = props;

  const methods: { id: PaymentMethod; label: string; icon: typeof CreditCard; desc: string }[] = [
    { id: 'tarjeta', label: 'Tarjeta de crédito/débito', icon: CreditCard, desc: 'Visa, Mastercard, Amex' },
    { id: 'yape', label: 'Yape', icon: Smartphone, desc: 'Paga con tu app Yape' },
    { id: 'plin', label: 'Plin', icon: Smartphone, desc: 'Paga con tu app Plin' },
    { id: 'efectivo', label: 'Efectivo contra entrega', icon: Banknote, desc: 'Paga cuando recibas tu pedido' },
    { id: 'transferencia', label: 'Transferencia bancaria', icon: Building2, desc: 'BCP, BBVA, Interbank, Scotiabank' },
  ];

  const voucherOptions: VoucherType[] = ['boleta', 'factura', 'ticket'];

  return (
    <div>
      <h2 className="font-bold text-text text-xl mb-4">Método de pago</h2>

      <div className="space-y-2 mb-6">
        {methods.map((m) => {
          const Icon = m.icon;
          const active = paymentMethod === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setPaymentMethod(m.id)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-colors flex items-center gap-3 ${
                active
                  ? 'border-brand bg-brand-soft'
                  : 'border-line hover:border-brand/40'
              }`}
            >
              <Icon size={24} className={active ? 'text-brand' : 'text-muted'} />
              <div className="flex-1">
                <p className="font-semibold text-text">{m.label}</p>
                <p className="text-xs text-muted">{m.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-brand' : 'border-line'}`}>
                {active && <div className="w-2.5 h-2.5 bg-brand rounded-full" />}
              </div>
            </button>
          );
        })}
      </div>

      <h3 className="font-semibold text-text mb-2">Tipo de comprobante</h3>
      <div className="grid grid-cols-3 gap-2">
        {voucherOptions.map((v) => (
          <button
            key={v}
            onClick={() => setVoucherType(v)}
            className={`p-2 rounded-md border-2 text-sm font-medium capitalize transition-colors ${
              voucherType === v
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line text-muted hover:border-brand/40'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

interface StepResumenProps {
  items: ReturnType<typeof useCart>['items'];
  deliveryType: DeliveryType;
  address: string;
  phone: string;
  notes: string;
  paymentMethod: PaymentMethod;
  voucherType: VoucherType;
  subtotal: number;
  shippingCost: number;
  total: number;
  customer: NonNullable<ReturnType<typeof useAuth>['user']>;
  location: ReturnType<typeof useLocations>['selectedLocation'];
}

function StepResumen(props: StepResumenProps) {
  const { items, deliveryType, address, phone, notes, paymentMethod, voucherType, customer, location } = props;

  const paymentLabels: Record<PaymentMethod, string> = {
    tarjeta: 'Tarjeta',
    yape: 'Yape',
    plin: 'Plin',
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
  };

  return (
    <div>
      <h2 className="font-bold text-text text-xl mb-4">Resumen del pedido</h2>

      <div className="space-y-3 mb-6">
        <div className="border border-line rounded-lg p-3">
          <p className="text-xs text-muted mb-1">Cliente</p>
          <p className="font-semibold text-text">{customer.full_name}</p>
          <p className="text-sm text-muted">Tel: {phone}</p>
        </div>

        <div className="border border-line rounded-lg p-3">
          <p className="text-xs text-muted mb-1">Entrega</p>
          {deliveryType === 'delivery' ? (
            <>
              <p className="font-semibold text-text">Delivery a domicilio</p>
              <p className="text-sm text-muted">{address}</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-text">Recojo en tienda</p>
              <p className="text-sm text-muted">{location?.location_name}</p>
            </>
          )}
          {notes && <p className="text-xs text-muted italic mt-1">Nota: {notes}</p>}
        </div>

        <div className="border border-line rounded-lg p-3">
          <p className="text-xs text-muted mb-1">Pago</p>
          <p className="font-semibold text-text">{paymentLabels[paymentMethod]}</p>
          <p className="text-sm text-muted capitalize">Comprobante: {voucherType}</p>
        </div>
      </div>

      <h3 className="font-semibold text-text mb-2">Productos ({items.length})</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.product_id} className="flex justify-between items-start py-2 border-b border-line last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-text line-clamp-1">{item.product_name}</p>
              <p className="text-xs text-muted">{item.amount} x S/ {item.unit_price.toFixed(2)}</p>
            </div>
            <p className="font-semibold text-sm">S/ {(item.unit_price * item.amount).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
