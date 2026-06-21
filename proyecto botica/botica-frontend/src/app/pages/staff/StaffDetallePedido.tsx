import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import {
  ArrowLeft, User, MapPin, Package, CreditCard, AlertCircle,
  Copy, ExternalLink, CheckCircle2, X,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import type { Order } from '../../lib/types';
import { StatusBadge } from './StaffPedidos';

type ActionType = null | 'validate' | 'deliver' | 'cancel' | 'cancel-refund';

export default function StaffDetallePedido() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
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

  async function runAction(action: ActionType, payload?: any): Promise<boolean> {
    if (!order) return false;
    setBusy(true);
    try {
      let updated: Order;
      if (action === 'validate') {
        updated = await api.orders.validatePayment(order.order_id);
        toast.success('Pago validado. Pedido en proceso.');
      } else if (action === 'deliver') {
        updated = await api.orders.markDelivered(order.order_id);
        toast.success('Pedido marcado como entregado');
      } else if (action === 'cancel') {
        updated = await api.orders.staffCancel(order.order_id, payload.reason);
        toast.success('Pedido cancelado');
      } else if (action === 'cancel-refund') {
        updated = await api.orders.cancelWithRefund(order.order_id, payload);
        toast.success('Pedido cancelado y stock restaurado');
      } else {
        return false;
      }
      setOrder(updated);
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
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-error mb-3" />
        <p className="font-medium text-text">Pedido no encontrado</p>
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

  return (
    <div>
      <Link
        to="/staff/pedidos"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand mb-4"
      >
        <ArrowLeft size={16} /> Volver a pedidos
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold text-text">
          Pedido #{order.order_id}
        </h1>
        <StatusBadge state={state} />
      </div>
      <p className="text-sm text-muted -mt-4 mb-6">
        {orderDate.toLocaleString('es-PE', {
          weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Cliente" icon={User}>
            <Row label="Nombre" value={order.customer_name || '—'} />
            <Row label="Email" value={order.customer_email || '—'} />
            <Row label="DNI" value={order.customer_dni || '—'} />
            <Row label="Teléfono" value={order.customer_phone || '—'} />
          </Section>

          <Section title="Entrega" icon={MapPin}>
            <Row
              label="Tipo"
              value={order.delivery_type === 'pickup' ? 'Recojo en sede' : order.delivery_type === 'delivery' ? 'Delivery' : '—'}
            />
            <Row label="Sede" value={order.location_name || '—'} />
            {order.delivery_type === 'delivery' && (
              <>
                <Row label="Dirección" value={order.delivery_address || '—'} />
                <Row label="Teléfono entrega" value={order.delivery_phone || '—'} />
              </>
            )}
            {order.delivery_notes && (
              <Row label="Notas" value={order.delivery_notes} />
            )}
          </Section>

          <Section title="Productos" icon={Package}>
            <div className="divide-y divide-line">
              {(order.details || []).map((d, idx) => (
                <div key={d.detail_id || idx} className="py-3 flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {d.product_name || `Producto #${d.product_id}`}
                    </p>
                    <p className="text-xs text-muted">
                      {d.amount} × S/ {Number(d.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-text shrink-0">
                    S/ {Number(d.sub_total_price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {state === 'cancelado' && (
            <Section title="Cancelación" icon={AlertCircle} accent="var(--c-error)">
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
            </Section>
          )}
        </div>

        <div className="space-y-4">
          <Section title="Pago" icon={CreditCard}>
            <Row label="Método" value={method || 'sin pago'} />
            {order.payment?.voucher_type && (
              <Row label="Comprobante" value={order.payment.voucher_type} />
            )}
            {method === 'tarjeta' && order.payment?.mp_payment_id && (
              <Row label="MP ID" value={order.payment.mp_payment_id} mono />
            )}
            {method === 'tarjeta' && order.payment?.mp_status && (
              <Row label="MP estado" value={order.payment.mp_status} />
            )}
            <div className="mt-3 pt-3 border-t border-line flex justify-between">
              <span className="font-medium text-text">Total</span>
              <span className="text-xl font-bold text-brand">
                S/ {Number(order.total_price).toFixed(2)}
              </span>
            </div>
          </Section>

          {(canValidatePayment || canMarkDelivered || canStaffCancel || canCancelWithRefund) && (
            <Section title="Acciones">
              <div className="space-y-2">
                {canValidatePayment && (
                  <button
                    disabled={busy}
                    onClick={() => runAction('validate')}
                    className="w-full bg-info hover:brightness-110 active:scale-[0.99] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-all"
                  >
                    Validar pago manual
                  </button>
                )}
                {canMarkDelivered && (
                  <button
                    disabled={busy}
                    onClick={() => runAction('deliver')}
                    className="w-full bg-success hover:brightness-110 active:scale-[0.99] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-all"
                  >
                    Marcar como entregado
                  </button>
                )}
                {canStaffCancel && (
                  <button
                    disabled={busy}
                    onClick={() => setModal('cancel')}
                    className="w-full bg-surface hover:bg-error-soft active:scale-[0.99] disabled:opacity-50 text-error border border-error/60 hover:border-error font-semibold py-2.5 rounded-lg text-sm transition-all"
                  >
                    Cancelar pedido
                  </button>
                )}
                {canCancelWithRefund && (
                  <button
                    disabled={busy}
                    onClick={() => setModal('cancel-refund')}
                    className="w-full bg-surface hover:bg-error-soft active:scale-[0.99] disabled:opacity-50 text-error border border-error/60 hover:border-error font-semibold py-2.5 rounded-lg text-sm transition-all"
                  >
                    Cancelar con refund manual
                  </button>
                )}
              </div>
            </Section>
          )}
        </div>
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

function Section({
  title, icon: Icon, accent, children,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-surface rounded-2xl border shadow-soft p-5"
      style={accent ? { borderColor: accent } : { borderColor: 'var(--c-line)' }}
    >
      <h2 className="flex items-center gap-2.5 font-bold text-text mb-4 text-sm">
        {Icon && (
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={
              accent
                ? { backgroundColor: `${accent}1A`, color: accent }
                : { backgroundColor: 'var(--c-brand-soft)', color: 'var(--c-brand)' }
            }
          >
            <Icon size={16} />
          </span>
        )}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`text-right text-text ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

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
    <ModalShell onClose={onClose} title="Cancelar pedido">
      <p className="text-sm text-muted mb-3">
        Indica el motivo de la cancelación. El stock se restaurará automáticamente.
      </p>
      <label className="block text-sm font-medium text-text mb-1">
        Razón (mín. 5 caracteres)
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
        placeholder="Ej. Cliente solicitó cancelación por error en el pedido"
      />
      <div className="mt-4 flex gap-2 justify-end">
        <button
          onClick={onClose}
          disabled={busy}
          className="px-4 py-2 text-sm text-muted hover:bg-page rounded-md"
        >
          Cancelar
        </button>
        <button
          disabled={!valid || busy}
          onClick={() => onConfirm(reason.trim())}
          className="px-4 py-2 bg-error hover:bg-error disabled:opacity-50 text-white font-medium text-sm rounded-md"
        >
          {busy ? 'Procesando...' : 'Cancelar pedido'}
        </button>
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
  const valid = reason.trim().length >= 5 && confirmed && !blockedByDays;

  function copyMpId() {
    if (!mpPaymentId) return;
    navigator.clipboard.writeText(mpPaymentId);
    toast.success('MP ID copiado');
  }

  return (
    <ModalShell onClose={onClose} title="Cancelar con refund manual">
      <div className="bg-warning-soft border border-warning rounded-md p-3 mb-4 text-sm text-warning">
        <p className="font-medium mb-1">Pasos a seguir:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Abre MercadoPago y busca el pago por su ID.</li>
          <li>Procesa el reembolso manualmente en MP.</li>
          <li>Vuelve aquí, marca el checkbox y confirma.</li>
        </ol>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-muted mb-1">MP Payment ID</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-page border border-line rounded-md text-xs font-mono text-text truncate">
            {mpPaymentId || '—'}
          </code>
          <button
            onClick={copyMpId}
            disabled={!mpPaymentId}
            className="px-3 py-2 border border-line rounded-md hover:bg-page disabled:opacity-50"
            title="Copiar"
          >
            <Copy size={14} />
          </button>
        </div>
        <a
          href="https://www.mercadopago.com.pe/activities"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand hover:underline mt-2"
        >
          Abrir MercadoPago <ExternalLink size={12} />
        </a>
      </div>

      <label className="block text-sm font-medium text-text mb-1">
        Razón (mín. 5 caracteres)
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand mb-3"
        placeholder="Motivo de la cancelación"
      />

      {requireForce && (
        <div className={`text-xs p-2 rounded-md mb-3 ${canForce ? 'bg-warning-soft text-warning' : 'bg-error-soft text-error'}`}>
          {canForce ? (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Han pasado más de 7 días. Como admin, debes forzar la cancelación.
              </span>
            </label>
          ) : (
            <span>
              Han pasado más de 7 días desde el pedido. Solo un administrador puede cancelarlo.
            </span>
          )}
        </div>
      )}

      <label className="flex items-start gap-2 cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm text-text">
          Confirmo que ya procesé el refund en MercadoPago
        </span>
      </label>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          disabled={busy}
          className="px-4 py-2 text-sm text-muted hover:bg-page rounded-md"
        >
          Cancelar
        </button>
        <button
          disabled={!valid || busy || (requireForce && canForce && !force)}
          onClick={() =>
            onConfirm({
              reason: reason.trim(),
              refund_confirmed: true,
              ...(requireForce && force ? { force: true } : {}),
            })
          }
          className="inline-flex items-center gap-1 px-4 py-2 bg-error hover:bg-error disabled:opacity-50 text-white font-medium text-sm rounded-md"
        >
          <CheckCircle2 size={14} />
          {busy ? 'Procesando...' : 'Cancelar y restaurar stock'}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title, children, onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h2 className="font-bold text-text">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
