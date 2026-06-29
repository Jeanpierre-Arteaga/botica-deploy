// ============================================================
// StaffLoginForm — formulario de acceso de PERSONAL (admin y staff)
// ============================================================
// Lógica de login compartida por AdminLogin y StaffLogin para que ambas sean
// coherentes: campo código, contraseña con ojo (mostrar/ocultar), enlace
// "¿olvidaste tu contraseña?" (contactar al admin) y avisos de error/bloqueo.
//
// Sin saltos de fondo: la imagen del AuthLayout es absoluta (no depende del
// alto de la tarjeta) y la tarjeta queda centrada, así que el aviso solo hace
// CRECER el recuadro (con animación suave) sin mover el fondo. El área de
// avisos es una región aria-live estable debajo de los campos.
// ============================================================

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import { AuthField, AuthSubmit, authInputClass } from './AuthLayout';
import { PasswordInput } from './PasswordInput';
import { LockoutNotice } from './LockoutNotice';
import { ForgotPasswordNotice } from './ForgotPasswordNotice';

interface StaffLoginFormProps {
  role: 'admin' | 'emp';
  redirectTo: string;
  codePlaceholder: string;
}

export function StaffLoginForm({ role, redirectTo, codePlaceholder }: StaffLoginFormProps) {
  const { loginStaff, isLoading } = useAuth();
  const navigate = useNavigate();
  // El administrador NO tiene bloqueo ni contador ni contacto: él restablece las
  // contraseñas. Puede reintentar las veces que quiera.
  const isAdmin = role === 'admin';
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState<number | undefined>(undefined);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLocked(false);

    if (!userCode.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    try {
      await loginStaff(userCode.trim().toUpperCase(), password, role);
      toast.success('¡Bienvenido!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as
          | { locked?: boolean; retry_after_seconds?: number; attempts_left?: number }
          | undefined;
        // Admin: nunca hay bloqueo ni contador → siempre mensaje simple.
        if (isAdmin) {
          setError(err.status === 401 ? 'Código o contraseña incorrectos.' : err.message);
        } else if (err.status === 423 || body?.locked) {
          setLocked(true);
          setRetrySeconds(body?.retry_after_seconds);
        } else if (err.status === 401) {
          const left = body?.attempts_left;
          setError(
            typeof left === 'number'
              ? `Código o contraseña incorrectos. Te ${left === 1 ? 'queda' : 'quedan'} ${left} intento${left === 1 ? '' : 's'} antes del bloqueo.`
              : 'Código o contraseña incorrectos.',
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('Error al iniciar sesión.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthField label="Código de usuario" htmlFor="userCode">
        <input
          id="userCode"
          type="text"
          value={userCode}
          onChange={(e) => setUserCode(e.target.value)}
          className={authInputClass}
          placeholder={codePlaceholder}
          autoFocus
        />
      </AuthField>

      <div>
        <AuthField label="Contraseña" htmlFor="password">
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputClassName={authInputClass}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </AuthField>
        {/* El admin no contacta a nadie (él restablece): sin enlace de olvido. */}
        {!isAdmin && (
          <div className="mt-1.5 flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgot((v) => !v)}
              aria-expanded={showForgot}
              className="text-xs font-semibold text-muted transition-colors hover:text-brand focus-visible:outline-none focus-visible:text-brand"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}
      </div>

      {/* Área de avisos: región estable (aria-live). Solo crece el recuadro. */}
      <div aria-live="polite" className="space-y-3 empty:hidden">
        {locked ? (
          <LockoutNotice retrySeconds={retrySeconds} />
        ) : (
          error && (
            <div
              className="animate-fade-in-up flex items-start gap-2.5 rounded-xl border p-3 text-sm"
              style={{
                backgroundColor: 'var(--c-error-soft)',
                borderColor: 'var(--c-error)',
                color: 'var(--c-error)',
              }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )
        )}

        {showForgot && !locked && !isAdmin && <ForgotPasswordNotice />}
      </div>

      <AuthSubmit disabled={isLoading} loading={isLoading}>
        {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </AuthSubmit>
    </form>
  );
}
