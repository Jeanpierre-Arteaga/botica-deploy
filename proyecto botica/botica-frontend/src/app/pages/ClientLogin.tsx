import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
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

export function ClientLogin() {
  const { loginCustomer, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    try {
      await loginCustomer(email.trim().toLowerCase(), password);
      toast.success('¡Bienvenido!');
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Email o contraseña incorrectos.');
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
      tone="client"
      badge="Tu botica de confianza, ahora online"
      brandHeadline={
        <>
          Tu salud,
          <br />
          a un clic de distancia
        </>
      }
      brandSubtext="Inicia sesión para comprar tus medicamentos, hacer seguimiento a tus pedidos y recibir todo en la puerta de tu casa."
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta de Boticas Central"
      footer={
        <p className="text-center text-sm" style={{ color: 'var(--c-muted)' }}>
          ¿No tienes cuenta?{' '}
          <Link
            to="/registro"
            className="font-semibold hover:underline"
            style={{ color: 'var(--c-brand)' }}
          >
            Regístrate
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            placeholder="tu@email.com"
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
