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
        <div className="inline-block w-10 h-10 border-4 border-[#F26430] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
        <p className="text-[#4A5260] mb-4">No se pudo cargar el resumen del turno.</p>
        <button
          onClick={loadSummary}
          className="px-4 py-2 bg-[#F26430] hover:bg-[#D94E1F] text-white rounded-md text-sm"
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
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1F2E]">Cierre de turno</h1>
          <p className="text-sm text-[#4A5260] capitalize">{today}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadSummary}
            className="px-3 py-2 border border-[#E5E7EB] hover:border-[#F26430] rounded-md text-sm flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-[#1A1F2E] hover:bg-[#2A2F3E] text-white rounded-md text-sm flex items-center gap-1 transition-colors"
          >
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-4">
        <div className="text-center mb-6">
          <p className="text-xs text-[#4A5260] uppercase tracking-wide">Operador del turno</p>
          <p className="font-bold text-lg text-[#1A1F2E]">{summary.full_name || user?.full_name}</p>
          <p className="text-xs text-[#4A5260] capitalize">
            {user?.role === 'admin' ? 'Administrador' : 'Empleado'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#FFF4EE] to-[#FFE4D6] rounded-xl p-4 text-center">
            <TrendingUp className="mx-auto text-[#F26430] mb-2" size={32} />
            <p className="text-xs text-[#4A5260] uppercase">Ventas totales</p>
            <p className="text-3xl font-bold text-[#F26430]">
              S/ {Number(summary.total_sales).toFixed(2)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#EFF4FB] to-[#DBEAFE] rounded-xl p-4 text-center">
            <ShoppingBag className="mx-auto text-[#1E4D8C] mb-2" size={32} />
            <p className="text-xs text-[#4A5260] uppercase">Pedidos atendidos</p>
            <p className="text-3xl font-bold text-[#1E4D8C]">{summary.total_transactions}</p>
          </div>
        </div>

        {/* Desglose por método de pago */}
        <div className="border-t border-[#E5E7EB] pt-4 mb-4">
          <h2 className="font-bold text-[#1A1F2E] mb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-[#F26430]" />
            Desglose por método
          </h2>
          {summary.by_payment_method.length === 0 ? (
            <p className="text-sm text-[#4A5260] text-center py-4">Sin ventas hoy</p>
          ) : (
            <div className="space-y-2">
              {summary.by_payment_method.map((m) => (
                <div
                  key={m.payment_method}
                  className="flex justify-between items-center bg-[#F9FAFB] rounded-md p-3"
                >
                  <span className="font-medium text-[#1A1F2E]">
                    {PAYMENT_LABELS[m.payment_method] || m.payment_method}
                  </span>
                  <div className="text-right">
                    <p className="font-bold text-[#1A1F2E]">S/ {Number(m.total).toFixed(2)}</p>
                    <p className="text-xs text-[#4A5260]">
                      {m.count} pedido{m.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="border-t border-[#E5E7EB] pt-4">
          <h2 className="font-bold text-[#1A1F2E] mb-3 flex items-center gap-2">
            <Award size={16} className="text-[#F26430]" />
            Top 3 productos
          </h2>
          {summary.top_products.length === 0 ? (
            <p className="text-sm text-[#4A5260] text-center py-4">Sin ventas hoy</p>
          ) : (
            <div className="space-y-2">
              {summary.top_products.map((p, idx) => (
                <div key={p.product_id} className="flex items-center gap-3 bg-[#F9FAFB] rounded-md p-3">
                  <div className="w-8 h-8 bg-[#F26430] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A1F2E] truncate">{p.product_name}</p>
                    <p className="text-xs text-[#4A5260]">{p.total_sold} unidades vendidas</p>
                  </div>
                  <p className="font-bold text-[#F26430] shrink-0">S/ {Number(p.revenue).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
