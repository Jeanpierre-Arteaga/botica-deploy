import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import {
  AuthLayout,
  AuthField,
  AuthSubmit,
  authInputClass,
} from '../components/AuthLayout';
import { LockoutNotice } from '../components/LockoutNotice';

export function AdminLogin() {
  const { loginStaff, isLoading } = useAuth();
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState<number | undefined>(undefined);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLocked(false);

    if (!userCode.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    try {
      await loginStaff(userCode.trim().toUpperCase(), password, 'admin');
      toast.success('¡Bienvenido!');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { locked?: boolean; retry_after_seconds?: number; attempts_left?: number } | undefined;
        if (err.status === 423 || body?.locked) {
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
    <AuthLayout
      tone="admin"
      brandLine={
        <>
          Toda tu botica,
          <br />
          bajo control.
        </>
      }
      title="Acceso Administrador"
      subtitle="Ingresa con tus credenciales de administrador"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label="Código de usuario" htmlFor="userCode">
          <input
            id="userCode"
            type="text"
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            className={authInputClass}
            placeholder="ADMIN01"
            autoFocus
          />
        </AuthField>

        <AuthField label="Contraseña" htmlFor="password">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            placeholder="••••••••"
          />
        </AuthField>

        {locked ? (
          <LockoutNotice retrySeconds={retrySeconds} />
        ) : error ? (
          <div
            className="flex items-start gap-2.5 rounded-xl border p-3 text-sm"
            style={{
              backgroundColor: 'var(--c-error-soft)',
              borderColor: 'var(--c-error)',
              color: 'var(--c-error)',
            }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <AuthSubmit disabled={isLoading} loading={isLoading}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </AuthSubmit>
      </form>
    </AuthLayout>
  );
}
