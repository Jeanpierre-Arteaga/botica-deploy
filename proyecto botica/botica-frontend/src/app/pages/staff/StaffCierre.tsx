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
      <div className="max-w-4xl mx-auto bg-surface rounded-xl border border-line p-12 text-center">
        <p className="text-muted mb-4">No se pudo cargar el resumen del turno.</p>
        <button
          onClick={loadSummary}
          className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-md text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2 print:hidden">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text">Cierre de turno</h1>
          <p className="text-sm text-muted capitalize">{today}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadSummary}
            className="px-3.5 py-2.5 border border-line hover:border-brand text-text rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-ink hover:bg-ink-2 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden mb-4">
        {/* Cabecera formal del reporte */}
        <div className="relative bg-ink-2 px-6 py-5 text-white overflow-hidden">
          <div
            className="absolute -right-10 -top-12 w-48 h-48 rounded-full opacity-20 blur-2xl"
            style={{ background: 'radial-gradient(circle, #F15A29, transparent 70%)' }}
          />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center font-bold text-lg shrink-0 shadow-brand">
                {(summary.full_name || user?.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                  Reporte de cierre · Operador
                </p>
                <p className="font-bold text-lg truncate">{summary.full_name || user?.full_name}</p>
                <p className="text-xs text-white/65 capitalize">
                  {user?.role === 'admin' ? 'Administrador' : 'Empleado'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">Fecha</p>
              <p className="text-sm font-medium capitalize">{today}</p>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <SummaryStat
            icon={TrendingUp}
            label="Ventas totales"
            value={`S/ ${Number(summary.total_sales).toFixed(2)}`}
            accent="#F15A29"
          />
          <SummaryStat
            icon={ShoppingBag}
            label="Pedidos atendidos"
            value={String(summary.total_transactions)}
            accent="#4C82A8"
          />
        </div>

        {/* Desglose por método de pago */}
        <div className="border-t border-line pt-5 mb-5">
          <h2 className="font-bold text-text mb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-brand" />
            Desglose por método
          </h2>
          {summary.by_payment_method.length === 0 ? (
            <div className="text-center py-6 bg-page border border-dashed border-line rounded-xl">
              <p className="text-sm font-medium text-muted">Sin ventas hoy</p>
              <p className="text-xs text-faint mt-0.5">Aún no hay movimientos registrados</p>
            </div>
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
        </div>

        {/* Top productos */}
        <div className="border-t border-line pt-5">
          <h2 className="font-bold text-text mb-3 flex items-center gap-2">
            <Award size={16} className="text-brand" />
            Top 3 productos
          </h2>
          {summary.top_products.length === 0 ? (
            <div className="text-center py-6 bg-page border border-dashed border-line rounded-xl">
              <p className="text-sm font-medium text-muted">Sin ventas hoy</p>
              <p className="text-xs text-faint mt-0.5">Aún no hay movimientos registrados</p>
            </div>
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
        </div>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  icon: Icon, label, value, accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden bg-page border border-line rounded-2xl p-5">
      <span
        className="absolute left-0 top-0 h-full w-1 rounded-r"
        style={{ backgroundColor: accent }}
      />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon size={22} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">{label}</p>
      <p className="text-2xl lg:text-3xl leading-none font-bold text-text tabular-nums">{value}</p>
    </div>
  );
}
