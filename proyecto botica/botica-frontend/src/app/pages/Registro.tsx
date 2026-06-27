// ============================================================
// Registro — Página de registro de customer nuevo
// ============================================================
// Usa api.auth.registerCustomer (que hace auto-login).
// Después de registro exitoso, redirige a la home con sesión activa.
// Incluye validación EN VIVO de email/DNI en uso (GET /api/customers/check),
// mostrar/ocultar contraseña por campo, y validación de formato de email.
// ============================================================

import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/AuthContext';
import { api, ApiError } from '../lib/api';
import {
  AuthLayout,
  AuthField,
  AuthSubmit,
  authInputClass,
} from '../components/AuthLayout';

// Formato de email "real": exige @ y un dominio con punto.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_TAKEN_MSG = 'Este correo ya está en uso.';
const DNI_TAKEN_MSG = 'Este DNI ya tiene una cuenta. Inicia sesión.';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingDni, setCheckingDni] = useState(false);
  // Aviso (no error) cuando el DNI existe sin cuenta web: se vinculará.
  const [dniLinkHint, setDniLinkHint] = useState<string | null>(null);

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const { [key]: _omit, ...rest } = prev;
      return rest;
    });

  // ── Verificación EN VIVO del email (debounce 500ms) ──────────────
  useEffect(() => {
    const email = form.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      // limpia el "en uso" si el usuario sigue editando
      setErrors((prev) =>
        prev.email === EMAIL_TAKEN_MSG ? (() => { const { email: _e, ...r } = prev; return r; })() : prev
      );
      return;
    }
    const t = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await api.customers.check({ email });
        if (res.email_taken) {
          setErrors((prev) => ({ ...prev, email: EMAIL_TAKEN_MSG }));
        } else {
          clearError('email');
        }
      } catch {
        /* verificación best-effort: el backend es el filtro final */
      } finally {
        setCheckingEmail(false);
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email]);

  // ── Verificación EN VIVO del DNI (debounce 500ms, solo 8 dígitos) ──
  useEffect(() => {
    const dni = form.dni.trim();
    setDniLinkHint(null);
    if (!/^\d{8}$/.test(dni)) {
      setErrors((prev) =>
        prev.dni === DNI_TAKEN_MSG ? (() => { const { dni: _d, ...r } = prev; return r; })() : prev
      );
      return;
    }
    const t = setTimeout(async () => {
      setCheckingDni(true);
      try {
        const res = await api.customers.check({ dni });
        if (res.dni_has_account) {
          setErrors((prev) => ({ ...prev, dni: DNI_TAKEN_MSG }));
        } else {
          clearError('dni');
          if (res.dni_taken) {
            setDniLinkHint('Tienes compras previas en la botica: al registrarte vincularemos tu historial.');
          }
        }
      } catch {
        /* best-effort */
      } finally {
        setCheckingDni(false);
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.dni]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      newErrors.full_name = 'El nombre es obligatorio.';
    }
    if (!form.email.trim()) {
      newErrors.email = 'El email es obligatorio.';
    } else if (!EMAIL_RE.test(form.email.trim().toLowerCase())) {
      newErrors.email = 'Ingresa un email válido (ej. nombre@dominio.com).';
    } else if (errors.email === EMAIL_TAKEN_MSG) {
      newErrors.email = EMAIL_TAKEN_MSG;
    }
    if (!form.customer_password) {
      newErrors.customer_password = 'La contraseña es obligatoria.';
    } else if (form.customer_password.length < 6) {
      newErrors.customer_password = 'Mínimo 6 caracteres.';
    }
    if (form.customer_password !== form.confirm_password) {
      newErrors.confirm_password = 'Las contraseñas no coinciden.';
    }
    if (form.dni) {
      if (!/^\d{8}$/.test(form.dni)) {
        newErrors.dni = 'El DNI debe tener 8 dígitos.';
      } else if (errors.dni === DNI_TAKEN_MSG) {
        newErrors.dni = DNI_TAKEN_MSG;
      }
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
        const msg = (err.body as { message?: string } | undefined)?.message || err.message || '';
        if (err.status === 409) {
          if (/dni/i.test(msg)) {
            setErrors((prev) => ({ ...prev, dni: msg }));
          } else {
            setErrors((prev) => ({ ...prev, email: msg || EMAIL_TAKEN_MSG }));
          }
          toast.error(msg || 'Ese dato ya está en uso.');
        } else {
          toast.error(msg || 'Error al registrar.');
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
      embedded
      brandLine={
        <>
          Únete a Boticas Central
          <br />
          y compra en minutos
        </>
      }
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
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
          <div className="relative">
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`${authInputClass} pr-10`}
              placeholder="tu@email.com"
            />
            <FieldStatus
              checking={checkingEmail}
              ok={EMAIL_RE.test(form.email.trim().toLowerCase()) && !errors.email && !checkingEmail && form.email.trim() !== ''}
            />
          </div>
        </AuthField>

        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            label="Contraseña"
            htmlFor="password"
            required
            error={errors.customer_password}
          >
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.customer_password}
                onChange={(e) =>
                  setForm({ ...form, customer_password: e.target.value })
                }
                className={`${authInputClass} pr-11`}
                placeholder="Mínimo 6 caracteres"
              />
              <PasswordToggle show={showPassword} onToggle={() => setShowPassword((s) => !s)} />
            </div>
          </AuthField>

          <AuthField
            label="Confirmar contraseña"
            htmlFor="confirm_password"
            required
            error={errors.confirm_password}
          >
            <div className="relative">
              <input
                id="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                value={form.confirm_password}
                onChange={(e) =>
                  setForm({ ...form, confirm_password: e.target.value })
                }
                className={`${authInputClass} pr-11`}
                placeholder="••••••••"
              />
              <PasswordToggle show={showConfirm} onToggle={() => setShowConfirm((s) => !s)} />
            </div>
          </AuthField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <AuthField
              label="DNI"
              htmlFor="dni"
              hint="vincula tu historial de compras"
              error={errors.dni}
            >
              <div className="relative">
                <input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  value={form.dni}
                  onChange={(e) =>
                    setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })
                  }
                  maxLength={8}
                  className={`${authInputClass} pr-10`}
                  placeholder="12345678"
                />
                <FieldStatus checking={checkingDni} ok={false} />
              </div>
            </AuthField>
            {dniLinkHint && !errors.dni && (
              <p
                className="mt-1 flex items-start gap-1.5 text-xs font-medium"
                style={{ color: 'var(--c-success)' }}
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {dniLinkHint}
              </p>
            )}
          </div>

          <AuthField label="Teléfono" htmlFor="phone" hint="(opcional)" error={errors.phone}>
            <input
              id="phone"
              type="text"
              inputMode="numeric"
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

/** Botón ojo (mostrar/ocultar) accesible, posicionado dentro del input. */
function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-brand transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      tabIndex={0}
    >
      {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
  );
}

/** Indicador de verificación en vivo (spinner mientras consulta, check si OK). */
function FieldStatus({ checking, ok }: { checking: boolean; ok: boolean }) {
  if (checking) {
    return (
      <Loader2
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
        style={{ color: 'var(--c-faint)' }}
        aria-hidden
      />
    );
  }
  if (ok) {
    return (
      <CheckCircle2
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
        style={{ color: 'var(--c-success)' }}
        aria-hidden
      />
    );
  }
  return null;
}
