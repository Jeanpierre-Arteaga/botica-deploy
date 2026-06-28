// ============================================================
// orderStatus — reglas de "pago confirmado" (cliente)
// ============================================================
// Fuente única de verdad para decidir si un pedido ya tiene el
// pago confirmado/validado y, por tanto, si el comprobante puede
// mostrarse/descargarse al CLIENTE.
//
// Alineado con el backend (orderController):
//  - tarjeta:       el cargo se captura con MercadoPago al crear el
//                   pedido (estado 'en proceso'). Confirmado salvo
//                   que esté 'pendiente' o 'cancelado'.
//  - efectivo:      se cobra al entregar → confirmado SOLO 'entregado'.
//  - yape/plin/
//    transferencia: el staff valida el pago manual moviendo el pedido
//                   a 'en proceso' (o 'entregado').
//
// El mismo criterio se replica como guardia defensiva en el backend
// (GET /api/orders/:id/voucher) para no exponer comprobantes de
// pedidos no pagados aunque se llame al endpoint directamente.
// ============================================================

import type { Order, PaymentMethod } from './types';

type OrderLike = Pick<Order, 'order_state' | 'payment'>;

/**
 * ¿El pago del pedido ya está confirmado/validado y el comprobante
 * puede mostrarse al cliente?
 */
export function isPaymentConfirmed(order: OrderLike): boolean {
  const payment = order.payment;
  if (!payment) return false;

  const state = order.order_state;
  if (state === 'cancelado') return false;

  const method: PaymentMethod = payment.payment_method;

  if (method === 'tarjeta') {
    // Pago aprobado por MercadoPago al crear el pedido.
    return state !== 'pendiente';
  }

  if (method === 'efectivo') {
    // Contra entrega: el dinero se recibe al entregar.
    return state === 'entregado';
  }

  // yape / plin / transferencia → validación manual del staff.
  return state === 'en proceso' || state === 'entregado';
}

/**
 * Texto explicativo de por qué el comprobante aún no está disponible
 * (para mostrar al cliente cuando el pago no está confirmado).
 */
export function pendingVoucherNote(method?: PaymentMethod | null): string {
  if (method === 'efectivo') {
    return 'Tu comprobante estará disponible cuando recibas y pagues tu pedido.';
  }
  return 'Tu comprobante estará disponible cuando el staff valide tu pago.';
}
