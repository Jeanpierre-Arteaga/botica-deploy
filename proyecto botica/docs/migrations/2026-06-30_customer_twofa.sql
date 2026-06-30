-- ============================================================
-- Migración: 2FA por correo para el CLIENTE (tabla customer)
-- Fecha: 2026-06-30
-- ============================================================
-- Añade a `customer` las mismas columnas de verificación en dos pasos que ya
-- tiene `users`, para exigir un código de 6 dígitos tras validar correo+
-- contraseña (evita que alguien inicie sesión con un correo ajeno sin acceso a
-- ese buzón). El login con Google NO usa 2FA (Google ya verificó el correo).
--
-- Idempotente y retro-compatible: ADD COLUMN IF NOT EXISTS; las filas existentes
-- quedan con twofa_attempts=0 y el resto NULL (sin código pendiente).
-- ============================================================

ALTER TABLE public.customer ADD COLUMN IF NOT EXISTS twofa_code_hash character varying(64);
ALTER TABLE public.customer ADD COLUMN IF NOT EXISTS twofa_expires_at timestamp without time zone;
ALTER TABLE public.customer ADD COLUMN IF NOT EXISTS twofa_attempts integer DEFAULT 0 NOT NULL;
ALTER TABLE public.customer ADD COLUMN IF NOT EXISTS twofa_sent_at timestamp without time zone;
