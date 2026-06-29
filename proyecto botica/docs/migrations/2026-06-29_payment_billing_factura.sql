-- ============================================================
-- 2026-06-29 · Datos fiscales del cliente para comprobante "Factura"
-- ============================================================
-- Cuando el cliente elige "Factura" en el checkout debe indicar el RUC y la
-- Razón social de la empresa. Se guardan en la tabla payment (1:1 con el
-- pedido). Para Boleta/Ticket quedan NULL.
--
--   billing_ruc  → RUC de 11 dígitos (validado en front y backend: longitud,
--                  prefijo 10/15/16/17/20 y dígito verificador módulo 11).
--   billing_name → Razón social (texto libre, lo escribe el cliente).
--
-- Idempotente (IF NOT EXISTS) y backward-compatible: NULL para pagos previos
-- y para comprobantes que no sean factura.
-- ============================================================

ALTER TABLE payment ADD COLUMN IF NOT EXISTS billing_ruc  VARCHAR(11);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS billing_name VARCHAR(200);
