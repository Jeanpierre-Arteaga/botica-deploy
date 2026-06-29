-- ============================================================
-- 2026-06-28 · Control de Stock: fecha de última reposición
-- ============================================================
-- Añade a inventory la columna `last_restock` para registrar CUÁNDO se
-- repuso por última vez un producto en una sede concreta. La actualiza el
-- endpoint POST /api/inventory/restock (NOW(), zona America/Lima por la
-- sesión de la BD). NULL = sin reposición registrada todavía.
--
-- Es additiva y segura: no toca datos existentes ni rompe el
-- UNIQUE(product_id, location_id).
-- ============================================================

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS last_restock TIMESTAMP;
