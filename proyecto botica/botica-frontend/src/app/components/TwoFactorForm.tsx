// ============================================================
// TwoFactorForm — paso de verificación en dos pasos (2FA) del personal
// ============================================================
// Segunda pantalla del login de admin/staff: el usuario ingresa el código de 6
// dígitos que llegó a su correo. Coherente con AuthLayout (misma tarjeta, acento
// naranja, foco visible). Incluye:
//   · input de 6 casillas con auto-avance y pegado (input-otp)
//   · "Recordar este dispositivo por 30 días"
//   · "Reenviar código" con cooldown visible
//   · "Volver" para corregir credenciales
// El challenge se mantiene aquí: al reenviar, el backend devuelve uno nuevo y
// lo actualizamos para que su expiración quede alineada con el nuevo código.
// ============================================================

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { OTPInput, type SlotProps } from 'input-otp';
import { ArrowLeft, AlertCircle, ShieldCheck, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '../lib/api';
import type { ResendTwofaResponse } from '../lib/types';
import { AuthSubmit } from './AuthLayout';

interface TwoFactorFormProps {
  challenge: string;
  emailMasked: string;
  /** Segundos iniciales hasta poder reenviar. */
  resendAvailableIn: number;
  /** En dev sin SMTP: el código se mostró en la consola del servidor. */
  devDelivery?: boolean;
  /** Verifica el código. Resuelve en éxito (el padre navega) o lanza ApiError. */
  onVerify: (challenge: string, code: string, rememberDevice: boolean) => Promise<void>;
  /** Reenvía el código. Devuelve la respuesta (nuevo challenge + cooldown). */
  onResend: (challenge: string) => Promise<ResendTwofaResponse>;
  /** Volver al paso de credenciales. */
  onBack: () => void;
}

function OtpSlot({ slot }: { slot: SlotProps }) {
  return (
    <div
      className={`relative flex h-13 w-11 items-center justify-center rounded-xl border bg-surface text-xl font-semibold text-text transition-all sm:w-12 ${
        slot.isActive ? 'z-10 border-brand ring-2 ring-brand/30' : 'border-line'
      }`}
      style={{ height: '3.25rem' }}
    >
      {slot.char ?? (slot.placeholderChar ?? '')}
      {slot.hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-px animate-pulse bg-brand" />
        </div>
      )}
    </div>
  );
}

export function TwoFactorForm({
  challenge: initialChallenge,
  emailMasked,
  resendAvailableIn,
  devDelivery,
  onVerify,
  onResend,
  onBack,
}: TwoFactorFormProps) {
  const [challenge, setChallenge] = useState(initialChallenge);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [remember, setRemember] = useState(false);
  const [cooldown, setCooldown] = useState(resendAvailableIn);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cuenta regresiva del reenvío.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const focusInput = () => requestAnimationFrame(() => inputRef.current?.focus());

  const verify = async (value: string) => {
    if (value.length !== 6 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onVerify(challenge, value, remember);
      // Éxito: el padre navega; este componente se desmonta.
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as { attempts_left?: number; expired?: boolean } | undefined;
        if (typeof body?.attempts_left === 'number') {
          const n = body.attempts_left;
          setError(`Código incorrecto. Te ${n === 1 ? 'queda' : 'quedan'} ${n} intento${n === 1 ? '' : 's'}.`);
        } else {
          // Mensajes de expiración/bloqueo del backend ya son claros.
          setError(e.message);
        }
      } else {
        setError('No se pudo verificar el código. Intenta de nuevo.');
      }
      setCode('');
      focusInput();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    verify(code);
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await onResend(challenge);
      setChallenge(res.challenge);
      setCooldown(res.resend_available_in || 60);
      setCode('');
      toast.success(res.message || 'Te enviamos un nuevo código.');
      focusInput();
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as { resend_available_in?: number } | undefined;
        if (typeof body?.resend_available_in === 'number') setCooldown(body.resend_available_in);
        setError(e.message);
      } else {
        setError('No se pudo reenviar el código. Intenta de nuevo.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Contexto del paso */}
      <div className="flex flex-col items-center text-center">
        <span
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'var(--c-brand-soft)', color: 'var(--c-brand)' }}
        >
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-bold text-text">Verificación en dos pasos</h2>
        <p className="mt-1 text-sm text-muted">
          Te enviamos un código a{' '}
          <span className="font-semibold text-text">{emailMasked}</span>
        </p>
      </div>

      {/* Casillas del código */}
      <div>
        <label htmlFor="otp" className="mb-2 block text-center text-sm font-medium text-text">
          Ingresa el código de 6 dígitos
        </label>
        <OTPInput
          id="otp"
          ref={inputRef}
          value={code}
          onChange={(v) => {
            const digits = v.replace(/\D/g, '').slice(0, 6);
            setCode(digits);
            if (error) setError(null);
            if (digits.length === 6) verify(digits); // auto-enviar al completar
          }}
          maxLength={6}
          inputMode="numeric"
          autoFocus
          disabled={submitting}
          aria-label="Código de verificación de 6 dígitos"
          aria-invalid={!!error}
          containerClassName="flex items-center justify-center gap-2"
          render={({ slots }) => (
            <div className="flex items-center justify-center gap-2">
              {slots.slice(0, 3).map((slot, i) => (
                <OtpSlot key={i} slot={slot} />
              ))}
              <span aria-hidden className="mx-0.5 h-px w-3 bg-line" />
              {slots.slice(3).map((slot, i) => (
                <OtpSlot key={i + 3} slot={slot} />
              ))}
            </div>
          )}
        />
        {devDelivery && (
          <p className="mt-2 text-center text-xs text-muted">
            Modo desarrollo: el código se mostró en la consola del servidor.
          </p>
        )}
      </div>

      {/* Avisos (aria-live estable) */}
      <div aria-live="polite" className="empty:hidden">
        {error && (
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
        )}
      </div>

      {/* Recordar este dispositivo */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-line-2">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--c-brand)]"
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-text">Recordar este dispositivo por 30 días</span>
          <span className="block text-xs text-muted">
            No te pediremos el código en este equipo durante ese tiempo.
          </span>
        </span>
      </label>

      <AuthSubmit disabled={submitting || code.length !== 6} loading={submitting}>
        {submitting ? 'Verificando...' : 'Verificar'}
      </AuthSubmit>

      {/* Reenviar + volver */}
      <div className="flex flex-col items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:text-muted focus-visible:outline-none focus-visible:underline"
        >
          <RotateCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
          {resending
            ? 'Reenviando...'
            : cooldown > 0
            ? `Reenviar código en ${cooldown}s`
            : 'Reenviar código'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </button>
      </div>
    </form>
  );
}
