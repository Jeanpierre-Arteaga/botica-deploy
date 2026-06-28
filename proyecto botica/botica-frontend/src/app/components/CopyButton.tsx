// ============================================================
// CopyButton — botón "copiar al portapapeles" con feedback
// ============================================================
// Reutilizable en datos copiables (número de Yape/Plin, cuenta,
// CCI, RUC...). Muestra "Copiado" ~1.6 s tras copiar. Accesible:
// aria-label dinámico y foco visible. Incluye fallback para
// navegadores sin Clipboard API (http / contextos inseguros).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  /** Texto que se copia al portapapeles. */
  value: string;
  /** Etiqueta accesible (ej. "Copiar número de Yape"). */
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = 'Copiar', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    const text = value.trim();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: textarea temporal + execCommand (contextos sin Clipboard API)
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Silencioso: si el navegador bloquea el portapapeles, el usuario
      // siempre puede seleccionar el valor manualmente.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copiado' : label}
      title={copied ? 'Copiado' : label}
      className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold shrink-0 transition-all active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${
        copied
          ? 'border-success/40 bg-success-soft text-success'
          : 'border-line bg-surface text-muted hover:border-brand hover:text-brand'
      } ${className}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? 'Copiado' : 'Copiar'}</span>
    </button>
  );
}
