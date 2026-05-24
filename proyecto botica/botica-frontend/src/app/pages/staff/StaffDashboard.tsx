import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  TrendingUp, ShoppingBag, AlertTriangle, Clock,
  CheckCircle2, ArrowRight, Package, ClipboardList,
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
        <div className="inline-block w-12 h-12 border-4 border-[#F26430] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1F2E]">
          Hola, {user?.full_name?.split(' ')[0] || 'Usuario'}
        </h1>
        <p className="text-sm text-[#4A5260] capitalize">{today}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={TrendingUp}
          label="Ventas hoy"
          value={`S/ ${stats.ventas.toFixed(2)}`}
          color="#10B981"
          bg="#D1FAE5"
        />
        <KpiCard
          icon={ShoppingBag}
          label="Pedidos hoy"
          value={String(stats.pedidos)}
          color="#3B82F6"
          bg="#DBEAFE"
        />
        <KpiCard
          icon={Clock}
          label="Pendientes"
          value={String(stats.pendientes)}
          color="#F59E0B"
          bg="#FEF3C7"
          link="/staff/pedidos?state=pendiente"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Ticket promedio"
          value={`S/ ${stats.ticket_promedio.toFixed(2)}`}
          color="#DC2626"
          bg="#FEE2E2"
        />
      </div>

      <section className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#1A1F2E]">Pedidos pendientes</h2>
          <Link
            to="/staff/pedidos?state=pendiente"
            className="text-sm text-[#F26430] hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-[#4A5260]">
            <CheckCircle2 size={48} className="mx-auto text-[#10B981] mb-2" />
            <p>¡No hay pedidos pendientes!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order.order_id}
                to={`/staff/pedidos/${order.order_id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F9FAFB] border border-[#E5E7EB] transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#1A1F2E]">Pedido #{order.order_id}</p>
                  <p className="text-xs text-[#4A5260] truncate">
                    {order.customer_name || 'Cliente'} ·{' '}
                    {order.payment?.payment_method || 'sin pago'}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-semibold text-[#F26430]">
                    S/ {Number(order.total_price).toFixed(2)}
                  </p>
                  <p className="text-xs text-[#4A5260]">
                    {new Date(order.order_date).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/staff/nueva-venta"
          className="bg-gradient-to-br from-[#F26430] to-[#D94E1F] text-white rounded-xl p-6 hover:shadow-lg transition-shadow"
        >
          <Package size={28} className="mb-2" />
          <h3 className="font-bold text-lg">Nueva venta (POS)</h3>
          <p className="text-sm text-white/80">Atender cliente en mostrador</p>
        </Link>
        <Link
          to="/staff/cierre"
          className="bg-white border-2 border-[#E5E7EB] rounded-xl p-6 hover:border-[#F26430] transition-colors"
        >
          <ClipboardList size={28} className="mb-2 text-[#1A1F2E]" />
          <h3 className="font-bold text-lg text-[#1A1F2E]">Cierre de turno</h3>
          <p className="text-sm text-[#4A5260]">Resumen del día y caja</p>
        </Link>
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
  bg: string;
  link?: string;
}

function KpiCard({ icon: Icon, label, value, color, bg, link }: KpiCardProps) {
  const content = (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 hover:shadow-md transition-shadow h-full">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
        style={{ backgroundColor: bg }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <p className="text-xs text-[#4A5260]">{label}</p>
      <p className="text-xl font-bold text-[#1A1F2E] mt-1">{value}</p>
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}
