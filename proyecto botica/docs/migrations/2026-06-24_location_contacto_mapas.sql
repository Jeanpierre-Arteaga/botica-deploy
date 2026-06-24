-- ============================================================
-- MIGRACIÓN: contacto + mapas por sede (tabla location)
-- Fecha: 2026-06-24
-- ------------------------------------------------------------
-- Idempotente: se puede correr varias veces sin romper nada.
-- Aplica sobre una BD que YA tiene la tabla `location` poblada
-- con las 2 sedes (Ate, Santa Anita).
--
-- Ejecutar:
--   psql -U postgres -d botica -f "docs/migrations/2026-06-24_location_contacto_mapas.sql"
--
-- Razón social: BOTICAS CENTRAL MOREL S.A.C. · RUC 20614687259
-- Tel/WhatsApp y email son compartidos por ambas sedes.
-- ============================================================

BEGIN;

-- 1) Columnas nuevas (no falla si ya existen) -----------------
ALTER TABLE location ADD COLUMN IF NOT EXISTS location_email VARCHAR(255);
ALTER TABLE location ADD COLUMN IF NOT EXISTS schedule       VARCHAR(255);
ALTER TABLE location ADD COLUMN IF NOT EXISTS maps_query     TEXT;
ALTER TABLE location ADD COLUMN IF NOT EXISTS latitude       NUMERIC(10,7);
ALTER TABLE location ADD COLUMN IF NOT EXISTS longitude      NUMERIC(10,7);

-- 2) Datos reales por sede ------------------------------------
-- Se actualiza por `district` (estable) en lugar de location_id.

-- SEDE ATE
UPDATE location SET
  location_address = 'Av. Metropolitana N.° 517, Lote 23, Urb. Ceres Etapa 2, Mz. G1, Ate, Lima',
  location_phone   = '998113090',
  location_email   = 'bmboticascentral@gmail.com',
  schedule         = 'Lun a Vie: 7:00 a.m. – 12:00 a.m. (medianoche)',
  maps_query       = 'Av. Metropolitana 517, Ceres, Ate, Lima, Perú'
WHERE district = 'Ate';

-- SEDE SANTA ANITA
UPDATE location SET
  location_address = 'Av. Universitaria N.° 416, Urb. Universal 2da Etapa, Santa Anita, Lima',
  location_phone   = '998113090',
  location_email   = 'bmboticascentral@gmail.com',
  schedule         = 'Lun a Vie: 7:00 a.m. – 12:00 a.m. (medianoche)',
  maps_query       = 'Av. Universitaria 416, Santa Anita, Lima, Perú'
WHERE district = 'Santa Anita';

COMMIT;

-- ------------------------------------------------------------
-- PENDIENTE (completar cuando se confirme):
--   * Horario de sábado y domingo. Si atienden, ampliar `schedule`, p.ej.:
--       'Lun a Vie: 7:00 a.m. – 12:00 a.m. · Sáb y Dom: 8:00 a.m. – 8:00 p.m.'
--     Si NO atienden fin de semana:
--       'Lun a Vie: 7:00 a.m. – 12:00 a.m. · Sáb y Dom: Cerrado'
--   * latitude/longitude (opcional, para pin con Leaflet en el futuro).
-- ------------------------------------------------------------
