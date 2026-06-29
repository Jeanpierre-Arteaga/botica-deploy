// ============================================================
// LockoutNotice — Aviso de bloqueo del login + contacto con el admin
// ============================================================
// Se muestra cuando el backend bloquea la cuenta tras 3 intentos fallidos
// (HTTP 423). Diseño sobrio (tono ámbar/warning), accesible, con accesos para
// COMUNICARSE CON EL ADMINISTRADOR (WhatsApp + correo de soporte).
// ============================================================

import { ShieldAlert } from 'lucide-react';
import { ContactAdminActions } from './ContactAdminActions';

export function LockoutNotice({ retrySeconds }: { retrySeconds?: number }) {
  const minutes = retrySeconds ? Math.max(1, Math.ceil(retrySeconds / 60)) : null;

  return (
    <div
      role="alert"
      className="animate-fade-in-up rounded-xl border p-4 text-sm"
      style={{ backgroundColor: 'var(--c-warning-soft)', borderColor: 'var(--c-warning)' }}
    >
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="min-w-0">
          <p className="font-semibold text-text">Acceso bloqueado temporalmente</p>
          <p className="text-muted mt-0.5">
            Por seguridad, tras varios intentos fallidos no puedes ingresar por el momento.
            {minutes
              ? ` Vuelve a intentarlo en ~${minutes} min.`
              : ' Espera unos minutos e inténtalo de nuevo.'}
          </p>
          <p className="text-muted mt-1">¿No recuerdas tu contraseña? Comunícate con el administrador:</p>
          <ContactAdminActions message="Hola, necesito ayuda para acceder a mi cuenta del panel de Botica Central." />
        </div>
      </div>
    </div>
  );
}
