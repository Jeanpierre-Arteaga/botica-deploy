import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertTriangle,
  MapPin,
  CreditCard,
  Package,
  FileText,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../lib/api';
import type { Order, OrderState } from '../lib/types';

type BadgeIcon = typeof Clock;

interface BadgeConfig {
  color: string;
  bg: string;
  icon: BadgeIcon;
  label: string;
}

const STATUS_CONFIG: Record<OrderState, BadgeConfig> = {
  pendiente:   { color: 'var(--color-warning)', bg: 'var(--color-warning-soft)', icon: Clock,        label: 'Pendiente' },
  'en proceso':{ color: 'var(--color-info)',    bg: 'var(--color-info-soft)',    icon: Truck,        label: 'En proceso' },
  entregado:   { color: 'var(--color-success)', bg: 'var(--color-success-soft)', icon: CheckCircle2, label: 'Entregado' },
  cancelado:   { color: 'var(--color-error)',   bg: 'var(--color-error-soft)',   icon: XCircle,      label: 'Cancelado' },
};

function StatusBadge({ state }: { state: OrderState }) {
  const c = STATUS_CONFIG[state] || STATUS_CONFIG.pendiente;
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      <Icon size={14} />
      {c.label}
    </span>
  );
}

const PAYMENT_LABELS: Record<string, string> = {
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
};

export function DetallePedidoCustomer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    if (!id) return;

    api.orders
      .getById(parseInt(id, 10))
      .then(setOrder)
      .catch((err) => {
        console.error(err);
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 403) {
          toast.error('No tienes permiso para ver este pedido');
          navigate('/mis-pedidos');
        } else if (status === 404) {
          toast.error('Pedido no encontrado');
          navigate('/mis-pedidos');
        } else {
          toast.error('Error al cargar el pedido');
        }
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  const handleCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const updated = await api.orders.cancel(order.order_id);
      setOrder(updated);
      setShowConfirmCancel(false);
      toast.success('Pedido cancelado correctamente');
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof ApiError
          ? (err.body as { message?: string } | undefined)?.message || err.message
          : 'Error al cancelar el pedido';
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-muted mt-4">Cargando detalle...</p>
      </div>
    );
  }

  if (!order) return null;

  const subtotal =
    order.details?.reduce((sum, d) => sum + Number(d.sub_total_price || 0), 0) || 0;
  const shipping = Number(order.total_price) - subtotal;

  const paymentMethod = order.payment?.payment_method;
  const canCancel =
    ['pendiente', 'en proceso'].includes(order.order_state) &&
    paymentMethod !== 'tarjeta';

  const cantCancelReason = (() => {
    if (order.order_state === 'entregado') return 'Este pedido ya fue entregado';
    if (order.order_state === 'cancelado') return 'Este pedido ya está cancelado';
    if (paymentMethod === 'tarjeta')
      return 'Pedidos con tarjeta no pueden cancelarse desde aquí. Contacta al staff para procesar la devolución.';
    return null;
  })();

  const orderDate = new Date(order.order_date);
  const dateStr = orderDate.toLocaleString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/mis-pedidos"
        className="inline-flex items-center gap-2 text-muted hover:text-brand text-sm mb-4"
      >
        <ArrowLeft size={16} />
        Volver a Mis pedidos
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-text">
            Pedido N° {order.display_number ?? order.order_id}
          </h1>
          <p className="text-sm text-muted mt-1">
            Realizado el {dateStr} · <span className="text-faint">Ref. #{order.order_id}</span>
          </p>
        </div>
        <StatusBadge state={order.order_state} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <section className="bg-surface rounded-xl border border-line p-6">
            <h2 className="font-bold text-text mb-4 flex items-center gap-2">
              <Package size={18} className="text-brand" />
              Productos ({order.details?.length || 0})
            </h2>
            <div className="space-y-3">
              {order.details?.map((d, idx) => (
                <div
                  key={d.detail_id ?? idx}
                  className="flex justify-between items-start py-2 border-b border-line last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-text">
                      {d.product_name || `Producto #${d.product_id}`}
                    </p>
                    <p className="text-sm text-muted">
                      {d.amount} × S/ {Number(d.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-text">
                    S/ {Number(d.sub_total_price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface rounded-xl border border-line p-6">
            <h2 className="font-bold text-text mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-brand" />
              Entrega
            </h2>
            <p className="font-medium text-text mb-1">
              {order.delivery_type === 'delivery'
                ? 'Delivery a domicilio'
                : order.delivery_type === 'pickup'
                ? 'Recojo en tienda'
                : 'Sin especificar'}
            </p>
            {order.location_name && (
              <p className="text-sm text-muted">Sede: {order.location_name}</p>
            )}
          </section>

          {order.payment && (
            <CustomerVoucher
              orderId={order.order_id}
              initialUrl={order.payment.voucher_pdf_url || null}
              voucherType={order.payment.voucher_type || 'boleta'}
            />
          )}

          {paymentMethod === 'tarjeta' &&
            ['pendiente', 'en proceso'].includes(order.order_state) && (
              <div className="bg-warning-soft border border-warning rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="text-warning flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-warning">
                  <p className="font-semibold mb-1">¿Necesitas cancelar este pedido?</p>
                  <p>
                    Como pagaste con tarjeta, la cancelación requiere procesar una devolución
                    con MercadoPago. Contacta al staff de la botica al{' '}
                    <a href="tel:+51929255281" className="font-semibold underline">
                      929 255 281
                    </a>{' '}
                    o por{' '}
                    <a
                      href="https://wa.me/51929255281?text=Hola%2C%20quiero%20una%20consulta."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline"
                    >
                      WhatsApp
                    </a>{' '}
                    para gestionar tu cancelación y reembolso.
                  </p>
                </div>
              </div>
            )}
        </div>

        <div className="lg:col-span-1 space-y-4">
          <section className="bg-surface rounded-xl border border-line p-6">
            <h2 className="font-bold text-text mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-brand" />
              Pago
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Método</span>
                <span className="font-medium">
                  {paymentMethod ? PAYMENT_LABELS[paymentMethod] || paymentMethod : 'N/A'}
                </span>
              </div>
              {order.payment?.voucher_type && (
                <div className="flex justify-between">
                  <span className="text-muted">Comprobante</span>
                  <span className="font-medium capitalize">{order.payment.voucher_type}</span>
                </div>
              )}
              <div className="border-t border-line pt-2 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Envío</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-success">Gratis</span>
                    ) : (
                      `S/ ${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-line pt-2 mt-2">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-brand text-lg">
                    S/ {Number(order.total_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {canCancel && (
            <div>
              {!showConfirmCancel ? (
                <button
                  onClick={() => setShowConfirmCancel(true)}
                  className="w-full px-4 py-3 border-2 border-error text-error hover:bg-error-soft font-medium rounded-md transition-colors"
                >
                  Cancelar pedido
                </button>
              ) : (
                <div className="bg-error-soft border-2 border-error rounded-xl p-4 space-y-3">
                  <p className="text-sm text-error font-medium">
                    ¿Seguro que quieres cancelar?
                  </p>
                  <p className="text-xs text-error">
                    Esta acción no se puede deshacer. El stock será devuelto al inventario.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="flex-1 px-3 py-2 bg-error hover:bg-error/90 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                      {isCancelling ? 'Cancelando...' : 'Sí, cancelar'}
                    </button>
                    <button
                      onClick={() => setShowConfirmCancel(false)}
                      disabled={isCancelling}
                      className="flex-1 px-3 py-2 border border-muted text-muted text-sm font-medium rounded-md disabled:opacity-50"
                    >
                      No, mantener
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!canCancel && cantCancelReason && order.order_state !== 'cancelado' && (
            <div className="bg-page border border-line rounded-xl p-4 text-sm text-muted">
              {cantCancelReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Comprobante interno (PDF): visor embebido + descarga / generación
// ============================================================

function CustomerVoucher({
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
      const msg = err instanceof ApiError
        ? (err.body as { message?: string } | undefined)?.message || err.message
        : 'No se pudo generar el comprobante';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-surface rounded-xl border border-line p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="font-bold text-text flex items-center gap-2">
          <FileText size={18} className="text-brand" />
          Comprobante <span className="text-sm font-medium text-muted capitalize">· {voucherType}</span>
        </h2>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-line text-text text-sm font-semibold hover:border-brand hover:text-brand transition-colors focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Download size={15} /> Descargar PDF
          </a>
        )}
      </div>

      {url ? (
        // Ticket angosto (~80mm): visor acotado y centrado para respetar el
        // aspecto del rollo, sin franjas grandes a los lados.
        <div className="mx-auto max-w-[360px] rounded-lg border border-line overflow-hidden bg-page">
          <iframe
            src={`${url}#view=FitH`}
            title={`Comprobante del pedido ${orderId}`}
            className="w-full h-[540px] block"
          />
        </div>
      ) : (
        <div className="text-center py-8 bg-page border border-dashed border-line rounded-lg">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-surface flex items-center justify-center">
            <FileText size={22} className="text-faint" />
          </div>
          <p className="text-sm font-medium text-text">Comprobante no generado</p>
          <p className="text-xs text-muted mt-0.5 mb-3">Genera tu comprobante interno en PDF</p>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-brand text-white font-semibold hover:bg-brand-hover active:scale-[0.98] disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generando…</>
            ) : (
              <><FileText size={16} /> Generar comprobante</>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
