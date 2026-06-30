// ============================================================
// StaffCierre — Resumen / cierre de turno
// ============================================================
// Muestra el resumen del día del trabajador autenticado:
// ventas totales, pedidos atendidos, desglose por método de pago
// (con gráfico de dona) y top 3 productos. Datos REALES desde
// GET /api/orders/shift-summary (filtrado por user_id del JWT).
// Reutiliza Button/Card/tokens de los prompts 1 y 2.
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, ShoppingBag, CreditCard, Award, Download, RefreshCw, PieChart as PieIcon,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
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

// Colores sobrios de la paleta para cada método (coherentes con el dashboard)
const PAYMENT_COLORS: Record<string, string> = {
  efectivo: 'var(--c-success)',  // success
  yape: 'var(--c-violet)',       // violeta
  plin: 'var(--c-cool)',         // azul acero
  tarjeta: 'var(--c-brand)',     // brand
  transferencia: 'var(--c-info)',// info
  sin_pago: 'var(--c-faint)',    // neutral
};

export default function StaffCierre() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Descarga el PDF del cierre (sin diálogo de impresión): pide el archivo al
  // backend y dispara la descarga del .pdf con el nombre sugerido.
  async function handleDownloadPdf() {
    setIsDownloading(true);
    try {
      const { blob, filename } = await api.orders.downloadShiftSummaryPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Reporte de cierre descargado.');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo descargar el PDF del cierre.');
    } finally {
      setIsDownloading(false);
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
  const sede = user?.location_name?.trim() || null;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Cierre de turno"
        subtitle={
          <span>
            {sede && <>{sede} · </>}
            <span className="capitalize">{today}</span>
          </span>
        }
        actions={
          <>
            <Button variant="secondary" onClick={loadSummary}>
              <RefreshCw size={14} /> Actualizar
            </Button>
            <Button variant="dark" onClick={handleDownloadPdf} loading={isDownloading}>
              <Download size={14} /> {isDownloading ? 'Generando…' : 'Descargar PDF'}
            </Button>
          </>
        }
      />

      {/* Membrete del reporte: operador + métricas clave (card oscuro) */}
      <div className="relative overflow-hidden rounded-2xl border border-line shadow-soft bg-ink-2 text-white mb-5">
        <div
          className="absolute -right-12 -top-14 w-60 h-60 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #F15A29, transparent 70%)' }}
        />
        <div className="relative p-5 sm:p-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center font-bold text-lg shrink-0 shadow-brand text-white">
              {operatorName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
                Reporte de cierre · Operador
              </p>
              <p className="font-bold text-lg truncate text-white">{operatorName}</p>
              <p className="text-xs text-white/65 capitalize">
                {user?.role === 'admin' ? 'Administrador' : 'Empleado'}
                {sede && ` · ${sede}`}
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

      {/* Detalle: ventas por método (dona + desglose) + top productos */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={CreditCard} className="mb-4">Ventas por método de pago</SectionTitle>
          <PaymentBreakdown summary={summary} />
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

// ============================================================
// Ventas por método de pago: gráfico de dona + desglose (datos reales)
// ============================================================

function PaymentBreakdown({ summary }: { summary: ShiftSummary }) {
  const methods = summary.by_payment_method;
  const total = useMemo(
    () => methods.reduce((sum, m) => sum + Number(m.total), 0),
    [methods]
  );

  const chartData = useMemo(
    () => methods.map((m) => ({
      key: m.payment_method,
      label: PAYMENT_LABELS[m.payment_method] || m.payment_method,
      total: Number(m.total),
      count: m.count,
      color: PAYMENT_COLORS[m.payment_method] || 'var(--c-faint)',
    })),
    [methods]
  );

  if (methods.length === 0 || total === 0) {
    return (
      <div className="h-[220px] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 mb-2 rounded-2xl bg-page flex items-center justify-center">
          <PieIcon size={24} className="text-faint" />
        </div>
        <p className="text-sm font-medium text-muted">Sin ventas hoy</p>
        <p className="text-xs text-faint mt-0.5">Aún no hay movimientos registrados</p>
      </div>
    );
  }

  return (
    <div>
      {/* Dona */}
      <div className="relative h-[200px] w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="total"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={chartData.length > 1 ? 2 : 0}
              stroke="var(--c-surface)"
              strokeWidth={2}
            >
              {chartData.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Total al centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Total</span>
          <span className="text-lg font-bold text-text tabular-nums">S/ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Desglose */}
      <div className="space-y-2">
        {chartData.map((d) => {
          const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
          return (
            <div
              key={d.key}
              className="flex items-center justify-between gap-3 bg-page border border-line-2 rounded-xl px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="font-medium text-text text-sm truncate">{d.label}</span>
                <span className="text-xs text-muted shrink-0">· {pct}%</span>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-text tabular-nums text-sm">S/ {d.total.toFixed(2)}</p>
                <p className="text-xs text-muted">{d.count} pedido{d.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DonutTooltipProps {
  active?: boolean;
  total: number;
  payload?: Array<{ payload: { label: string; total: number; count: number; color: string } }>;
}

function DonutTooltip({ active, payload, total }: DonutTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-line bg-surface shadow-card px-3 py-2">
      <p className="text-xs font-semibold text-text mb-0.5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
        {d.label}
      </p>
      <p className="text-sm font-bold text-text tabular-nums">S/ {d.total.toFixed(2)} · {pct}%</p>
      <p className="text-xs text-muted tabular-nums">{d.count} pedido{d.count !== 1 ? 's' : ''}</p>
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
      <p className="text-2xl font-bold tabular-nums leading-none text-white">{value}</p>
    </div>
  );
}

/** Estado vacío reutilizado en las tarjetas de detalle. */
function EmptyBlock() {
  return (
    <div className="text-center py-6 bg-page border border-dashed border-line rounded-xl">
      <p className="text-sm font-medium text-muted">Sin ventas hoy</p>
      <p className="text-xs text-faint mt-0.5">Aún no hay movimientos registrados</p>
    </div>
  );
}
