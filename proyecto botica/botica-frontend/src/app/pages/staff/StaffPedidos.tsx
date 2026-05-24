import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router';
import {
  Search, Clock, CheckCircle2, XCircle, Truck, ChevronRight, Inbox,
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import type { Order, OrderState } from '../../lib/types';

type Filter = 'all' | OrderState;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',         label: 'Todos' },
  { value: 'pendiente',   label: 'Pendientes' },
  { value: 'en proceso',  label: 'En proceso' },
  { value: 'entregado',   label: 'Entregados' },
  { value: 'cancelado',   label: 'Cancelados' },
];

export default function StaffPedidos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  const stateFilter = (searchParams.get('state') as Filter) || 'all';

  useEffect(() => {
    loadOrders(stateFilter);
  }, [stateFilter]);

  async function loadOrders(filter: Filter) {
    setIsLoading(true);
    try {
      const data = await api.orders.getAll(
        filter === 'all' ? {} : { order_state: filter }
      );
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar pedidos');
    } finally {
      setIsLoading(false);
    }
  }

  function setFilter(filter: Filter) {
    const next = new URLSearchParams(searchParams);
    if (filter === 'all') next.delete('state');
    else next.set('state', filter);
    setSearchParams(next);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      if (String(o.order_id).includes(q)) return true;
      const name = (o.customer_name || '').toLowerCase();
      return name.includes(q);
    });
  }, [orders, query]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1F2E]">Pedidos web</h1>
        <p className="text-sm text-[#4A5260]">Gestiona los pedidos online</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por # de pedido o nombre del cliente"
            className="w-full pl-10 pr-3 py-2.5 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F26430]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = stateFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? 'bg-[#F26430] text-white border-[#F26430]'
                    : 'bg-white text-[#4A5260] border-[#E5E7EB] hover:border-[#F26430]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-[#F26430] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center text-[#4A5260]">
          <Inbox size={48} className="mx-auto mb-3 text-[#9CA3AF]" />
          <p className="font-medium text-[#1A1F2E]">No hay pedidos</p>
          <p className="text-sm">
            {query
              ? 'Prueba con otro término de búsqueda'
              : 'No hay pedidos para este filtro'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <OrderRow key={order.order_id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <Link
      to={`/staff/pedidos/${order.order_id}`}
      className="block bg-white rounded-xl border border-[#E5E7EB] p-4 hover:border-[#F26430] hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-[#1A1F2E]">#{order.order_id}</span>
            <StatusBadge state={order.order_state} />
          </div>
          <p className="text-sm text-[#1A1F2E] truncate">
            {order.customer_name || 'Cliente sin nombre'}
          </p>
          <p className="text-xs text-[#4A5260]">
            {new Date(order.order_date).toLocaleString('es-PE', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
            {order.payment?.payment_method && (
              <> · {order.payment.payment_method}</>
            )}
            {order.delivery_type && <> · {order.delivery_type}</>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-[#F26430]">
            S/ {Number(order.total_price).toFixed(2)}
          </p>
          <ChevronRight size={18} className="inline text-[#9CA3AF] mt-1" />
        </div>
      </div>
    </Link>
  );
}

export function StatusBadge({ state }: { state: OrderState }) {
  const map: Record<OrderState, { label: string; bg: string; fg: string; icon: typeof Clock }> = {
    pendiente:    { label: 'Pendiente',   bg: '#FEF3C7', fg: '#92400E', icon: Clock },
    'en proceso': { label: 'En proceso',  bg: '#DBEAFE', fg: '#1E40AF', icon: Truck },
    entregado:    { label: 'Entregado',   bg: '#D1FAE5', fg: '#065F46', icon: CheckCircle2 },
    cancelado:    { label: 'Cancelado',   bg: '#FEE2E2', fg: '#991B1B', icon: XCircle },
  };
  const cfg = map[state];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.fg }}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}
