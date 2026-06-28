import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Clock, CheckCircle2, XCircle, Truck, ShoppingBag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Container } from '../components/Container';
import { PageHeader } from '../components/PageHeader';
import { isPaymentConfirmed } from '../lib/orderStatus';
import type { Order, OrderState } from '../lib/types';

type BadgeIcon = typeof Clock;

interface BadgeConfig {
  color: string;
  bg: string;
  icon: BadgeIcon;
  label: string;
}

const STATUS_CONFIG: Record<OrderState, BadgeConfig> = {
  pendiente:   { color: 'var(--c-warning)', bg: 'var(--c-warning-soft)', icon: Clock,        label: 'Pendiente' },
  'en proceso':{ color: 'var(--c-info)',    bg: 'var(--c-info-soft)',    icon: Truck,        label: 'En proceso' },
  entregado:   { color: 'var(--c-success)', bg: 'var(--c-success-soft)', icon: CheckCircle2, label: 'Entregado' },
  cancelado:   { color: 'var(--c-error)',   bg: 'var(--c-error-soft)',   icon: XCircle,      label: 'Cancelado' },
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
      <Container className="py-12 text-center">
        <div className="inline-block w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-muted mt-4">Cargando tus pedidos...</p>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container className="py-12">
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Mis pedidos' }]}
          title="Mis pedidos"
        />
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
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/' }, { label: 'Mis pedidos' }]}
        title="Mis pedidos"
        subtitle={`${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'} en total`}
      />

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
                      Pedido N° {order.display_number ?? order.order_id}
                    </h3>
                    <StatusBadge state={order.order_state} />
                    <span className="text-xs text-faint">Ref. #{order.order_id}</span>
                  </div>

                  <p className="text-sm text-muted">
                    {dateStr} · {detailsCount} {detailsCount === 1 ? 'producto' : 'productos'} · {paymentLabel}
                  </p>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <p className="text-xl font-bold text-brand">
                      S/ {Number(order.total_price).toFixed(2)}
                    </p>
                    {isPaymentConfirmed(order) && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <FileText size={13} />
                        Comprobante disponible
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex items-center text-muted">
                  <ChevronRight size={20} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
