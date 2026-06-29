-- Foto de perfil del cliente (URL pública de CloudFront para fotos subidas
-- a S3, o ruta local "/avatars/..." para un avatar predefinido).
-- Idempotente: se puede correr varias veces sin error.
ALTER TABLE customer ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
