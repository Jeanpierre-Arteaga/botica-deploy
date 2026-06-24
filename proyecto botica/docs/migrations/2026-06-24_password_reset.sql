-- ============================================================
-- Migración: tabla password_reset (recuperación de contraseña CLIENTE)
-- Fecha: 2026-06-24
-- ============================================================
-- Soporta el flujo "¿Olvidaste tu contraseña?" del login de cliente.
-- Guardamos SOLO el hash (sha256) del token de reseteo, nunca el
-- token en claro. Cada token tiene expiración (1h) y se marca como
-- usado tras un reseteo exitoso.
--
-- Ejecutar en pgAdmin sobre la BD `botica`. Es idempotente.
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset (
    reset_id    SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
    token_hash  CHAR(64) NOT NULL,            -- sha256 del token en hex (64 chars)
    expires_at  TIMESTAMP NOT NULL,
    used_at     TIMESTAMP,                    -- NULL = aún válido / no usado
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Búsqueda por hash al validar / resetear
CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash
    ON password_reset (token_hash);

-- Invalidación / limpieza por customer
CREATE INDEX IF NOT EXISTS idx_password_reset_customer
    ON password_reset (customer_id);
