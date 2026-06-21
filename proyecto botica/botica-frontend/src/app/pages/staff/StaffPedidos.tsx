import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation as useRouteLocation, Link } from 'react-router';
import {
  Search, Clock, CheckCircle2, XCircle, Truck, ChevronRight, Inbox,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useLocations } from '../../lib/LocationContext';
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
  const { user } = useAuth();
  const { locations } = useLocations();
  const { pathname } = useRouteLocation();
  const isAdmin = user?.role === 'admin';
  // /admin/pedidos y /staff/pedidos comparten esta página; los enlaces de
  // detalle deben quedarse en la sección actual.
  const basePath = pathname.startsWith('/admin') ? '/admin/pedidos' : '/staff/pedidos';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  // Solo admin puede filtrar por sede; emp queda fijado a la suya por el backend.
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  const stateFilter = (searchParams.get('state') as Filter) || 'all';

  useEffect(() => {
    loadOrders(stateFilter, selectedLocationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter, selectedLocationId]);

  async function loadOrders(filter: Filter, locationId: number | null) {
    setIsLoading(true);
    try {
      // El backend fuerza la sede del emp por el JWT; el front no manda location_id
      // salvo que un admin elija una sede concreta.
      const filters: { order_state?: OrderState; location_id?: number } = {};
      if (filter !== 'all') filters.order_state = filter;
      if (isAdmin && locationId) filters.location_id = locationId;

      const data = await api.orders.getAll(filters);
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
        <h1 className="text-2xl lg:text-3xl font-bold text-text">Pedidos</h1>
        <p className="text-sm text-muted">
          {isAdmin ? 'Gestiona los pedidos de todas las sedes' : 'Gestiona los pedidos de tu sede'}
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-line p-4 mb-4">
        {isAdmin && (
          <div className="mb-3">
            <label className="text-xs text-muted mb-1 block">Filtrar por sede</label>
            <select
              value={selectedLocationId ?? 'all'}
              onChange={(e) =>
                setSelectedLocationId(e.target.value === 'all' ? null : parseInt(e.target.value, 10))
              }
              className="w-full md:w-64 px-3 py-2 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="all">Todas las sedes</option>
              {locations.map((l) => (
                <option key={l.location_id} value={l.location_id}>
                  {l.location_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por # de pedido o nombre del cliente"
            className="w-full pl-10 pr-3 py-2.5 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
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
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface text-muted border-line hover:border-brand'
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
          <div className="inline-block w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line p-12 text-center text-muted">
          <Inbox size={48} className="mx-auto mb-3 text-faint" />
          <p className="font-medium text-text">No hay pedidos</p>
          <p className="text-sm">
            {query
              ? 'Prueba con otro término de búsqueda'
              : 'No hay pedidos para este filtro'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <OrderRow key={order.order_id} order={order} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, basePath }: { order: Order; basePath: string }) {
  return (
    <Link
      to={`${basePath}/${order.order_id}`}
      className="block bg-surface rounded-xl border border-line p-4 hover:border-brand hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-text">#{order.order_id}</span>
            <StatusBadge state={order.order_state} />
          </div>
          <p className="text-sm text-text truncate">
            {order.customer_name || 'Cliente sin nombre'}
          </p>
          <p className="text-xs text-muted">
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
          <p className="font-bold text-brand">
            S/ {Number(order.total_price).toFixed(2)}
          </p>
          <ChevronRight size={18} className="inline text-faint mt-1" />
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
