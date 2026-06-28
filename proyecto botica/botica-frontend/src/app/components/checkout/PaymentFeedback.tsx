// ============================================================
// PaymentFeedback — retroalimentación post-pago del CLIENTE
// ============================================================
// Reutiliza el lenguaje visual del modal de éxito del panel staff
// (anillo de check, badge de pedido, filas de resumen, total en
// naranja) adaptado al cliente y DIFERENCIADO por tipo de pago:
//
//  - ProcessingOverlay   → overlay de carga ("Procesando tu pago…")
//  - PaymentSuccessModal → éxito. Variante TARJETA (pago confirmado,
//      ofrece generar/descargar comprobante) vs. MANUAL (pedido
//      registrado, pendiente de validación, SIN comprobante).
//  - PaymentErrorModal   → error claro con opción de reintentar.
//
// Accesibilidad: role/aria-modal, cierre con Escape (salvo durante
// la carga), foco inicial en la acción primaria.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Receipt,
  FileText,
  Download,
  Package,
  ShoppingBag,
  Clock,
  XCircle,
  RotateCcw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../lib/api';
import { pendingVoucherNote } from '../../lib/orderStatus';
import type { Order, PaymentMethod, VoucherType } from '../../lib/types';
import { Button } from '../ui/Button';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
};

// ============================================================
// Shell de modal centrado (backdrop + Escape + foco)
// ============================================================

function ModalShell({
  children,
  onClose,
  label,
  dismissable = true,
  busy = false,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  label: string;
  dismissable?: boolean;
  busy?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dismissable || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissable, onClose]);

  useEffect(() => {
    // Foco inicial dentro del modal (acción primaria si existe).
    const node = panelRef.current;
    if (!node) return;
    const target =
      node.querySelector<HTMLElement>('[data-autofocus]') ||
      node.querySelector<HTMLElement>('button, a[href]');
    target?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={dismissable ? onClose : undefined}
    >
      <div
        ref={panelRef}
        className="bg-surface rounded-2xl shadow-pop max-w-sm w-full p-6 text-center animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        role={busy ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-busy={busy || undefined}
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}

// Anillo de check de éxito (idéntico al patrón del staff)
function SuccessCheck() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-4">
      <span className="absolute inset-0 rounded-full bg-success-soft" />
      <span className="absolute inset-[7px] rounded-full border-2 border-success/25" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-12 h-12 rounded-full bg-success flex items-center justify-center shadow-soft">
          <Check size={26} strokeWidth={3} className="text-white" />
        </span>
      </span>
    </div>
  );
}

function OrderBadge({ orderId }: { orderId: number }) {
  return (
    <div className="mt-1.5 mb-5 flex justify-center">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted bg-surface-2 border border-line rounded-full px-3 py-1">
        <Receipt size={13} /> Pedido #{orderId}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 text-sm px-4 py-2.5">
      <span className="text-muted shrink-0">{label}</span>
      <span className={`text-right font-medium text-text truncate ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function OrderSummaryCard({
  order,
  method,
  itemCount,
  voucherType,
}: {
  order: Order;
  method: PaymentMethod;
  itemCount: number;
  voucherType: VoucherType;
}) {
  return (
    <div className="rounded-xl border border-line overflow-hidden text-left mb-5">
      <div className="divide-y divide-line-2">
        <SummaryRow label="Productos" value={`${itemCount} ${itemCount === 1 ? 'ítem' : 'ítems'}`} />
        <SummaryRow label="Método" value={PAYMENT_LABELS[method]} />
        <SummaryRow label="Comprobante" value={voucherType} capitalize />
      </div>
      <div className="flex items-center justify-between bg-surface-2 border-t border-line px-4 py-3">
        <span className="font-semibold text-text">Total</span>
        <span className="text-xl font-bold text-brand tabular-nums">
          S/ {Number(order.total_price).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Overlay de carga
// ============================================================

export function ProcessingOverlay({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <ModalShell label={title} dismissable={false} busy>
      <div className="py-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-soft flex items-center justify-center">
          <div className="w-9 h-9 border-[3px] border-brand border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-lg font-bold text-text">{title}</p>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
    </ModalShell>
  );
}

// ============================================================
// Modal de ÉXITO (tarjeta vs. manual)
// ============================================================

export function PaymentSuccessModal({
  order,
  method,
  itemCount,
  onGoToOrder,
  onKeepShopping,
  onClose,
}: {
  order: Order;
  method: PaymentMethod;
  itemCount: number;
  onGoToOrder: () => void;
  onKeepShopping: () => void;
  onClose: () => void;
}) {
  const voucherType = (order.payment?.voucher_type as VoucherType) || 'boleta';
  const isCard = method === 'tarjeta';

  // Generación del comprobante (solo tarjeta): mismo patrón del staff
  // ("Generando boleta…" con animación mínima de ~3 s) → ver/descargar.
  const [phase, setPhase] = useState<'idle' | 'generating' | 'ready'>('idle');
  const [voucherUrl, setVoucherUrl] = useState<string | null>(
    order.payment?.voucher_pdf_url || null
  );

  async function handleGenerate() {
    setPhase('generating');
    try {
      const [, res] = await Promise.all([
        new Promise((r) => setTimeout(r, 3000)),
        api.orders.getVoucher(order.order_id),
      ]);
      setVoucherUrl(res.voucher_pdf_url);
      setPhase('ready');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.body as { message?: string })?.message || err.message
          : 'Error al generar el comprobante';
      toast.error(msg);
      setPhase('idle');
    }
  }

  // Mientras se genera la boleta: pantalla de carga dedicada y no cerrable.
  if (phase === 'generating') {
    return (
      <ModalShell label={`Generando ${voucherType}`} dismissable={false} busy>
        <div className="py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-soft flex items-center justify-center">
            <div className="w-9 h-9 border-[3px] border-brand border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-lg font-bold text-text capitalize">Generando {voucherType}…</p>
          <p className="text-sm text-muted mt-1">Preparando tu comprobante en PDF</p>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell label={isCard ? 'Pago realizado' : 'Pedido registrado'} onClose={onClose}>
      <SuccessCheck />

      <h2 className="text-xl font-bold text-text">
        {isCard ? '¡Pago realizado!' : '¡Pedido registrado!'}
      </h2>
      <p className="text-sm text-muted mt-1">
        {isCard
          ? 'Tu pedido fue confirmado y ya lo estamos preparando.'
          : 'Hemos recibido tu pedido correctamente.'}
      </p>

      <OrderBadge orderId={order.order_id} />

      <OrderSummaryCard
        order={order}
        method={method}
        itemCount={itemCount}
        voucherType={voucherType}
      />

      {isCard ? (
        // --- TARJETA: comprobante disponible ---
        phase === 'ready' && voucherUrl ? (
          <div className="space-y-2">
            <a
              href={voucherUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-autofocus
              className="inline-flex w-full items-center justify-center gap-2 h-12 px-6 rounded-xl bg-brand text-white font-semibold shadow-soft hover:bg-brand-hover active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <Download size={18} /> Ver / Descargar comprobante
            </a>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth iconLeft={Package} onClick={onGoToOrder}>
                Mis pedidos
              </Button>
              <Button variant="ghost" fullWidth iconLeft={ShoppingBag} onClick={onKeepShopping}>
                Seguir comprando
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              iconLeft={FileText}
              data-autofocus
              onClick={handleGenerate}
            >
              Ver / Descargar comprobante
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth iconLeft={Package} onClick={onGoToOrder}>
                Mis pedidos
              </Button>
              <Button variant="ghost" fullWidth iconLeft={ShoppingBag} onClick={onKeepShopping}>
                Seguir comprando
              </Button>
            </div>
          </div>
        )
      ) : (
        // --- MANUAL: pendiente de validación, SIN comprobante ---
        <div className="space-y-4">
          <div className="rounded-xl border border-warning/40 bg-warning-soft p-3.5 text-left flex items-start gap-2.5">
            <Clock size={18} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-text">
                {method === 'efectivo'
                  ? 'Pago contra entrega'
                  : 'Pago pendiente de validación'}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {method === 'efectivo'
                  ? 'Pagarás en efectivo al recibir tu pedido. Lo procesaremos de inmediato.'
                  : 'Tu pedido quedó pendiente. Lo procesaremos cuando el staff confirme tu pago.'}
              </p>
              <p className="text-xs text-muted mt-1.5">{pendingVoucherNote(method)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              iconLeft={Package}
              data-autofocus
              onClick={onGoToOrder}
            >
              Ir a Mis pedidos
            </Button>
            <Button variant="ghost" fullWidth iconLeft={ShoppingBag} onClick={onKeepShopping}>
              Seguir comprando
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ============================================================
// Modal de ERROR
// ============================================================

export function PaymentErrorModal({
  title,
  message,
  canRetry,
  onRetry,
  onClose,
}: {
  title: string;
  message: string;
  canRetry: boolean;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell label={title} onClose={onClose}>
      <div className="relative w-20 h-20 mx-auto mb-4">
        <span className="absolute inset-0 rounded-full bg-error-soft" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-12 h-12 rounded-full bg-error flex items-center justify-center shadow-soft">
            <XCircle size={26} strokeWidth={2.5} className="text-white" />
          </span>
        </span>
      </div>

      <h2 className="text-xl font-bold text-text">{title}</h2>
      <p className="text-sm text-muted mt-1.5 mb-5">{message}</p>

      <div className="space-y-2">
        {canRetry && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            iconLeft={RotateCcw}
            data-autofocus
            onClick={onRetry}
          >
            Reintentar
          </Button>
        )}
        <Button
          variant={canRetry ? 'ghost' : 'primary'}
          fullWidth
          iconLeft={X}
          data-autofocus={!canRetry || undefined}
          onClick={onClose}
        >
          {canRetry ? 'Cerrar' : 'Volver al checkout'}
        </Button>
      </div>
    </ModalShell>
  );
}
