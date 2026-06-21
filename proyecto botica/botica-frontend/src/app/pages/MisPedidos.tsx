import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Clock, CheckCircle2, XCircle, Truck, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
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
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      <Icon size={12} />
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

export function MisPedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.orders
      .getMyOrders()
      .then(setOrders)
      .catch((err) => {
        console.error(err);
        toast.error('Error al cargar tus pedidos');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="inline-block w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-muted mt-4">Cargando tus pedidos...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-text mb-6">Mis pedidos</h1>
        <div className="bg-surface rounded-2xl border border-line p-12 text-center">
          <ShoppingBag size={64} className="mx-auto text-line mb-4" />
          <h2 className="text-xl font-bold text-text mb-2">Aún no tienes pedidos</h2>
          <p className="text-muted mb-6">
            Cuando hagas tu primera compra, aparecerá aquí
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white font-medium rounded-md transition-colors"
          >
            Explorar el catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-sm text-muted mb-2">
        <Link to="/" className="hover:text-brand">Inicio</Link>
        <span className="mx-2">›</span>
        <span className="text-text font-medium">Mis pedidos</span>
      </div>

      <h1 className="text-3xl font-bold text-text mb-2">Mis pedidos</h1>
      <p className="text-muted mb-6">
        {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} en total
      </p>

      <div className="space-y-3">
        {orders.map((order) => {
          const detailsCount = order.details?.length || 0;
          const paymentLabel = order.payment?.payment_method
            ? PAYMENT_LABELS[order.payment.payment_method] || order.payment.payment_method
            : 'N/A';

          const orderDate = new Date(order.order_date);
          const dateStr = orderDate.toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <Link
              key={order.order_id}
              to={`/mis-pedidos/${order.order_id}`}
              className="block bg-surface rounded-xl border border-line hover:border-brand hover:shadow-md transition-all p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold text-text text-lg">
                      Pedido #{order.order_id}
                    </h3>
                    <StatusBadge state={order.order_state} />
                  </div>

                  <p className="text-sm text-muted">
                    {dateStr} · {detailsCount} {detailsCount === 1 ? 'producto' : 'productos'} · {paymentLabel}
                  </p>

                  <p className="text-xl font-bold text-brand mt-2">
                    S/ {Number(order.total_price).toFixed(2)}
                  </p>
                </div>

                <div className="hidden sm:flex items-center text-muted">
                  <ChevronRight size={20} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
