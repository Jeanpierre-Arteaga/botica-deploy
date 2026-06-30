-- ============================================================
-- Migración: password_reset soporta también a USERS (personal/admin)
-- Fecha: 2026-06-30
-- ============================================================
-- Hasta ahora password_reset estaba atada solo a `customer` (recuperación de
-- contraseña del cliente). Para habilitar la recuperación de contraseña del
-- PERSONAL/ADMIN (tabla `users`) reutilizando el mismo patrón, añadimos una
-- columna `user_id` y hacemos `customer_id` opcional. Cada token pertenece a
-- EXACTAMENTE uno de los dos (cliente XOR usuario), garantizado por un CHECK.
--
-- Es 100% retro-compatible: las filas existentes (todas con customer_id) siguen
-- siendo válidas y el flujo del cliente NO cambia. Idempotente: se puede
-- ejecutar más de una vez sin error (Supabase / local).
-- ============================================================

-- 1) Nueva columna user_id (FK a users) y customer_id pasa a ser opcional.
ALTER TABLE public.password_reset ADD COLUMN IF NOT EXISTS user_id integer;
ALTER TABLE public.password_reset ALTER COLUMN customer_id DROP NOT NULL;

-- 2) FK de user_id → users(user_id) (idempotente).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_user_id_fkey'
  ) THEN
    ALTER TABLE public.password_reset
      ADD CONSTRAINT password_reset_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Exactamente uno de los dos dueños: customer_id XOR user_id (idempotente).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_owner_chk'
  ) THEN
    ALTER TABLE public.password_reset
      ADD CONSTRAINT password_reset_owner_chk
      CHECK ((customer_id IS NOT NULL) <> (user_id IS NOT NULL));
  END IF;
END $$;

-- 4) Índice para buscar tokens por usuario.
CREATE INDEX IF NOT EXISTS idx_password_reset_user
  ON public.password_reset USING btree (user_id);
