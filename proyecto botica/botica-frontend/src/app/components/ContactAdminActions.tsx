// ============================================================
// ContactAdminActions — botones de contacto con el administrador
// ============================================================
// Canales compartidos (WhatsApp + correo de soporte) para que el personal pida
// ayuda con su acceso. Se reutiliza en el aviso de bloqueo (LockoutNotice) y en
// el aviso de "¿olvidaste tu contraseña?". Un único punto de verdad de canales.
// ============================================================

import { MessageCircle, Mail } from 'lucide-react';
import { genericContactPhone, whatsappHref, mailtoHref } from '../lib/contact';

export const SUPPORT_EMAIL = 'soporte@boticascentral.pe';

export function ContactAdminActions({ message }: { message?: string }) {
  const wa = whatsappHref(
    genericContactPhone(),
    message ?? 'Hola, necesito ayuda con mi acceso al panel de Botica Central.',
  );

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
        </a>
      )}
      <a
        href={mailtoHref(SUPPORT_EMAIL)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-text transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Mail className="h-4 w-4" /> Correo de soporte
      </a>
    </div>
  );
}
