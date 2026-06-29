import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation as useRouteLocation, useNavigate } from 'react-router';
import {
  Search, Clock, CheckCircle2, XCircle, Truck, Store, Inbox, Download, Loader2,
  ChevronLeft, ChevronRight, MapPin,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useAdminScopeOptional } from '../../lib/AdminScopeContext';
import { Segmented } from '../../components/Segmented';
import { toast } from 'sonner';
import type { Order, OrderState } from '../../lib/types';

type Filter = 'all' | OrderState;
type Period = '7d' | '30d' | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',         label: 'Todos' },
  { value: 'pendiente',   label: 'Pendientes' },
  { value: 'en proceso',  label: 'En proceso' },
  { value: 'entregado',   label: 'Entregados' },
  { value: 'cancelado',   label: 'Cancelados' },
];

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d',  label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'all', label: 'Todos' },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const PER_PAGE = 10; // pedidos por página

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const deliveryLabel = (t: Order['delivery_type']) =>
  t === 'pickup' ? 'Recojo' : t === 'delivery' ? 'Delivery' : '—';

export default function StaffPedidos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { pathname } = useRouteLocation();
  const isAdmin = user?.role === 'admin';
  // /admin/pedidos y /staff/pedidos comparten esta página; los enlaces de
  // detalle deben quedarse en la sección actual.
  const basePath = pathname.startsWith('/admin') ? '/admin/pedidos' : '/staff/pedidos';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  // El filtro de sede del admin lo MANDA el selector global del topbar
  // (useAdminScopeOptional); al cambiarlo arriba, la tabla se actualiza. El emp
  // queda fijado a su sede por el backend (no filtra aquí).
  const adminScope = useAdminScopeOptional();
  const selectedLocationId = isAdmin ? (adminScope?.selectedLocationId ?? null) : null;

  const stateFilter = (searchParams.get('state') as Filter) || 'all';
  // El periodo por defecto es "Últimos 7 días" (vista inicial acotada).
  const period = (searchParams.get('period') as Period) || '7d';

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

  function setPeriod(p: Period) {
    const next = new URLSearchParams(searchParams);
    if (p === '7d') next.delete('period');
    else next.set('period', p);
    setSearchParams(next);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff = period === '7d' ? Date.now() - 7 * DAY_MS
      : period === '30d' ? Date.now() - 30 * DAY_MS
      : null;
    return orders.filter((o) => {
      if (cutoff != null && new Date(o.order_date).getTime() < cutoff) return false;
      if (q) {
        const inId = String(o.order_id).includes(q);
        const inName = (o.customer_name || '').toLowerCase().includes(q);
        if (!inId && !inName) return false;
      }
      return true;
    });
  }, [orders, query, period]);

  // Paginación (10 por página) sobre el conjunto YA filtrado. Se vuelve a la
  // página 1 cada vez que cambia un filtro (búsqueda, periodo, estado o sede).
  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0);
  }, [query, period, stateFilter, selectedLocationId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  const periodLabel = PERIODS.find((p) => p.value === period)?.label.toLowerCase();

  return (
    // En /admin la página no tiene wrapper de layout (a diferencia de /staff),
    // así que aporta su propio padding para igualar a las demás secciones admin.
    <div className={pathname.startsWith('/admin') ? 'p-4 lg:p-6' : ''}>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-text">Pedidos</h1>
        <p className="text-sm text-muted">
          {isAdmin ? (
            <span className="inline-flex items-center gap-1">
              Gestiona los pedidos ·
              <span className="inline-flex items-center gap-1 font-medium text-text">
                <MapPin size={13} className="text-brand" />
                {adminScope?.scopeLabel ?? 'Todas las sedes'}
              </span>
            </span>
          ) : (
            'Gestiona los pedidos de tu sede'
          )}
        </p>
      </div>

      <div className="bg-surface rounded-2xl border border-line shadow-soft p-3 sm:p-4 mb-4">
        {/* Buscador (la sede del admin la fija el selector global del topbar) */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por # de pedido o nombre del cliente"
            className="w-full h-11 pl-11 pr-3 bg-surface border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
          />
        </div>

        {/* Filtros compactos en UNA fila: periodo + estado (segmented controls).
            El protagonismo es la tabla; estos controles ocupan poco alto. */}
        <div className="flex flex-wrap items-center gap-2.5 mt-3">
          <Segmented ariaLabel="Periodo" value={period} onChange={setPeriod} options={PERIODS} />
          <span className="hidden sm:block w-px h-6 bg-line" />
          <Segmented ariaLabel="Estado" value={stateFilter} onChange={setFilter} options={FILTERS} />
        </div>
      </div>

      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted mb-3 px-1">
          {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
          {` · ${periodLabel}`}
          {stateFilter !== 'all' && ` · ${FILTERS.find((f) => f.value === stateFilter)?.label.toLowerCase()}`}
        </p>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-line shadow-soft p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-2 flex items-center justify-center">
            <Inbox size={28} className="text-faint" />
          </div>
          <p className="font-semibold text-text">No hay pedidos</p>
          <p className="text-sm text-muted mt-0.5">
            {query
              ? 'Prueba con otro término de búsqueda'
              : `No hay pedidos en el periodo "${PERIODS.find((p) => p.value === period)?.label}"`}
          </p>
        </div>
      ) : (
        <>
          <OrdersView orders={pageItems} basePath={basePath} />
          <Pager
            page={safePage}
            pageCount={pageCount}
            perPage={PER_PAGE}
            total={filtered.length}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          />
        </>
      )}
    </div>
  );
}

// Segmented se movió a components/Segmented.tsx (compartido con admin).

// ============================================================
// Vista de pedidos: TABLA en desktop, TARJETAS apiladas en móvil.
// Ambas comparten clic-a-detalle y descarga directa del comprobante.
// ============================================================

function OrdersView({ orders, basePath }: { orders: Order[]; basePath: string }) {
  return (
    <>
      {/* Desktop: tabla a ancho completo */}
      <div className="hidden md:block bg-surface rounded-2xl border border-line shadow-soft overflow-hidden">
        <table className="w-full text-sm table-fixed">
          {/* Reparto BALANCEADO del ancho (table-fixed → las columnas se rigen
              por estos %, no por el contenido). Antes "Cliente" era la única col
              flexible (<col/>) y absorbía TODO el espacio sobrante, dejando un
              hueco muerto a su derecha. Ahora cada columna tiene su % y la suma
              da 100, así que no quedan zonas vacías. Cliente trunca si el nombre
              es muy largo (ver celda con `truncate`). */}
          <colgroup>
            <col className="w-[8%]" />   {/* N° (estrecho) */}
            <col className="w-[16%]" />  {/* Estado (ajustado al badge) */}
            <col className="w-[19%]" />  {/* Cliente (más angosto; trunca si es largo) */}
            <col className="w-[14%]" />  {/* Entrega */}
            <col className="w-[21%]" />  {/* Fecha */}
            <col className="w-[11%]" />  {/* Total (cerca de Fecha, no en el borde) */}
            <col className="w-[11%]" />  {/* Comprobante (icono centrado, con respiro del borde) */}
          </colgroup>
          <thead>
            {/* Encabezados CENTRADOS en todas las columnas. El contenido de cada
                celda conserva su alineación legible (Cliente a la izquierda;
                el resto centrado). */}
            <tr className="bg-surface-2 text-center text-[11px] font-semibold uppercase tracking-wider text-faint border-b border-line">
              <th className="px-4 py-3 font-semibold whitespace-nowrap">N°</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Estado</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap text-left">Cliente</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Entrega</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Fecha</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Total</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Comprobante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((order) => (
              <OrderTableRow key={order.order_id} order={order} basePath={basePath} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: tarjetas apiladas (sin scroll horizontal) */}
      <div className="md:hidden space-y-2.5">
        {orders.map((order) => (
          <OrderCard key={order.order_id} order={order} basePath={basePath} />
        ))}
      </div>
    </>
  );
}

// Recorta el nombre del cliente a ~30 caracteres (con elipsis) para que no
// rompa la maqueta de la tabla. El nombre completo va en el `title`.
const clipName = (s: string, n = 30) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

function OrderTableRow({ order, basePath }: { order: Order; basePath: string }) {
  const navigate = useNavigate();
  const go = () => navigate(`${basePath}/${order.order_id}`);

  return (
    <tr
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Ver pedido #${order.order_id}`}
      className="cursor-pointer hover:bg-surface-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
    >
      <td className="px-4 py-3 font-bold text-text tabular-nums whitespace-nowrap text-center">#{order.order_id}</td>
      <td className="px-4 py-3 whitespace-nowrap text-center"><StatusBadge state={order.order_state} /></td>
      <td
        className="px-4 py-3 text-text font-medium truncate text-left"
        title={order.customer_name || 'Cliente sin nombre'}
      >
        {clipName(order.customer_name || 'Cliente sin nombre')}
      </td>
      <td className="px-4 py-3 text-muted whitespace-nowrap text-center">
        <span className="inline-flex items-center gap-1.5">
          {order.delivery_type === 'delivery'
            ? <Truck size={14} className="text-faint" />
            : order.delivery_type === 'pickup'
            ? <Store size={14} className="text-faint" />
            : null}
          {deliveryLabel(order.delivery_type)}
        </span>
      </td>
      {/* Sin nowrap: en anchos de pantalla justos la fecha/hora baja a 2 líneas
          en vez de desbordarse sobre la columna Total (table-fixed). */}
      <td className="px-4 py-3 text-muted tabular-nums leading-snug text-center">{fmtDateTime(order.order_date)}</td>
      <td className="px-4 py-3 text-center font-bold text-text tabular-nums whitespace-nowrap">
        S/ {Number(order.total_price).toFixed(2)}
      </td>
      {/* Icono centrado en su columna → deja respiro con el borde derecho de la tabla. */}
      <td className="px-4 py-3 text-center">
        <DownloadVoucherButton order={order} />
      </td>
    </tr>
  );
}

function OrderCard({ order, basePath }: { order: Order; basePath: string }) {
  const navigate = useNavigate();
  const tile = STATE_TILE[order.order_state];
  const TileIcon = tile.icon;
  return (
    <div
      onClick={() => navigate(`${basePath}/${order.order_id}`)}
      role="button"
      tabIndex={0}
      aria-label={`Ver pedido #${order.order_id}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`${basePath}/${order.order_id}`);
        }
      }}
      className="group flex items-center gap-3.5 bg-surface rounded-2xl border border-line shadow-soft p-4 hover:border-brand hover:shadow-card transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${tile.cls}`}>
        <TileIcon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-bold text-text">#{order.order_id}</span>
          <StatusBadge state={order.order_state} />
        </div>
        <p className="text-sm font-medium text-text truncate" title={order.customer_name || 'Cliente sin nombre'}>
          {clipName(order.customer_name || 'Cliente sin nombre')}
        </p>
        <p className="text-xs text-muted">
          {fmtDateTime(order.order_date)} · {deliveryLabel(order.delivery_type)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <p className="font-bold text-text tabular-nums">
          S/ {Number(order.total_price).toFixed(2)}
        </p>
        <DownloadVoucherButton order={order} />
      </div>
    </div>
  );
}

// Botón de descarga directa del comprobante PDF (vouchers/ en S3). Si el pedido
// no tiene pago/comprobante, se muestra deshabilitado. El clic NO navega al
// detalle (stopPropagation). Si el voucher aún no existe, lo genera al vuelo.
function DownloadVoucherButton({ order }: { order: Order }) {
  const [loading, setLoading] = useState(false);
  const hasPayment = !!order.payment;

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!hasPayment || loading) return;
    setLoading(true);
    try {
      let url = order.payment?.voucher_pdf_url || null;
      if (!url) {
        const res = await api.orders.getVoucher(order.order_id);
        url = res.voucher_pdf_url;
      }
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const msg = err instanceof ApiError ? (err.body as any)?.message || err.message : 'No se pudo obtener el comprobante';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!hasPayment || loading}
      title={hasPayment ? 'Descargar comprobante PDF' : 'Sin comprobante'}
      aria-label={hasPayment ? `Descargar comprobante del pedido ${order.order_id}` : 'Sin comprobante'}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-line text-muted hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
    </button>
  );
}

// ============================================================
// Paginación: misma estética que la grilla de Nueva venta.
// "Mostrando X–Y de Z" a la izquierda; flechas redondeadas a la
// derecha (atenuadas en los extremos) con el indicador "n / total".
// ============================================================
function Pager({
  page, pageCount, perPage, total, onPrev, onNext,
}: {
  page: number;
  pageCount: number;
  perPage: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const from = total === 0 ? 0 : page * perPage + 1;
  const to = Math.min((page + 1) * perPage, total);
  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      <p className="text-xs text-muted">
        Mostrando{' '}
        <span className="font-semibold text-text">{from}–{to}</span>{' '}
        de <span className="font-semibold text-text">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <PagerButton label="Página anterior" disabled={page === 0} onClick={onPrev}>
          <ChevronLeft size={18} />
        </PagerButton>
        <span className="text-sm font-semibold text-text tabular-nums min-w-[4.5rem] text-center">
          {page + 1} / {pageCount}
        </span>
        <PagerButton label="Página siguiente" disabled={page >= pageCount - 1} onClick={onNext}>
          <ChevronRight size={18} />
        </PagerButton>
      </div>
    </div>
  );
}

function PagerButton({
  children, label, disabled, onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-10 h-10 flex items-center justify-center rounded-xl border border-line bg-surface text-ink-2 hover:border-brand hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-ink-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand"
    >
      {children}
    </button>
  );
}

const STATE_TILE: Record<OrderState, { cls: string; icon: typeof Clock }> = {
  pendiente:    { cls: 'bg-warning-soft text-warning', icon: Clock },
  'en proceso': { cls: 'bg-info-soft text-info',       icon: Truck },
  entregado:    { cls: 'bg-success-soft text-success', icon: CheckCircle2 },
  cancelado:    { cls: 'bg-error-soft text-error',     icon: XCircle },
};

export function StatusBadge({ state }: { state: OrderState }) {
  const map: Record<OrderState, { label: string; cls: string; icon: typeof Clock }> = {
    pendiente:    { label: 'Pendiente',   cls: 'bg-warning-soft text-warning', icon: Clock },
    'en proceso': { label: 'En proceso',  cls: 'bg-info-soft text-info',       icon: Truck },
    entregado:    { label: 'Entregado',   cls: 'bg-success-soft text-success', icon: CheckCircle2 },
    cancelado:    { label: 'Cancelado',   cls: 'bg-error-soft text-error',     icon: XCircle },
  };
  const cfg = map[state];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.cls}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}
