// ============================================================
// WhatsAppFab — Botón flotante de WhatsApp (espejo del asistente)
// ============================================================
// FAB circular fijo abajo-IZQUIERDA, espejo del QuickActionFab (mismo tamaño,
// forma, elevación y comportamiento), pero con la marca de WhatsApp. Al tocarlo
// NO redirige de inmediato: abre una tarjeta para ELEGIR LA SEDE antes de ir al
// chat. Reusa las clases qa-* (animación) en variante izquierda (.qa-menu-left).
//
// La foto que aparece DENTRO de WhatsApp la define la cuenta de cada número (no
// la web); aquí solo mostramos el avatar de la botica en NUESTRA tarjeta.
// Cierra con: clic fuera, Esc o volver a tocar el FAB. Accesible.
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, MapPin, Clock, Send } from 'lucide-react';
import { whatsappHref } from '../lib/contact';
import boticaAvatar from '@/imports/botica_icono-2.jpeg';

// Mensaje inicial prellenado (se URL-encodea en whatsappHref).
const WA_MESSAGE = 'Hola, quiero hacer una consulta sobre Boticas Central 🙌';

// Sedes con su WhatsApp (9 dígitos; el helper antepone 51).
const SEDES: { name: string; phone: string; schedule: string }[] = [
  { name: 'Sede Ate', phone: '942874843', schedule: 'Lun a Vie · 7:00 a.m.–12:00 a.m.' },
  { name: 'Sede Santa Anita', phone: '929255281', schedule: 'Lun a Vie · 7:00 a.m.–12:00 a.m.' },
];

// Glyph oficial de WhatsApp (simple-icons), en blanco.
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.582 0 11.943-5.359 11.945-11.892a11.821 11.821 0 00-3.418-8.453z" />
    </svg>
  );
}

export function WhatsAppFab() {
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => {
    setUsed(true);
    setOpen((v) => !v);
  }, []);

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, close]);

  // Cerrar con Esc y devolver el foco al FAB.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        fabRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Al abrir, foco a la primera sede.
  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="qa-fab-root fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-[1050] flex flex-col items-start gap-3"
    >
      {/* ===== Tarjeta (selector de sede) ===== */}
      <div
        id="wa-fab-menu"
        role="dialog"
        aria-label="Contactar por WhatsApp"
        data-open={open}
        className="qa-menu qa-menu-left w-80 max-w-[calc(100vw-2rem)]"
      >
        <div className="qa-card rounded-2xl border border-line bg-surface p-3.5 shadow-lg">
          {/* Cabecera: avatar de la botica + título + cerrar */}
          <div className="mb-3 flex items-start gap-3">
            <span className="relative flex-shrink-0">
              <img
                src={boticaAvatar}
                alt="Boticas Central"
                className="h-12 w-12 rounded-full object-cover ring-1 ring-line"
              />
              {/* Punto "en línea" (estética de contacto) */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-[#25D366]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-text">¿Te ayudamos por WhatsApp?</p>
              <p className="text-xs leading-snug text-muted">Elige tu sede y conversemos; te respondemos al toque.</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="-mr-1 -mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Opciones de sede */}
          <div className="flex flex-col gap-2">
            {SEDES.map((s, i) => (
              <a
                key={s.phone}
                ref={i === 0 ? firstItemRef : undefined}
                href={whatsappHref(s.phone, WA_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="group flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 transition-colors hover:border-[#25D366] hover:bg-[#25D366]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#25D366]/15 text-[#128C45]">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-text">{s.name}</span>
                  <span className="flex items-center gap-1 text-[11px] leading-snug text-muted">
                    <Clock className="h-3 w-3 flex-shrink-0" /> {s.schedule}
                  </span>
                </span>
                <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-[#1ebe5b]">
                  <Send className="h-3.5 w-3.5" /> Escribir
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Botón flotante (FAB de WhatsApp) ===== */}
      <button
        ref={fabRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="wa-fab-menu"
        aria-label={open ? 'Cerrar contacto por WhatsApp' : 'Contactar por WhatsApp'}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-1 ring-black/5 transition-[transform,background-color] duration-200 hover:bg-[#1ebe5b] hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        {open ? <X className="h-6 w-6" /> : <WhatsAppGlyph className="h-7 w-7" />}
      </button>
    </div>
  );
}
