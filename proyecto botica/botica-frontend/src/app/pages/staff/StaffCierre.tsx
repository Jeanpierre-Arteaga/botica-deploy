// ============================================================
// StaffCierre — Resumen / cierre de turno
// ============================================================
// Muestra el resumen del día del trabajador autenticado:
// ventas totales, pedidos atendidos, desglose por método de pago
// y top 3 productos. Datos desde GET /api/orders/shift-summary
// (filtrado por user_id del JWT en el backend).
// ============================================================

import { useState, useEffect } from 'react';
import {
  TrendingUp, ShoppingBag, CreditCard, Award, Printer, RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import type { ShiftSummary } from '../../lib/types';
import { Button, Card, PageHeader, SectionTitle } from '../../components/ui/kit';

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  sin_pago: 'Sin pago',
};

export default function StaffCierre() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSummary() {
    setIsLoading(true);
    try {
      const data = await api.orders.getShiftSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar el resumen del turno');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) {
    return (
      <Card className="max-w-md mx-auto text-center p-10">
        <p className="text-muted mb-4">No se pudo cargar el resumen del turno.</p>
        <Button onClick={loadSummary}>
          <RefreshCw size={14} /> Reintentar
        </Button>
      </Card>
    );
  }

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const operatorName = summary.full_name || user?.full_name || 'Operador';

  return (
    <div>
      <PageHeader
        title="Cierre de turno"
        subtitle={<span className="capitalize">{today}</span>}
        className="print:hidden"
        actions={
          <>
            <Button variant="secondary" onClick={loadSummary}>
              <RefreshCw size={14} /> Actualizar
            </Button>
            <Button variant="dark" onClick={() => window.print()}>
              <Printer size={14} /> Imprimir
            </Button>
          </>
        }
      />

      {/* Membrete del reporte: operador + métricas clave */}
      <div className="relative overflow-hidden rounded-2xl border border-line shadow-soft bg-ink-2 text-white mb-5">
        <div
          className="absolute -right-12 -top-14 w-60 h-60 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #F15A29, transparent 70%)' }}
        />
        <div className="relative p-5 sm:p-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center font-bold text-lg shrink-0 shadow-brand">
              {operatorName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Reporte de cierre · Operador
              </p>
              <p className="font-bold text-lg truncate">{operatorName}</p>
              <p className="text-xs text-white/65 capitalize">
                {user?.role === 'admin' ? 'Administrador' : 'Empleado'} · {today}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <BannerStat
              icon={TrendingUp}
              label="Ventas totales"
              value={`S/ ${Number(summary.total_sales).toFixed(2)}`}
            />
            <BannerStat
              icon={ShoppingBag}
              label="Pedidos atendidos"
              value={String(summary.total_transactions)}
            />
          </div>
        </div>
      </div>

      {/* Detalle: desglose por método + top productos */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={CreditCard} className="mb-4">Desglose por método</SectionTitle>
          {summary.by_payment_method.length === 0 ? (
            <EmptyBlock />
          ) : (
            <div className="space-y-2">
              {summary.by_payment_method.map((m) => (
                <div
                  key={m.payment_method}
                  className="flex justify-between items-center bg-page border border-line-2 rounded-xl px-4 py-3 hover:border-line transition-colors"
                >
                  <span className="font-semibold text-text">
                    {PAYMENT_LABELS[m.payment_method] || m.payment_method}
                  </span>
                  <div className="text-right">
                    <p className="font-bold text-text tabular-nums">S/ {Number(m.total).toFixed(2)}</p>
                    <p className="text-xs text-muted">
                      {m.count} pedido{m.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon={Award} className="mb-4">Top 3 productos</SectionTitle>
          {summary.top_products.length === 0 ? (
            <EmptyBlock />
          ) : (
            <div className="space-y-2">
              {summary.top_products.map((p, idx) => (
                <div
                  key={p.product_id}
                  className="flex items-center gap-3 bg-page border border-line-2 rounded-xl px-4 py-3"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      idx === 0
                        ? 'bg-brand text-white'
                        : 'bg-brand-soft text-brand'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text truncate">{p.product_name}</p>
                    <p className="text-xs text-muted">{p.total_sold} unidades vendidas</p>
                  </div>
                  <p className="font-bold text-text shrink-0 tabular-nums">S/ {Number(p.revenue).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Métrica embebida en el membrete navy (alto contraste sobre fondo oscuro). */
function BannerStat({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 min-w-[140px]">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-1.5">
        <Icon size={13} className="text-brand" /> {label}
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
    </div>
  );
}

/** Estado vacío reutilizado en ambas tarjetas de detalle. */
function EmptyBlock() {
  return (
    <div className="text-center py-6 bg-page border border-dashed border-line rounded-xl">
      <p className="text-sm font-medium text-muted">Sin ventas hoy</p>
      <p className="text-xs text-faint mt-0.5">Aún no hay movimientos registrados</p>
    </div>
  );
}
