import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, ArrowRight, Truck, Store, CreditCard, Banknote, Smartphone,
  Building2, ShieldCheck, Package, Landmark, type LucideIcon,
} from 'lucide-react';
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
import { CopyButton } from '../components/CopyButton';
import {
  ProcessingOverlay,
  PaymentSuccessModal,
  PaymentErrorModal,
} from '../components/checkout/PaymentFeedback';
import type { Order } from '../lib/types';

type Step = 1 | 2 | 3;
type DeliveryType = 'delivery' | 'pickup';
type PaymentMethod = 'tarjeta' | 'yape' | 'plin' | 'efectivo' | 'transferencia';
type VoucherType = 'boleta' | 'factura' | 'ticket';

const STEPS = [
  { number: 1, label: 'Datos' },
  { number: 2, label: 'Pago' },
  { number: 3, label: 'Resumen' },
];

// Datos de cobro de la botica (sandbox / demo). Centralizados aquí para no
// repetir el dato en cada panel y mantener un único punto de verdad.
const PAY_INFO = {
  walletPhone: '987 654 321',
  business: 'Botica Central S.A.C.',
  bank: 'BCP',
  account: '191-1234567890-0-12',
  cci: '002-191-001234567890-12',
  ruc: '20512345678',
};

// Máquina de estados de la retroalimentación post-pago.
type Feedback =
  | { kind: 'idle' }
  | { kind: 'processing'; method: PaymentMethod }
  | { kind: 'success'; order: Order; method: PaymentMethod; itemCount: number }
  | { kind: 'error'; title: string; message: string; canRetry: boolean };

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

  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle' });

  const shippingCost = deliveryType === 'pickup' ? 0 : (subtotal >= 50 ? 0 : 8);
  const total = subtotal + shippingCost;

  useEffect(() => {
    // No redirigir mientras hay un flujo de pago en curso o un modal de
    // resultado abierto (en éxito el carrito ya se vació a propósito).
    if (feedback.kind !== 'idle') return;
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
  }, [isEmpty, user, navigate, feedback.kind]);

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

  // Traduce un error del backend a contenido del modal de error.
  const toErrorFeedback = (err: unknown): Feedback => {
    if (err instanceof ApiError) {
      if (err.status === 402) {
        const detail = (err.body as { status_detail?: string } | undefined)?.status_detail;
        return {
          kind: 'error',
          title: 'Pago rechazado',
          message: detail
            ? `Tu pago no pudo procesarse (${detail}). Revisa los datos de tu tarjeta e inténtalo de nuevo.`
            : 'Tu pago fue rechazado. Revisa los datos de tu tarjeta e inténtalo de nuevo.',
          canRetry: true,
        };
      }
      if (err.status === 409) {
        return {
          kind: 'error',
          title: 'Stock insuficiente',
          message:
            'Algún producto de tu carrito ya no tiene stock suficiente. Ajusta las cantidades en el carrito e inténtalo de nuevo.',
          canRetry: false,
        };
      }
      if (err.status === 0) {
        return {
          kind: 'error',
          title: 'Sin conexión',
          message: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
          canRetry: true,
        };
      }
      return {
        kind: 'error',
        title: 'No se pudo completar',
        message: err.message || 'Ocurrió un error al procesar tu pedido.',
        canRetry: true,
      };
    }
    return {
      kind: 'error',
      title: 'No se pudo completar',
      message: 'Ocurrió un error al procesar tu pedido.',
      canRetry: true,
    };
  };

  // Submit cuando el Card Brick devuelve el token (pago inmediato con MP).
  const handleCardPaymentSubmit = async (formData: any) => {
    if (!selectedLocation?.location_id) {
      toast.error('Selecciona una sede primero.');
      return;
    }
    const count = itemCount;
    setFeedback({ kind: 'processing', method: 'tarjeta' });
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
      setFeedback({ kind: 'success', order, method: 'tarjeta', itemCount: count });
    } catch (err) {
      setFeedback(toErrorFeedback(err));
    }
  };

  // Submit para métodos manuales (yape/plin/efectivo/transferencia)
  const handleManualPaymentSubmit = async () => {
    if (!selectedLocation?.location_id) {
      toast.error('Selecciona una sede primero.');
      return;
    }
    const count = itemCount;
    setFeedback({ kind: 'processing', method: paymentMethod });
    try {
      const order = await api.orders.create(buildOrderPayload());
      clear();
      setFeedback({ kind: 'success', order, method: paymentMethod, itemCount: count });
    } catch (err) {
      setFeedback(toErrorFeedback(err));
    }
  };

  const handleRetry = () => {
    if (paymentMethod === 'tarjeta') {
      // El token de la tarjeta es de un solo uso: volvemos al formulario.
      setFeedback({ kind: 'idle' });
    } else {
      handleManualPaymentSubmit();
    }
  };

  if (!user) return null;
  if (isEmpty && feedback.kind === 'idle') return null;

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
                  customer={user}
                  location={selectedLocation}
                />

                <div className="mt-6 border-t border-line pt-6">
                  {paymentMethod === 'tarjeta' && !isEmpty && (
                    <div>
                      <h3 className="font-bold text-text mb-1 flex items-center gap-2">
                        <CreditCard size={18} className="text-secondary-brand" />
                        Datos de la tarjeta
                      </h3>
                      <p className="text-sm text-muted mb-4 flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-success" />
                        Tus datos están protegidos por MercadoPago. La botica nunca verá tu tarjeta.
                      </p>
                      <CardPayment
                        initialization={{ amount: total }}
                        onSubmit={handleCardPaymentSubmit}
                        onError={(err) => {
                          console.error('MP error:', err);
                          toast.error('Revisa los datos de la tarjeta');
                        }}
                      />
                      <div className="mt-4 p-3 bg-surface-2 border border-line rounded-lg text-xs text-muted">
                        <strong className="text-text">Tarjetas de prueba (sandbox):</strong>
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
                    <WalletPanel
                      method={paymentMethod}
                      total={total}
                      isSubmitting={feedback.kind === 'processing'}
                      onConfirm={handleManualPaymentSubmit}
                    />
                  )}

                  {paymentMethod === 'efectivo' && (
                    <CashPanel
                      total={total}
                      isSubmitting={feedback.kind === 'processing'}
                      onConfirm={handleManualPaymentSubmit}
                    />
                  )}

                  {paymentMethod === 'transferencia' && (
                    <TransferPanel
                      total={total}
                      isSubmitting={feedback.kind === 'processing'}
                      onConfirm={handleManualPaymentSubmit}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={currentStep === 1 ? () => navigate('/carrito') : handleBack}
              className="flex items-center gap-2 px-4 py-2 text-muted hover:text-text font-medium rounded-md transition-colors"
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
          <OrderSummary
            items={items}
            itemCount={itemCount}
            subtotal={subtotal}
            shippingCost={shippingCost}
            total={total}
          />
        </div>
      </div>

      {/* ===== Retroalimentación post-pago ===== */}
      {feedback.kind === 'processing' && (
        <ProcessingOverlay
          title={feedback.method === 'tarjeta' ? 'Procesando tu pago…' : 'Registrando tu pedido…'}
          subtitle={
            feedback.method === 'tarjeta'
              ? 'Estamos confirmando el cargo con MercadoPago.'
              : 'Un momento, por favor.'
          }
        />
      )}

      {feedback.kind === 'success' && (
        <PaymentSuccessModal
          order={feedback.order}
          method={feedback.method}
          itemCount={feedback.itemCount}
          onGoToOrder={() => navigate(`/mis-pedidos/${feedback.order.order_id}`)}
          onKeepShopping={() => navigate('/catalogo')}
          onClose={() => navigate(`/mis-pedidos/${feedback.order.order_id}`)}
        />
      )}

      {feedback.kind === 'error' && (
        <PaymentErrorModal
          title={feedback.title}
          message={feedback.message}
          canRetry={feedback.canRetry}
          onRetry={handleRetry}
          onClose={() => setFeedback({ kind: 'idle' })}
        />
      )}
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
          className={`p-4 rounded-xl border text-left transition-all ${
            deliveryType === 'delivery'
              ? 'border-brand ring-2 ring-brand/15 shadow-soft'
              : 'border-line hover:border-brand/50'
          }`}
        >
          <Truck className="mb-2 text-brand" size={24} />
          <p className="font-semibold text-text">Delivery</p>
          <p className="text-xs text-muted">Recibe en tu domicilio</p>
        </button>

        <button
          onClick={() => setDeliveryType('pickup')}
          className={`p-4 rounded-xl border text-left transition-all ${
            deliveryType === 'pickup'
              ? 'border-brand ring-2 ring-brand/15 shadow-soft'
              : 'border-line hover:border-brand/50'
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
              className="w-full h-11 px-3 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
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
            className="w-full h-11 px-3 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
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

  const methods: { id: PaymentMethod; label: string; icon: LucideIcon; desc: string }[] = [
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

      <div className="space-y-2.5 mb-6">
        {methods.map((m) => {
          const Icon = m.icon;
          const active = paymentMethod === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setPaymentMethod(m.id)}
              aria-pressed={active}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 bg-surface ${
                active
                  ? 'border-brand ring-2 ring-brand/15 shadow-soft'
                  : 'border-line hover:border-brand/50 hover:shadow-soft'
              }`}
            >
              <span
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  active ? 'bg-brand-soft text-brand' : 'bg-surface-2 text-muted'
                }`}
              >
                <Icon size={20} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">{m.label}</p>
                <p className="text-xs text-muted">{m.desc}</p>
              </div>
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  active ? 'border-brand' : 'border-line'
                }`}
              >
                {active && <span className="w-2.5 h-2.5 bg-brand rounded-full" />}
              </span>
            </button>
          );
        })}
      </div>

      <h3 className="font-semibold text-text mb-2">Tipo de comprobante</h3>
      <div className="grid grid-cols-3 gap-2">
        {voucherOptions.map((v) => {
          const active = voucherType === v;
          return (
            <button
              key={v}
              onClick={() => setVoucherType(v)}
              aria-pressed={active}
              className={`h-11 rounded-lg border text-sm font-semibold capitalize transition-all bg-surface ${
                active
                  ? 'border-brand text-brand ring-2 ring-brand/15'
                  : 'border-line text-muted hover:border-brand/50 hover:text-text'
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// PANELES DE INSTRUCCIONES POR MÉTODO (no-tarjeta)
// ============================================================
// Superficies limpias, datos destacados en azul-tinta de marca
// (no naranja), botón "copiar" en los datos copiables. El naranja
// queda reservado para el monto y el CTA.
// ============================================================

// Fila etiqueta/valor con copia opcional. El valor usa el azul
// institucional (text-secondary-brand) para verse premium y sobrio.
function DataRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-muted shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-secondary-brand tabular-nums truncate">
          {value}
        </span>
        {copyable && <CopyButton value={value} label={`Copiar ${label}`} />}
      </div>
    </div>
  );
}

function AmountCard({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-brand-soft border border-brand/20 px-4 py-3">
      <span className="text-sm font-semibold text-text">Monto a pagar</span>
      <span className="text-xl font-bold text-brand tabular-nums">S/ {total.toFixed(2)}</span>
    </div>
  );
}

function PanelHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <h3 className="font-bold text-text flex items-center gap-2.5">
      <span className="w-9 h-9 rounded-lg bg-cool-soft text-secondary-brand flex items-center justify-center shrink-0">
        <Icon size={18} />
      </span>
      {title}
    </h3>
  );
}

function ConfirmButton({
  label,
  isSubmitting,
  onConfirm,
}: {
  label: string;
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
  return (
    <button
      onClick={onConfirm}
      disabled={isSubmitting}
      className="w-full h-12 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-semibold rounded-xl shadow-soft active:scale-[0.99] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      {isSubmitting ? 'Procesando…' : label}
    </button>
  );
}

function WalletPanel({
  method,
  total,
  isSubmitting,
  onConfirm,
}: {
  method: 'yape' | 'plin';
  total: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
  const name = method === 'yape' ? 'Yape' : 'Plin';
  return (
    <div className="space-y-4">
      <PanelHeader icon={Smartphone} title={`Paga con ${name}`} />

      {/* Número destacado (azul-tinta) con copiar */}
      <div className="rounded-xl border border-line bg-surface-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Número de {name}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <span className="text-2xl font-bold text-secondary-brand tabular-nums tracking-tight">
            {PAY_INFO.walletPhone}
          </span>
          <CopyButton value={PAY_INFO.walletPhone} label={`Copiar número de ${name}`} />
        </div>
        <p className="mt-1.5 text-xs text-muted">{PAY_INFO.business}</p>
      </div>

      <AmountCard total={total} />

      <p className="text-sm text-muted">
        Abre tu app {name}, paga el monto exacto al número indicado y luego confirma tu pedido.
        El staff validará el pago y lo procesará.
      </p>

      <ConfirmButton
        label={`Ya pagué con ${name}`}
        isSubmitting={isSubmitting}
        onConfirm={onConfirm}
      />
    </div>
  );
}

function CashPanel({
  total,
  isSubmitting,
  onConfirm,
}: {
  total: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4">
      <PanelHeader icon={Banknote} title="Pago en efectivo contra entrega" />

      <div className="rounded-xl border border-line bg-surface-2 p-4">
        <p className="text-sm text-text">
          Pagarás en efectivo cuando recibas tu pedido. Ten el monto exacto preparado para
          facilitar la entrega.
        </p>
      </div>

      <AmountCard total={total} />

      <ConfirmButton
        label="Confirmar pedido (pago contra entrega)"
        isSubmitting={isSubmitting}
        onConfirm={onConfirm}
      />
    </div>
  );
}

function TransferPanel({
  total,
  isSubmitting,
  onConfirm,
}: {
  total: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4">
      <PanelHeader icon={Landmark} title="Transferencia bancaria" />

      <div className="rounded-xl border border-line bg-surface-2 px-4 divide-y divide-line-2">
        <DataRow label="Banco" value={PAY_INFO.bank} />
        <DataRow label="Titular" value={PAY_INFO.business} />
        <DataRow label="Cuenta" value={PAY_INFO.account} copyable />
        <DataRow label="CCI" value={PAY_INFO.cci} copyable />
        <DataRow label="RUC" value={PAY_INFO.ruc} copyable />
      </div>

      <AmountCard total={total} />

      <p className="text-sm text-muted">
        Realiza la transferencia por el monto exacto y luego confirma tu pedido. El staff
        validará el pago y lo procesará.
      </p>

      <ConfirmButton
        label="Confirmar pedido (transferencia)"
        isSubmitting={isSubmitting}
        onConfirm={onConfirm}
      />
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

// ============================================================
// RESUMEN (columna derecha) — mini-carrito con foto por producto
// ============================================================

function ItemThumb({ src, alt }: { src?: string | null; alt: string }) {
  const [error, setError] = useState(false);
  return (
    <div className="relative w-12 h-12 shrink-0 rounded-lg border border-line bg-photo overflow-hidden flex items-center justify-center">
      <Package size={20} className="text-line" />
      {src && !error && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

function OrderSummary({
  items,
  itemCount,
  subtotal,
  shippingCost,
  total,
}: {
  items: ReturnType<typeof useCart>['items'];
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
}) {
  return (
    <div className="bg-surface rounded-xl border border-line p-5 sticky top-4">
      <h3 className="font-bold text-text mb-3 flex items-center justify-between">
        <span>Resumen</span>
        <span className="text-xs font-semibold text-muted bg-surface-2 border border-line rounded-full px-2.5 py-0.5">
          {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
        </span>
      </h3>

      {/* Lista de productos con miniatura */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-0.5 mb-4">
        {items.map((item) => (
          <div key={item.product_id} className="flex items-center gap-3">
            <ItemThumb src={item.image_url} alt={item.product_name} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text line-clamp-2 leading-snug">
                {item.product_name}
              </p>
              <p className="text-xs text-muted mt-0.5">
                <span className="font-semibold text-text">x{item.amount}</span>
                {' · '}S/ {item.unit_price.toFixed(2)}
              </p>
            </div>
            <p className="text-sm font-semibold text-text tabular-nums shrink-0">
              S/ {(item.unit_price * item.amount).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-line pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal (productos)</span>
          <span className="tabular-nums">S/ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Envío</span>
          <span>
            {shippingCost === 0 ? (
              <span className="text-success font-medium">Gratis</span>
            ) : (
              <span className="tabular-nums">S/ {shippingCost.toFixed(2)}</span>
            )}
          </span>
        </div>
        <div className="border-t border-line pt-2 mt-2 flex justify-between items-baseline">
          <span className="font-bold">Total</span>
          <span className="font-bold text-brand text-lg tabular-nums">
            S/ {total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
