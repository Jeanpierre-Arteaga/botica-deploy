// ============================================================
// ForgotPasswordNotice — "¿Olvidaste tu contraseña?" (solo staff)
// ============================================================
// El personal NO se autogestiona la contraseña: la restablece un administrador.
// Versión COMPACTA: texto breve, tipografía pequeña, botón discreto de WhatsApp
// y el correo como enlace secundario. Elegante, no un cartelón.
// ============================================================

import { MessageCircle } from 'lucide-react';
import { genericContactPhone, whatsappHref, mailtoHref } from '../lib/contact';
import { SUPPORT_EMAIL } from './ContactAdminActions';

export function ForgotPasswordNotice() {
  const wa = whatsappHref(
    genericContactPhone(),
    'Hola, olvidé mi contraseña del panel de Botica Central y necesito que la restablezcan.',
  );

  return (
    <div
      role="status"
      className="animate-fade-in-up rounded-xl border border-line bg-cool-soft px-3 py-2.5 text-xs"
    >
      <p className="text-muted">
        El restablecimiento lo hace un administrador.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Escribir por WhatsApp
          </a>
        )}
        <a
          href={mailtoHref(SUPPORT_EMAIL)}
          className="font-semibold text-secondary-brand underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Correo de soporte
        </a>
      </div>
    </div>
  );
}
