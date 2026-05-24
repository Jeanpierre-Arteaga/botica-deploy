import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF4EE] to-white px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#1A1F2E]">Iniciar sesión</h1>
            <p className="text-sm text-[#4A5260] mt-2">
              Accede a tu cuenta de Botica Central
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F26430]"
                placeholder="tu@email.com"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F26430]"
              />
            </div>

            {error && (
              <div className="bg-[#FEE2E2] border border-[#DC2626] text-[#DC2626] text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F26430] hover:bg-[#D94E1F] disabled:opacity-50 text-white font-medium py-2.5 rounded-md transition-colors"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-[#4A5260] mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-[#F26430] font-medium hover:underline">
              Regístrate
            </Link>
          </p>

          <div className="text-center mt-4">
            <Link to="/" className="text-xs text-[#4A5260] hover:text-[#F26430]">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
