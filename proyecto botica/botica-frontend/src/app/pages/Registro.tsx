// ============================================================
// Registro — Página de registro de customer nuevo
// ============================================================
// Usa api.auth.registerCustomer (que hace auto-login).
// Después de registro exitoso, redirige a la home con sesión activa.
// ============================================================

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';

export function Registro() {
  const { registerCustomer, isLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    customer_password: '',
    confirm_password: '',
    dni: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      newErrors.full_name = 'El nombre es obligatorio.';
    }
    if (!form.email.trim()) {
      newErrors.email = 'El email es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email inválido.';
    }
    if (!form.customer_password) {
      newErrors.customer_password = 'La contraseña es obligatoria.';
    } else if (form.customer_password.length < 6) {
      newErrors.customer_password = 'Mínimo 6 caracteres.';
    }
    if (form.customer_password !== form.confirm_password) {
      newErrors.confirm_password = 'Las contraseñas no coinciden.';
    }
    if (form.dni && !/^\d{8}$/.test(form.dni)) {
      newErrors.dni = 'El DNI debe tener 8 dígitos.';
    }
    if (form.phone && !/^\d{9}$/.test(form.phone)) {
      newErrors.phone = 'El teléfono debe tener 9 dígitos.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await registerCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        customer_password: form.customer_password,
        dni: form.dni || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      toast.success('¡Cuenta creada! Bienvenido a Botica Central.');
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors({ email: 'Este email ya está registrado.' });
          toast.error('El email ya está en uso.');
        } else {
          toast.error(err.message || 'Error al registrar.');
        }
      } else {
        toast.error('Error al registrar. Inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF4EE] to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#1A1F2E]">Crear cuenta</h1>
            <p className="text-sm text-[#4A5260] mt-2">
              Regístrate para comprar en Botica Central
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                Nombre completo <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F26430]"
                placeholder="Tu nombre completo"
              />
              {errors.full_name && (
                <p className="text-xs text-[#DC2626] mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                Email <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F26430]"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="text-xs text-[#DC2626] mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                Contraseña <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="password"
                value={form.customer_password}
                onChange={(e) =>
                  setForm({ ...form, customer_password: e.target.value })
                }
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F26430]"
                placeholder="Mínimo 6 caracteres"
              />
              {errors.customer_password && (
                <p className="text-xs text-[#DC2626] mt-1">
                  {errors.customer_password}
                </p>
              )}
            </div>

            {/* Confirmar password */}
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                Confirmar contraseña <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={(e) =>
                  setForm({ ...form, confirm_password: e.target.value })
                }
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F26430]"
              />
              {errors.confirm_password && (
                <p className="text-xs text-[#DC2626] mt-1">
                  {errors.confirm_password}
                </p>
              )}
            </div>

            {/* DNI (opcional) */}
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                DNI <span className="text-[#9CA3AF] text-xs">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.dni}
                onChange={(e) =>
                  setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })
                }
                maxLength={8}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F26430]"
                placeholder="12345678"
              />
              {errors.dni && (
                <p className="text-xs text-[#DC2626] mt-1">{errors.dni}</p>
              )}
            </div>

            {/* Teléfono (opcional) */}
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                Teléfono <span className="text-[#9CA3AF] text-xs">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })
                }
                maxLength={9}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F26430]"
                placeholder="987654321"
              />
              {errors.phone && (
                <p className="text-xs text-[#DC2626] mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Dirección (opcional) */}
            <div>
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                Dirección <span className="text-[#9CA3AF] text-xs">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F26430]"
                placeholder="Av. Principal 123"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F26430] hover:bg-[#D94E1F] disabled:opacity-50 text-white font-medium py-2.5 rounded-md transition-colors"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-[#4A5260] mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#F26430] font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
