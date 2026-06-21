import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { AlertCircle, LayoutDashboard, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import {
  AuthLayout,
  AuthField,
  AuthSubmit,
  authInputClass,
} from '../components/AuthLayout';

export function AdminLogin() {
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
      await loginStaff(userCode.trim().toUpperCase(), password, 'admin');
      toast.success('¡Bienvenido!');
      navigate('/admin/dashboard', { replace: true });
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
      tone="admin"
      badge="Panel administrativo"
      brandHeadline={
        <>
          Controla toda tu botica
          <br />
          desde un solo panel
        </>
      }
      brandSubtext="Gestiona el catálogo, el stock entre sedes, los pedidos web y a tu equipo. Reportes de ventas y rotación en tiempo real."
      trust={[
        { icon: LayoutDashboard, text: 'Dashboard con ventas y alertas de stock' },
        { icon: BarChart3, text: 'Reportes de ventas y rotación' },
        { icon: ShieldCheck, text: 'Acceso restringido a administradores' },
      ]}
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
