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

export function StaffLogin() {
  const { loginStaff, isLoading } = useAuth();
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userCode.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    try {
      await loginStaff(userCode.trim().toUpperCase(), password, 'emp');
      toast.success('¡Bienvenido!');
      navigate('/staff/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Código o contraseña incorrectos.');
        } else if (err.status === 403) {
          setError(err.message);
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
      tone="staff"
      brandLine={
        <>
          Tu sede, tu turno,
          <br />
          todo en un panel.
        </>
      }
      title="Acceso Personal"
      subtitle="Ingresa con tu código de trabajador"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label="Código de usuario" htmlFor="userCode">
          <input
            id="userCode"
            type="text"
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            className={authInputClass}
            placeholder="TRAB01"
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

        {error && (
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
        )}

        <AuthSubmit disabled={isLoading} loading={isLoading}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </AuthSubmit>
      </form>
    </AuthLayout>
  );
}
