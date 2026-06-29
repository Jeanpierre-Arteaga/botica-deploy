-- ============================================================
-- 2026-06-29 · Login: bloqueo por intentos fallidos
-- ============================================================
-- Lleva la cuenta de intentos fallidos por usuario y bloquea temporalmente la
-- cuenta al llegar al límite (3). `failed_attempts` se incrementa con cada
-- contraseña incorrecta y se reinicia a 0 al ingresar bien; `locked_until`
-- marca hasta cuándo está bloqueada (NULL = no bloqueada). authController.login
-- los gestiona. Additivo y seguro.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until    TIMESTAMP NULL;
