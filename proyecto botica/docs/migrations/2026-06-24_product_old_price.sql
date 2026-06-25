-- ============================================================
-- MIGRACIÓN: precio anterior (old_price) para ofertas
-- Fecha: 2026-06-24
-- ------------------------------------------------------------
-- Idempotente: se puede correr varias veces sin romper nada.
--
-- old_price = precio ANTERIOR (el tachado en gris). Es opcional/
-- nullable y debe ser >= 0. La UI solo muestra el tachado cuando
-- el producto está en oferta (is_offer = true) y old_price es NO
-- nulo y MAYOR que product_price.
--
-- Ejecutar:
--   psql -U postgres -d botica -f "docs/migrations/2026-06-24_product_old_price.sql"
-- ============================================================

BEGIN;

ALTER TABLE product
  ADD COLUMN IF NOT EXISTS old_price DECIMAL(10,2)
  CHECK (old_price IS NULL OR old_price >= 0);

COMMIT;

-- ------------------------------------------------------------
-- SEMILLA DE DEMOSTRACIÓN (OPCIONAL — descomentar para probar).
-- Pone un precio anterior ~20% mayor SOLO a los productos que ya
-- están en oferta y aún no tienen old_price. El admin puede luego
-- ajustarlos uno por uno desde el panel.
-- ------------------------------------------------------------
-- UPDATE product
--   SET old_price = ROUND(product_price * 1.20, 2)
--   WHERE is_offer = true
--     AND old_price IS NULL
--     AND product_price > 0;
