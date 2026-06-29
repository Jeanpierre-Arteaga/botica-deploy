-- ============================================================
-- 2026-06-29 · Usuarios: foto de perfil (rostro)
-- ============================================================
-- Guarda la URL pública (CloudFront) de la foto de perfil del usuario de
-- personal. La sube el propio usuario desde el modal de perfil del sidebar
-- (POST /api/users/me/photo → S3, prefijo 'avatars'). NULL = sin foto → la UI
-- muestra el avatar de iniciales. Additiva y segura.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photo_url TEXT;
