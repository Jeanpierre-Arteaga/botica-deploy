-- ============================================================
-- MIGRACIÓN: coordenadas (latitude/longitude) por sede
-- Fecha: 2026-06-24
-- ------------------------------------------------------------
-- Idempotente: se puede correr varias veces sin romper nada.
-- Completa el "PENDIENTE" de 2026-06-24_location_contacto_mapas.sql
-- (las columnas latitude/longitude ya existen pero estaban NULL,
--  por eso el mapa caía al respaldo gris "Ver en Google Maps").
--
-- Con coordenadas reales, el componente <StoreMap> (Leaflet)
-- renderiza el mapa interactivo con el pin de marca.
--
-- Ejecutar:
--   psql -U postgres -d botica -f "docs/migrations/2026-06-24_location_coords.sql"
--
-- Las columnas latitude/longitude son NUMERIC(10,7). Si por alguna
-- razón no existieran, este ALTER las crea (no rompe si ya están).
-- ============================================================

BEGIN;

ALTER TABLE location ADD COLUMN IF NOT EXISTS latitude  NUMERIC(10,7);
ALTER TABLE location ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

-- SEDE ATE — Av. Metropolitana 517, Ceres, Ate, Lima
UPDATE location SET
  latitude  = -12.0265000,
  longitude = -76.9192000
WHERE district = 'Ate';

-- SEDE SANTA ANITA — Av. Universitaria 416, Santa Anita, Lima
UPDATE location SET
  latitude  = -12.0438000,
  longitude = -76.9722000
WHERE district = 'Santa Anita';

COMMIT;

-- Verificación rápida (opcional):
--   SELECT location_id, location_name, district, latitude, longitude FROM location ORDER BY location_id;
