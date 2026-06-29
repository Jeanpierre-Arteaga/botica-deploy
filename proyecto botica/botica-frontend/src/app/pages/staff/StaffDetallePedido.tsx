import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router';
import {
  ArrowLeft, User, MapPin, Package, CreditCard, AlertCircle,
  Copy, ExternalLink, CheckCircle2, X, ShieldCheck, XCircle, RotateCcw,
  FileText, Download,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import type { Order } from '../../lib/types';
import { StatusBadge } from './StaffPedidos';
import { Button } from '../../components/ui/Button';

type ActionType = null | 'validate' | 'deliver' | 'cancel' | 'cancel-refund';

export default function StaffDetallePedido() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  // /admin/pedidos/:id y /staff/pedidos/:id comparten esta página: el padding y
  // el enlace "Volver" siguen la sección actual de la URL.
  const inAdmin = useLocation().pathname.startsWith('/admin');
  const pedidosPath = inAdmin ? '/admin/pedidos' : '/staff/pedidos';
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<null | 'cancel' | 'cancel-refund'>(null);

  useEffect(() => {
    if (orderId) loadOrder(parseInt(orderId, 10));
  }, [orderId]);

  async function loadOrder(id: number) {
    setIsLoading(true);
    try {
      const data = await api.orders.getById(id);
      setOrder(data);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo cargar el pedido');
    } finally {
      setIsLoading(false);
    }
  }

  // FIX (vaciado): tras una acción de estado, las mutaciones (PATCH status) podían
  // devolver un pedido parcial; al hacer setOrder con esa respuesta se perdían
  // Cliente/Entrega/Productos. Ahora SIEMPRE re-obtenemos el pedido completo
  // (GET del detalle) y actualizamos la vista con esos datos íntegros.
  async function runAction(action: ActionType, payload?: any): Promise<boolean> {
    if (!order) return false;
    setBusy(true);
    try {
      if (action === 'validate') {
        await api.orders.validatePayment(order.order_id);
      } else if (action === 'deliver') {
        await api.orders.markDelivered(order.order_id);
      } else if (action === 'cancel') {
        await api.orders.staffCancel(order.order_id, payload.reason);
      } else if (action === 'cancel-refund') {
        await api.orders.cancelWithRefund(order.order_id, payload);
      } else {
        return false;
      }

      // Re-fetch del pedido COMPLETO (cliente, entrega, productos, pago).
      const fresh = await api.orders.getById(order.order_id);
      setOrder(fresh);

      const successMsg =
        action === 'validate' ? 'Pago validado. Pedido en proceso.'
        : action === 'deliver' ? 'Pedido marcado como entregado'
        : action === 'cancel' ? 'Pedido cancelado'
        : 'Pedido cancelado y stock restaurado';
      toast.success(successMsg);
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? (err.body as any)?.message || err.message : 'Error en la operación';
      toast.error(msg);
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-error-soft flex items-center justify-center">
          <AlertCircle size={28} className="text-error" />
        </div>
        <p className="font-semibold text-text">Pedido no encontrado</p>
        <Link to="/staff/pedidos" className="text-sm text-brand hover:underline mt-2 inline-block">
          ← Volver a pedidos
        </Link>
      </div>
    );
  }

  const method = order.payment?.payment_method;
  const state = order.order_state;
  const orderDate = new Date(order.order_date);
  const daysSince = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
  const isAdmin = user?.role === 'admin';
  const canForceRefund = daysSince > 7 && isAdmin;
  const items = order.details || [];

  // Reglas de acciones
  const canValidatePayment =
    state === 'pendiente' && method && ['yape', 'plin', 'transferencia'].includes(method);
  const canMarkDelivered = state === 'en proceso';
  const canStaffCancel =
    ['pendiente', 'en proceso'].includes(state) &&
    (method !== 'tarjeta');
  const canCancelWithRefund =
    ['pendiente', 'en proceso'].includes(state) &&
    method === 'tarjeta' &&
    (daysSince <= 7 || isAdmin);

  const hasActions = canValidatePayment || canMarkDelivered || canStaffCancel || canCancelWithRefund;

  return (
    <div className={inAdmin ? 'p-4 lg:p-6' : ''}>
      <Link
        to={pedidosPath}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Volver a pedidos
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-text">
            Pedido #{order.order_id}
          </h1>
          <StatusBadge state={state} />
        </div>
        <p className="text-sm text-muted mt-1 capitalize">
          {orderDate.toLocaleString('es-PE', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>

      {/* DOS ZONAS: izquierda = cards de información; derecha = comprobante a lo
          largo (columna vertical). En móvil se apila (cards arriba, comprobante
          abajo). Si el pedido no tiene pago, no hay zona de comprobante y las
          cards ocupan el ancho completo. */}
      <div className={`grid grid-cols-1 gap-4 items-start ${order.payment ? 'lg:grid-cols-3' : ''}`}>
        {/* IZQUIERDA: cards (alturas proporcionales con items-start) */}
        <div className={`space-y-4 ${order.payment ? 'lg:col-span-2' : 'max-w-4xl'}`}>
          {/* items-stretch → Cliente y Entrega quedan del MISMO alto (la más
              corta se estira para emparejarse con la más alta). */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
            <Section title="Cliente" icon={User}>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <Field label="Nombre" value={order.customer_name || '—'} full />
                <Field label="DNI" value={order.customer_dni || '—'} />
                <Field label="Teléfono" value={order.customer_phone || '—'} />
                <Field label="Email" value={order.customer_email || '—'} full />
              </dl>
            </Section>

            <Section title="Entrega" icon={MapPin}>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {/* Tipo y Sede apilados (Sede DEBAJO de Tipo): ambos a ancho
                    completo para ocupar su propia fila. */}
                <Field
                  label="Tipo"
                  value={order.delivery_type === 'pickup' ? 'Recojo en sede' : order.delivery_type === 'delivery' ? 'Delivery' : '—'}
                  full
                />
                <Field label="Sede" value={order.location_name || '—'} full />
                {order.delivery_type === 'delivery' && (
                  <>
                    <Field label="Dirección" value={order.delivery_address || '—'} full />
                    <Field label="Teléfono entrega" value={order.delivery_phone || '—'} />
                  </>
                )}
                {order.delivery_notes && (
                  <Field label="Notas" value={order.delivery_notes} full />
                )}
              </dl>
            </Section>
          </div>

          {/* Pago + Acciones.
              · Con acciones → dos columnas equilibradas [Pago | Acciones].
              · Sin acciones → Pago a TODO el ancho en modo `wide` (pares densos
                a la izquierda, total a la derecha), evitando el bloque medio
                vacío que dejaba el max-w-md. */}
          {hasActions ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <PaymentCard order={order} method={method} />
              <ActionsCard
                busy={busy}
                canValidatePayment={!!canValidatePayment}
                canMarkDelivered={canMarkDelivered}
                canStaffCancel={canStaffCancel}
                canCancelWithRefund={canCancelWithRefund}
                onValidate={() => runAction('validate')}
                onDeliver={() => runAction('deliver')}
                onCancel={() => setModal('cancel')}
                onCancelRefund={() => setModal('cancel-refund')}
              />
            </div>
          ) : (
            <PaymentCard order={order} method={method} wide />
          )}

          <Section
            title="Productos"
            icon={Package}
            badge={items.length > 0 ? `${items.length} ${items.length === 1 ? 'ítem' : 'ítems'}` : undefined}
          >
            {items.length === 0 ? (
              <p className="text-sm text-muted py-2">Este pedido no tiene productos registrados.</p>
            ) : (
              <div className="divide-y divide-line-2">
                {items.map((d, idx) => (
                  <div key={d.detail_id || idx} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProductThumb url={d.image_url} name={d.product_name} amount={d.amount} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {d.product_name || `Producto #${d.product_id}`}
                        </p>
                        <p className="text-xs text-muted tabular-nums">
                          {d.amount} × S/ {Number(d.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-text shrink-0 tabular-nums">
                      S/ {Number(d.sub_total_price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {state === 'cancelado' && (
            <Section title="Cancelación" icon={AlertCircle} accent="var(--c-error)">
              <div className="space-y-0.5">
                {order.cancelled_at && (
                  <Row
                    label="Fecha"
                    value={new Date(order.cancelled_at).toLocaleString('es-PE')}
                  />
                )}
                {order.cancelled_by_name && (
                  <Row label="Cancelado por" value={order.cancelled_by_name} />
                )}
                {order.cancellation_reason && (
                  <Row label="Razón" value={order.cancellation_reason} />
                )}
                <Row
                  label="Refund procesado"
                  value={order.refund_processed ? 'Sí' : 'No'}
                />
              </div>
            </Section>
          )}
        </div>

        {/* DERECHA: comprobante a lo largo (sticky en desktop) */}
        {order.payment && (
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <VoucherSection
                orderId={order.order_id}
                initialUrl={order.payment.voucher_pdf_url || null}
                voucherType={order.payment.voucher_type || 'boleta'}
              />
            </div>
          </div>
        )}
      </div>

      {modal === 'cancel' && (
        <CancelModal
          busy={busy}
          onClose={() => setModal(null)}
          onConfirm={async (reason) => {
            const ok = await runAction('cancel', { reason });
            if (ok) setModal(null);
          }}
        />
      )}

      {modal === 'cancel-refund' && (
        <CancelWithRefundModal
          busy={busy}
          mpPaymentId={order.payment?.mp_payment_id || ''}
          requireForce={daysSince > 7}
          canForce={canForceRefund}
          onClose={() => setModal(null)}
          onConfirm={async (data) => {
            const ok = await runAction('cancel-refund', data);
            if (ok) setModal(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Bloques reutilizables (consistentes con el sistema base)
// ============================================================

function Section({
  title, icon: Icon, accent, badge, children,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-surface rounded-2xl border shadow-soft p-4"
      style={accent ? { borderColor: accent } : { borderColor: 'var(--c-line)' }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="flex items-center gap-2.5 font-bold text-text text-sm">
          {Icon && (
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={
                accent
                  ? { backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }
                  : { backgroundColor: 'var(--c-brand-soft)', color: 'var(--c-brand)' }
              }
            >
              <Icon size={16} />
            </span>
          )}
          {title}
        </h2>
        {badge && (
          <span className="text-xs font-semibold text-muted bg-surface-2 border border-line rounded-full px-2.5 py-0.5">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// Card de Pago. Dos modos según el espacio disponible:
//  - compacta (junto a "Acciones", media columna): pares apilados + total abajo.
//  - `wide` (cuando va sola, a todo el ancho): pares en rejilla densa a la
//    izquierda y el total separado a la derecha, así llena el ancho sin dejar
//    un bloque medio vacío (evita el hueco que generaba el max-w-md anterior).
// Usa los mismos pares `Field` que las cards de Cliente/Entrega → consistencia.
function PaymentCard({ order, method, wide = false }: { order: Order; method?: string; wide?: boolean }) {
  const pairs = (
    <>
      <Field label="Método" value={method ? method : 'sin pago'} capitalize />
      {order.payment?.voucher_type && (
        <Field label="Comprobante" value={order.payment.voucher_type} capitalize />
      )}
      {method === 'tarjeta' && order.payment?.mp_payment_id && (
        <Field label="MP ID" value={order.payment.mp_payment_id} mono full />
      )}
      {method === 'tarjeta' && order.payment?.mp_status && (
        <Field label="MP estado" value={order.payment.mp_status} />
      )}
    </>
  );

  const total = (
    <span className="text-2xl font-bold text-brand tabular-nums">
      S/ {Number(order.total_price).toFixed(2)}
    </span>
  );

  if (wide) {
    return (
      <Section title="Pago" icon={CreditCard}>
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-4">
          <dl className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2.5 content-start">
            {pairs}
          </dl>
          <div className="shrink-0 border-t border-line pt-3 flex items-center justify-between gap-3 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4 sm:flex-col sm:items-end sm:justify-center">
            <span className="text-[11px] font-medium uppercase tracking-wide text-faint">Total</span>
            {total}
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Pago" icon={CreditCard}>
      {/* Método/Comprobante a la izquierda y el Total a la derecha, alineados
          ARRIBA (items-start): el monto queda a la altura de la fila
          Método/Comprobante en vez de flotar al fondo de la card. */}
      <div className="flex items-start justify-between gap-4">
        <dl className="flex-1 min-w-0 grid grid-cols-2 gap-x-4 gap-y-2.5 content-start">
          {pairs}
        </dl>
        <div className="shrink-0 text-right">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-faint">Total</dt>
          <dd className="mt-0.5">{total}</dd>
        </div>
      </div>
    </Section>
  );
}

// Card de Acciones de estado del pedido.
function ActionsCard({
  busy, canValidatePayment, canMarkDelivered, canStaffCancel, canCancelWithRefund,
  onValidate, onDeliver, onCancel, onCancelRefund,
}: {
  busy: boolean;
  canValidatePayment: boolean;
  canMarkDelivered: boolean;
  canStaffCancel: boolean;
  canCancelWithRefund: boolean;
  onValidate: () => void;
  onDeliver: () => void;
  onCancel: () => void;
  onCancelRefund: () => void;
}) {
  return (
    <Section title="Acciones">
      <div className="space-y-2.5">
        {canValidatePayment && (
          <Button variant="info" fullWidth iconLeft={ShieldCheck} loading={busy} onClick={onValidate}>
            Validar pago manual
          </Button>
        )}
        {canMarkDelivered && (
          <Button variant="success" fullWidth iconLeft={CheckCircle2} loading={busy} onClick={onDeliver}>
            Marcar como entregado
          </Button>
        )}
        {canStaffCancel && (
          <Button variant="danger" fullWidth iconLeft={XCircle} disabled={busy} onClick={onCancel}>
            Cancelar pedido
          </Button>
        )}
        {canCancelWithRefund && (
          <Button variant="danger-outline" fullWidth iconLeft={RotateCcw} disabled={busy} onClick={onCancelRefund}>
            Cancelar con refund manual
          </Button>
        )}
      </div>
    </Section>
  );
}

// Miniatura del producto (igual que en el carrito): imagen rounded + object-cover
// con fallback a icono. La cantidad va como burbuja superpuesta.
function ProductThumb({ url, name, amount }: { url?: string | null; name?: string; amount: number }) {
  const [err, setErr] = useState(false);
  return (
    <div className="relative shrink-0 w-12 h-12 rounded-lg bg-photo border border-line overflow-hidden flex items-center justify-center">
      {url && !err ? (
        <img
          src={url}
          alt={name || 'Producto'}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <Package size={20} className="text-faint" />
      )}
      <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow-soft">
        {amount}
      </span>
    </div>
  );
}

// ============================================================
// Comprobante (PDF): visor embebido + descarga, o generación
// ============================================================

function VoucherSection({
  orderId, initialUrl, voucherType,
}: {
  orderId: number;
  initialUrl: string | null;
  voucherType: string;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await api.orders.getVoucher(orderId);
      setUrl(res.voucher_pdf_url);
    } catch (err) {
      const msg = err instanceof ApiError ? (err.body as any)?.message || err.message : 'No se pudo generar el comprobante';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface rounded-2xl border border-line shadow-soft p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="flex items-center gap-2.5 font-bold text-text text-sm">
          <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
            <FileText size={16} />
          </span>
          Comprobante
          <span className="text-xs font-medium text-muted capitalize">· {voucherType}</span>
        </h2>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-line text-ink-2 text-sm font-semibold hover:border-brand hover:text-brand transition-colors"
          >
            <Download size={15} /> Descargar PDF
          </a>
        )}
      </div>

      {url ? (
        // Ticket 80mm a lo LARGO en la columna derecha. FitH ajusta el ancho del
        // rollo al del visor → sin franjas oscuras a los lados.
        <div className="rounded-xl border border-line overflow-hidden bg-surface-2">
          <iframe
            src={`${url}#view=FitH`}
            title={`Comprobante del pedido ${orderId}`}
            className="w-full h-[68vh] min-h-[560px] block"
          />
        </div>
      ) : (
        <div className="text-center py-8 bg-surface-2 border border-dashed border-line rounded-xl">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-surface flex items-center justify-center">
            <FileText size={22} className="text-faint" />
          </div>
          <p className="text-sm font-medium text-text">Aún no se ha generado el comprobante</p>
          <p className="text-xs text-muted mt-0.5 mb-3">Genéralo para verlo y descargarlo en PDF</p>
          <Button variant="primary" iconLeft={FileText} loading={loading} onClick={generate}>
            Generar comprobante
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({
  label, value, mono = false, capitalize = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-muted shrink-0">{label}</span>
      <span
        className={`text-right text-text font-medium break-words ${mono ? 'font-mono text-xs' : ''} ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

// Par etiqueta/valor compacto (etiqueta arriba, valor abajo) para llenar el
// ancho de las cards en una rejilla densa y sin huecos. `full` ocupa 2 columnas.
function Field({
  label, value, mono = false, capitalize = false, full = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-faint">{label}</dt>
      <dd
        className={`text-sm font-medium text-text break-words leading-snug ${mono ? 'font-mono text-xs' : ''} ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

// ============================================================
// MODALES
// ============================================================

function CancelModal({
  busy, onClose, onConfirm,
}: {
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 5;

  return (
    <ModalShell
      onClose={onClose}
      title="Cancelar pedido"
      subtitle="El stock se restaurará automáticamente."
      icon={XCircle}
      tone="danger"
    >
      <label className="block text-sm font-medium text-text mb-1.5">
        Razón de la cancelación
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        autoFocus
        className="w-full px-3 py-2.5 bg-page border border-line rounded-lg text-sm text-text resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
        placeholder="Ej. Cliente solicitó cancelación por error en el pedido"
      />
      <p className="text-xs text-faint mt-1.5">Mínimo 5 caracteres.</p>

      <div className="mt-5 flex gap-2.5 justify-end">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Volver
        </Button>
        <Button
          variant="danger"
          iconLeft={XCircle}
          disabled={!valid}
          loading={busy}
          onClick={() => onConfirm(reason.trim())}
        >
          Cancelar pedido
        </Button>
      </div>
    </ModalShell>
  );
}

function CancelWithRefundModal({
  busy, mpPaymentId, requireForce, canForce, onClose, onConfirm,
}: {
  busy: boolean;
  mpPaymentId: string;
  requireForce: boolean;
  canForce: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; refund_confirmed: boolean; force?: boolean }) => void;
}) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [force, setForce] = useState(false);
  const blockedByDays = requireForce && !canForce;
  const valid = reason.trim().length >= 5 && confirmed && !blockedByDays && (!requireForce || !canForce || force);

  function copyMpId() {
    if (!mpPaymentId) return;
    navigator.clipboard.writeText(mpPaymentId);
    toast.success('MP ID copiado');
  }

  const steps = [
    'Abre MercadoPago y busca el pago por su ID.',
    'Procesa el reembolso manualmente en MercadoPago.',
    'Vuelve aquí, marca la confirmación y cancela.',
  ];

  return (
    <ModalShell
      onClose={onClose}
      title="Cancelar con refund manual"
      subtitle="Pago con tarjeta: el reembolso se hace en MercadoPago."
      icon={RotateCcw}
      tone="danger"
    >
      {/* Pasos numerados */}
      <ol className="space-y-2.5 mb-4">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-brand-soft text-brand text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-sm text-text leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      {/* MP Payment ID */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-muted mb-1.5">MP Payment ID</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-page border border-line rounded-lg text-xs font-mono text-text truncate">
            {mpPaymentId || '—'}
          </code>
          <button
            onClick={copyMpId}
            disabled={!mpPaymentId}
            className="shrink-0 w-9 h-9 flex items-center justify-center border border-line rounded-lg text-muted hover:bg-page hover:text-text disabled:opacity-50 transition-colors"
            title="Copiar MP ID"
            aria-label="Copiar MP ID"
          >
            <Copy size={15} />
          </button>
        </div>
        <a
          href="https://www.mercadopago.com.pe/activities"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline mt-2"
        >
          Abrir MercadoPago <ExternalLink size={12} />
        </a>
      </div>

      <label className="block text-sm font-medium text-text mb-1.5">
        Razón de la cancelación
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full px-3 py-2.5 bg-page border border-line rounded-lg text-sm text-text resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors mb-3"
        placeholder="Motivo de la cancelación (mín. 5 caracteres)"
      />

      {requireForce && (
        <div className={`text-xs p-3 rounded-lg mb-3 border ${canForce ? 'bg-warning-soft border-warning/40 text-warning' : 'bg-error-soft border-error/40 text-error'}`}>
          {canForce ? (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[var(--c-error)]"
              />
              <span>Han pasado más de 7 días. Como admin, debes forzar la cancelación.</span>
            </label>
          ) : (
            <span>Han pasado más de 7 días desde el pedido. Solo un administrador puede cancelarlo.</span>
          )}
        </div>
      )}

      {/* Checkbox de confirmación destacado */}
      <label className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 mb-5 transition-colors ${confirmed ? 'border-success bg-success-soft' : 'border-line bg-page hover:border-brand'}`}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[var(--c-success)]"
        />
        <span className="text-sm font-medium text-text">
          Confirmo que ya procesé el refund en MercadoPago
        </span>
      </label>

      <div className="flex gap-2.5 justify-end">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Volver
        </Button>
        <Button
          variant="danger"
          iconLeft={CheckCircle2}
          disabled={!valid}
          loading={busy}
          onClick={() =>
            onConfirm({
              reason: reason.trim(),
              refund_confirmed: true,
              ...(requireForce && force ? { force: true } : {}),
            })
          }
        >
          Cancelar y restaurar stock
        </Button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title, subtitle, icon: Icon, tone = 'brand', children, onClose,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  tone?: 'brand' | 'danger' | 'warning';
  children: React.ReactNode;
  onClose: () => void;
}) {
  const toneStyles: Record<string, { bg: string; color: string }> = {
    brand:   { bg: 'var(--c-brand-soft)',   color: 'var(--c-brand)' },
    danger:  { bg: 'var(--c-error-soft)',   color: 'var(--c-error)' },
    warning: { bg: 'var(--c-warning-soft)', color: 'var(--c-warning)' },
  };
  const ts = toneStyles[tone];

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
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: ts.bg, color: ts.color }}
            >
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
