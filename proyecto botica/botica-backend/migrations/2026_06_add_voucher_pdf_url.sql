-- Comprobante interno (PDF) asociado al pago de un pedido.
-- Idempotente: se puede correr varias veces sin error.
ALTER TABLE payment ADD COLUMN IF NOT EXISTS voucher_pdf_url VARCHAR(500);
