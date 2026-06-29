-- ============================================================
-- 2026-06-28 · Usuarios: fecha de último acceso
-- ============================================================
-- Registra CUÁNDO ingresó por última vez cada usuario de personal. La
-- actualiza authController.login (NOW(), zona America/Lima por la sesión de la
-- BD) tras validar la contraseña. NULL = nunca ha iniciado sesión. La consume
-- la columna "Último acceso" de Gestión de Usuarios. Additiva y segura.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
