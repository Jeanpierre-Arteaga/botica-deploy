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
import {
  AuthLayout,
  AuthField,
  AuthSubmit,
  authInputClass,
} from '../components/AuthLayout';

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
    <AuthLayout
      width="wide"
      tone="client"
      badge="Crea tu cuenta gratis"
      brandHeadline={
        <>
          Únete a Boticas Central
          <br />
          y compra en minutos
        </>
      }
      brandSubtext="Crea tu cuenta para comprar medicamentos certificados, guardar tus direcciones y seguir tus pedidos en todo momento."
      title="Crear cuenta"
      subtitle="Regístrate para comprar en Boticas Central"
      footer={
        <p className="text-center text-sm" style={{ color: 'var(--c-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold hover:underline"
            style={{ color: 'var(--c-brand)' }}
          >
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label="Nombre completo" htmlFor="full_name" required error={errors.full_name}>
          <input
            id="full_name"
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={authInputClass}
            placeholder="Tu nombre completo"
          />
        </AuthField>

        <AuthField label="Email" htmlFor="email" required error={errors.email}>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={authInputClass}
            placeholder="tu@email.com"
          />
        </AuthField>

        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            label="Contraseña"
            htmlFor="password"
            required
            error={errors.customer_password}
          >
            <input
              id="password"
              type="password"
              value={form.customer_password}
              onChange={(e) =>
                setForm({ ...form, customer_password: e.target.value })
              }
              className={authInputClass}
              placeholder="Mínimo 6 caracteres"
            />
          </AuthField>

          <AuthField
            label="Confirmar contraseña"
            htmlFor="confirm_password"
            required
            error={errors.confirm_password}
          >
            <input
              id="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={(e) =>
                setForm({ ...form, confirm_password: e.target.value })
              }
              className={authInputClass}
              placeholder="••••••••"
            />
          </AuthField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField label="DNI" htmlFor="dni" hint="(opcional)" error={errors.dni}>
            <input
              id="dni"
              type="text"
              value={form.dni}
              onChange={(e) =>
                setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })
              }
              maxLength={8}
              className={authInputClass}
              placeholder="12345678"
            />
          </AuthField>

          <AuthField label="Teléfono" htmlFor="phone" hint="(opcional)" error={errors.phone}>
            <input
              id="phone"
              type="text"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })
              }
              maxLength={9}
              className={authInputClass}
              placeholder="987654321"
            />
          </AuthField>
        </div>

        <AuthField label="Dirección" htmlFor="address" hint="(opcional)">
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={authInputClass}
            placeholder="Av. Principal 123"
          />
        </AuthField>

        <AuthSubmit disabled={isLoading} loading={isLoading}>
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        </AuthSubmit>
      </form>
    </AuthLayout>
  );
}
