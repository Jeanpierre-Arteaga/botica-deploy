// ============================================================
// LockoutNotice — Aviso de bloqueo del login + contacto con el admin
// ============================================================
// Se muestra cuando el backend bloquea la cuenta tras 3 intentos fallidos
// (HTTP 423). Diseño sobrio (tono ámbar/warning), accesible, con accesos para
// COMUNICARSE CON EL ADMINISTRADOR (WhatsApp + correo de soporte).
// ============================================================

import { ShieldAlert, MessageCircle, Mail } from 'lucide-react';
import { genericContactPhone, whatsappHref, mailtoHref } from '../lib/contact';

const SUPPORT_EMAIL = 'soporte@boticascentral.pe';

export function LockoutNotice({ retrySeconds }: { retrySeconds?: number }) {
  const minutes = retrySeconds ? Math.max(1, Math.ceil(retrySeconds / 60)) : null;
  const wa = whatsappHref(
    genericContactPhone(),
    'Hola, necesito ayuda para acceder a mi cuenta del panel de Botica Central.',
  );

  return (
    <div
      role="alert"
      className="rounded-xl border p-4 text-sm"
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
          <div className="mt-3 flex flex-wrap gap-2">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-white px-3 py-2 text-xs font-semibold hover:bg-brand-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
              </a>
            )}
            <a
              href={mailtoHref(SUPPORT_EMAIL)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface text-text px-3 py-2 text-xs font-semibold hover:border-brand hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Mail className="h-4 w-4" /> Correo de soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
