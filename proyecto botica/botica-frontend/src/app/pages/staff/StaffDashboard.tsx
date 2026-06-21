import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Wallet, ShoppingBag, Clock, Receipt,
  CheckCircle2, ArrowRight, ArrowUpRight, Package, ClipboardList,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import type { Order, OrdersStats } from '../../lib/types';

interface DashboardStats {
  ventas: number;
  pedidos: number;
  pendientes: number;
  ticket_promedio: number;
  low_stock_count: number;
}

const EMPTY_STATS: DashboardStats = {
  ventas: 0,
  pedidos: 0,
  pendientes: 0,
  ticket_promedio: 0,
  low_stock_count: 0,
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    setIsLoading(true);
    try {
      const [statsData, ordersData] = await Promise.all([
        api.orders.getStats().catch(() => null) as Promise<OrdersStats | null>,
        api.orders.getAll({ order_state: 'pendiente' }).catch(() => [] as Order[]),
      ]);

      setStats({
        ventas: statsData?.ventas ?? 0,
        pedidos: statsData?.pedidos ?? 0,
        pendientes: statsData?.pendientes ?? 0,
        ticket_promedio: statsData?.ticket_promedio ?? 0,
        low_stock_count: 0,
      });

      setRecentOrders(ordersData.slice(0, 5));
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar dashboard');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text">
            Hola, {user?.full_name?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className="text-sm text-muted capitalize">{today}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted shadow-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Turno activo
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        <KpiCard
          icon={Wallet}
          label="Ventas hoy"
          value={`S/ ${stats.ventas.toFixed(2)}`}
          accent="#F15A29"
          hint="Acumulado del día"
          index={0}
        />
        <KpiCard
          icon={ShoppingBag}
          label="Pedidos hoy"
          value={String(stats.pedidos)}
          accent="#4C82A8"
          hint="Atendidos en tu sede"
          index={1}
        />
        <KpiCard
          icon={Clock}
          label="Pendientes"
          value={String(stats.pendientes)}
          accent="#F59E0B"
          hint="Requieren atención"
          link="/staff/pedidos?state=pendiente"
          index={2}
        />
        <KpiCard
          icon={Receipt}
          label="Ticket promedio"
          value={`S/ ${stats.ticket_promedio.toFixed(2)}`}
          accent="#16A34A"
          hint="Por pedido"
          index={3}
        />
      </div>

      <section className="animate-panel bg-surface rounded-2xl border border-line shadow-soft p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-lg text-text">Pedidos pendientes</h2>
            <p className="text-xs text-muted mt-0.5">Los próximos en tu cola de atención</p>
          </div>
          <Link
            to="/staff/pedidos?state=pendiente"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:gap-1.5 transition-all"
          >
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-success-soft flex items-center justify-center">
              <CheckCircle2 size={28} className="text-success" />
            </div>
            <p className="font-semibold text-text">¡Todo al día!</p>
            <p className="text-sm text-muted">No hay pedidos pendientes por atender</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentOrders.map((order) => (
              <Link
                key={order.order_id}
                to={`/staff/pedidos/${order.order_id}`}
                className="group flex items-center gap-3 p-3.5 rounded-xl border border-line hover:border-brand hover:bg-page transition-all"
              >
                <div className="w-10 h-10 shrink-0 rounded-xl bg-warning-soft flex items-center justify-center">
                  <Clock size={18} className="text-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text">Pedido #{order.order_id}</p>
                  <p className="text-xs text-muted truncate capitalize">
                    {order.customer_name || 'Cliente'} ·{' '}
                    {order.payment?.payment_method || 'sin pago'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-text tabular-nums">
                    S/ {Number(order.total_price).toFixed(2)}
                  </p>
                  <p className="text-xs text-faint tabular-nums">
                    {new Date(order.order_date).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-faint group-hover:text-brand transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/staff/nueva-venta"
          className="animate-panel group relative overflow-hidden bg-ink-2 text-white rounded-2xl p-6 shadow-card hover:-translate-y-0.5 transition-all"
        >
          <div
            className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-25 blur-2xl"
            style={{ background: 'radial-gradient(circle, #F15A29, transparent 70%)' }}
          />
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center mb-4 shadow-brand">
              <Package size={24} />
            </div>
            <h3 className="font-bold text-lg flex items-center gap-1.5">
              Nueva venta (POS)
              <ArrowUpRight size={18} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </h3>
            <p className="text-sm text-white/70 mt-0.5">Atender cliente en mostrador</p>
          </div>
        </Link>
        <Link
          to="/staff/cierre"
          className="animate-panel group bg-surface border border-line rounded-2xl p-6 shadow-soft hover:border-brand hover:-translate-y-0.5 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-soft flex items-center justify-center mb-4">
            <ClipboardList size={24} className="text-brand" />
          </div>
          <h3 className="font-bold text-lg text-text flex items-center gap-1.5">
            Cierre de turno
            <ArrowUpRight size={18} className="text-faint group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </h3>
          <p className="text-sm text-muted mt-0.5">Resumen del día y caja</p>
        </Link>
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  accent: string;
  hint: string;
  link?: string;
  index: number;
}

function KpiCard({ icon: Icon, label, value, accent, hint, link, index }: KpiCardProps) {
  const content = (
    <div
      className="animate-panel group relative h-full overflow-hidden bg-surface rounded-2xl border border-line shadow-soft p-5 hover:shadow-card hover:-translate-y-0.5 transition-all"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Barra de acento lateral */}
      <span
        className="absolute left-0 top-0 h-full w-1 rounded-r"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Icon size={22} />
        </div>
        {link && (
          <ArrowUpRight
            size={18}
            className="text-faint group-hover:text-brand transition-colors"
          />
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">
        {label}
      </p>
      <p className="text-[26px] lg:text-[28px] leading-none font-bold text-text tabular-nums mb-2">
        {value}
      </p>
      <p className="text-xs text-faint">{hint}</p>
    </div>
  );

  return link ? (
    <Link to={link} className="block h-full">{content}</Link>
  ) : (
    content
  );
}
