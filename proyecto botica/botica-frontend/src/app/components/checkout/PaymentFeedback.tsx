// ============================================================
// PaymentFeedback — retroalimentación post-pago del CLIENTE
// ============================================================
// Reutiliza el lenguaje visual del modal de éxito del panel staff
// (anillo de check, badge de pedido, filas de resumen, total en
// naranja) adaptado al cliente. El TÍTULO es UNIFICADO para todos los
// métodos ("¡Pedido registrado!"); que la tarjeta se aprobó se muestra
// como dato SECUNDARIO (badge verde "Pago aprobado" en el resumen).
//
//  - ProcessingOverlay   → overlay de carga ("Procesando tu pago…")
//  - PaymentSuccessModal → éxito. TARJETA: comprobante YA disponible
//      (se generó durante el "Procesando…"), el botón solo lo ABRE —
//      sin una segunda animación. MANUAL: pendiente de validación del
//      staff, SIN comprobante.
//  - PaymentErrorModal   → error claro con opción de reintentar.
//
// IMPORTANTE (posición): todos los cuadros se renderizan con PORTAL al
// <body>, position:fixed cubriendo el viewport y z-index por ENCIMA del
// header sticky (z-1100). Se bloquea el scroll del body mientras están
// abiertos y, si el contenido es alto, el modal hace scroll interno.
//
// Accesibilidad: role/aria-modal, cierre con Escape (salvo durante la
// carga), foco inicial en la acción primaria (sin saltar el scroll).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Receipt,
  Download,
  Package,
  ShoppingBag,
  Clock,
  XCircle,
  RotateCcw,
  X,
  BadgeCheck,
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
// Shell de modal centrado (portal + backdrop + Escape + foco)
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

  // Cierre con Escape (salvo durante la carga).
  useEffect(() => {
    if (!dismissable || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissable, onClose]);

  // Bloquear el scroll del body mientras el modal está abierto.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Foco inicial dentro del modal (acción primaria) SIN mover el scroll.
  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    const target =
      node.querySelector<HTMLElement>('[data-autofocus]') ||
      node.querySelector<HTMLElement>('button, a[href]');
    target?.focus({ preventScroll: true });
  }, []);

  // Portal al <body>: escapa del header sticky / contenedores con transform
  // y queda SIEMPRE fijo y centrado en el viewport, sin importar el scroll.
  return createPortal(
    <div
      className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      onClick={dismissable ? onClose : undefined}
    >
      <div
        ref={panelRef}
        className="bg-surface rounded-2xl shadow-pop max-w-sm w-full p-6 text-center animate-fade-in-up my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role={busy ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-busy={busy || undefined}
        aria-label={label}
      >
        {children}
      </div>
    </div>,
    document.body
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
  children,
}: {
  label: string;
  value?: string;
  capitalize?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center gap-3 text-sm px-4 py-2.5">
      <span className="text-muted shrink-0">{label}</span>
      {children ?? (
        <span className={`text-right font-medium text-text truncate ${capitalize ? 'capitalize' : ''}`}>
          {value}
        </span>
      )}
    </div>
  );
}

function OrderSummaryCard({
  order,
  method,
  itemCount,
  voucherType,
  paymentApproved,
}: {
  order: Order;
  method: PaymentMethod;
  itemCount: number;
  voucherType: VoucherType;
  /** Solo tarjeta: el cargo fue aprobado → se muestra como dato secundario. */
  paymentApproved?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line overflow-hidden text-left mb-5">
      <div className="divide-y divide-line-2">
        <SummaryRow label="Productos" value={`${itemCount} ${itemCount === 1 ? 'ítem' : 'ítems'}`} />
        <SummaryRow label="Método" value={PAYMENT_LABELS[method]} />
        <SummaryRow label="Comprobante" value={voucherType} capitalize />
        {paymentApproved && (
          <SummaryRow label="Estado de pago">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success-soft border border-success/30 rounded-full px-2.5 py-1">
              <BadgeCheck size={13} /> Pago aprobado
            </span>
          </SummaryRow>
        )}
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
  voucherUrl,
  onGoToOrder,
  onKeepShopping,
  onClose,
}: {
  order: Order;
  method: PaymentMethod;
  itemCount: number;
  /** Tarjeta: URL del comprobante YA generado durante el "Procesando…". */
  voucherUrl: string | null;
  onGoToOrder: () => void;
  onKeepShopping: () => void;
  onClose: () => void;
}) {
  const voucherType = (order.payment?.voucher_type as VoucherType) || 'boleta';
  const isCard = method === 'tarjeta';

  // Plan B: si por alguna razón el comprobante no llegó pre-generado, el
  // botón lo pide en el momento (spinner EN el botón, NO una segunda
  // pantalla de carga). En el flujo normal `voucherUrl` ya viene listo.
  const [url, setUrl] = useState<string | null>(voucherUrl);
  const [opening, setOpening] = useState(false);

  async function openVoucher() {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    setOpening(true);
    try {
      const res = await api.orders.getVoucher(order.order_id);
      setUrl(res.voucher_pdf_url);
      window.open(res.voucher_pdf_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.body as { message?: string })?.message || err.message
          : 'No se pudo abrir el comprobante';
      toast.error(msg);
    } finally {
      setOpening(false);
    }
  }

  return (
    <ModalShell label="Pedido registrado" onClose={onClose}>
      <SuccessCheck />

      {/* Título UNIFICADO para TODOS los métodos (incluida tarjeta). */}
      <h2 className="text-xl font-bold text-text">¡Pedido registrado!</h2>
      <p className="text-sm text-muted mt-1">
        {isCard
          ? 'Tu pago fue aprobado y ya estamos preparando tu pedido.'
          : 'Hemos recibido tu pedido correctamente.'}
      </p>

      <OrderBadge orderId={order.order_id} />

      <OrderSummaryCard
        order={order}
        method={method}
        itemCount={itemCount}
        voucherType={voucherType}
        paymentApproved={isCard}
      />

      {isCard ? (
        // --- TARJETA: comprobante disponible, el botón solo lo abre ---
        <div className="space-y-2.5">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              data-autofocus
              className="inline-flex w-full items-center justify-center gap-2 h-12 px-6 rounded-xl bg-brand text-white font-semibold text-base shadow-soft hover:bg-brand-hover active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <Download size={18} /> Ver / Descargar comprobante
            </a>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              iconLeft={Download}
              loading={opening}
              data-autofocus
              onClick={openVoucher}
            >
              Ver / Descargar comprobante
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" iconLeft={Package} onClick={onGoToOrder}>
              Mis pedidos
            </Button>
            <Button variant="secondary" iconLeft={ShoppingBag} onClick={onKeepShopping}>
              Seguir comprando
            </Button>
          </div>
        </div>
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
            <Button variant="secondary" fullWidth iconLeft={ShoppingBag} onClick={onKeepShopping}>
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
