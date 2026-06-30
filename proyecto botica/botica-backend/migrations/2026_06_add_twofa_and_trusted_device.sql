-- ============================================================
-- 2FA por correo (admin/staff) + dispositivos recordados
-- ------------------------------------------------------------
-- Idempotente: se puede correr varias veces sin error.
--
-- Resumen:
--   1) users.email           → correo de destino del código OTP.
--   2) users.twofa_*         → estado del OTP de verificación en dos pasos
--                              (un OTP activo por usuario, con expiración).
--   3) trusted_device        → "recordar este dispositivo" (token hasheado).
--
-- El destino del código se resuelve en el backend así:
--   users.email  →  si está vacío y user_code ya es un correo, se usa user_code.
-- ============================================================

-- 1) Correo de destino del OTP (y futuros avisos).
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2) Estado del OTP de 2FA (un código activo por usuario).
--    twofa_code_hash : sha256(hex) del código de 6 dígitos (NUNCA el código en claro)
--    twofa_expires_at: expiración del código (10 min)
--    twofa_attempts  : intentos fallidos del código vigente (máx. 5)
--    twofa_sent_at   : marca del último envío (cooldown de reenvío de 60 s)
ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_code_hash  VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_attempts   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_sent_at    TIMESTAMP;

-- 3) Dispositivos recordados ("no volver a pedir el código por 30 días").
--    Guardamos SOLO el hash del token; el token en claro vive en el navegador.
CREATE TABLE IF NOT EXISTS trusted_device (
    device_id    SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash   VARCHAR(64) NOT NULL,          -- sha256(hex) del token de dispositivo
    label        VARCHAR(255),                  -- pista de user-agent (opcional)
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP,
    expires_at   TIMESTAMP NOT NULL
);

CREATE INDEX        IF NOT EXISTS idx_trusted_device_user ON trusted_device(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trusted_device_hash ON trusted_device(token_hash);

-- ------------------------------------------------------------
-- Backfill de correos para los usuarios de DEMO (ADMIN01/TRAB01/TRAB02 usan
-- códigos heredados, no correos). Sin un correo el 2FA no puede enviar el código.
-- CÁMBIALOS por el correo real de cada usuario (o usa el panel de Usuarios).
-- Solo afecta filas que aún no tienen email.
-- ------------------------------------------------------------
UPDATE users
   SET email = 'jeanarteaga.2020@gmail.com'
 WHERE email IS NULL OR email = '';
