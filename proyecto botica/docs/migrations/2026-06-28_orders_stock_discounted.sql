-- ============================================================
-- 2026-06-28 · Descuento de stock ligado a "pago confirmado"
-- ============================================================
-- Bandera de idempotencia: marca si un pedido YA descontó su stock del
-- inventario. El stock se descuenta cuando el pago queda CONFIRMADO
-- (tarjeta aprobada → al crear; manual yape/plin/transferencia → al validar
-- el staff; efectivo → al entregar; POS walk-in → al registrar la venta) y se
-- repone si un pedido ya descontado se cancela. La bandera evita doble
-- descuento / doble reposición.
--
-- Backfill seguro: bajo la lógica ANTERIOR, TODOS los pedidos descontaban
-- stock al crearse y las cancelaciones lo reponían. Por lo tanto, hoy el
-- stock está descontado exactamente para los pedidos NO cancelados.
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stock_discounted BOOLEAN NOT NULL DEFAULT false;

-- Estado consistente para los datos existentes.
UPDATE orders SET stock_discounted = (order_state <> 'cancelado');
