// ============================================================
// QuickActionFab — Botón flotante de acción rápida (asistente)
// ============================================================
// FAB circular fijo abajo-derecha, SOLO en el layout de cliente.
// Al tocarlo despliega hacia arriba un mini-menú con 2 accesos directos:
//   1) Asesoría farmacéutica  → scroll a la sección #asesoria de la Home.
//   2) Subir receta médica    → abre el modal EXISTENTE de PrescriptionUpload
//      (vía evento global, sin duplicar la función ni usar IA para recetar).
//
// Cierra con: clic fuera, Esc o volver a tocar el FAB. Accesible (roles ARIA,
// focus management). Coherente con tokens de marca, claro/oscuro y radios.
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { X, UserCheck, ScrollText } from 'lucide-react';
import { PRESCRIPTION_OPEN_EVENT } from './PrescriptionUpload';
import mascotaBot from '@/assets/home/mascota-bot-original.png';

// Mascota del FAB (PNG con fondo transparente). Para cambiarla, reemplaza el
// archivo o ajusta este import.
const MASCOT_SRC: string = mascotaBot;

export function QuickActionFab() {
  const [open, setOpen] = useState(false);
  // Una vez que el usuario interactúa, silenciamos la micro-animación de atención.
  const [used, setUsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const rootRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    setUsed(true);
    setOpen((v) => !v);
  }, []);

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
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

  // Al abrir, llevar el foco a la primera opción (accesibilidad por teclado).
  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  // Opción 1 → Asesoría farmacéutica (sección #asesoria de la Home).
  const goAsesoria = useCallback(() => {
    close();
    const scrollToAnchor = () => {
      const el = document.getElementById('asesoria');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };
    if (location.pathname === '/') {
      scrollToAnchor();
    } else {
      // Navegar a la Home y esperar a que el ancla exista antes de hacer scroll.
      navigate('/');
      let tries = 0;
      const tick = () => {
        if (scrollToAnchor() || tries++ > 60) return;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [close, location.pathname, navigate]);

  // Opción 2 → Subir receta médica (reutiliza el modal existente del header).
  const goSubirReceta = useCallback(() => {
    close();
    window.dispatchEvent(new CustomEvent(PRESCRIPTION_OPEN_EVENT));
  }, [close]);

  return (
    <div
      ref={rootRef}
      className="qa-fab-root fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-[1050] flex flex-col items-end gap-3"
    >
      {/* ===== Mini-menú (se despliega hacia arriba) ===== */}
      <div
        id="qa-fab-menu"
        role="menu"
        aria-label="Acciones rápidas"
        data-open={open}
        className="qa-menu"
      >
        <div className="flex flex-col gap-2.5 w-72 max-w-[calc(100vw-2rem)]">
          {/* Opción 1 — Asesoría farmacéutica */}
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            onClick={goAsesoria}
            style={{ transitionDelay: open ? '60ms' : '0ms' }}
            className="qa-card group flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-lg transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <UserCheck className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-text">
                Asesoría farmacéutica
              </span>
              <span className="block text-xs text-muted leading-snug">
                Consulta gratis con un químico colegiado
              </span>
            </span>
          </button>

          {/* Opción 2 — Subir receta médica */}
          <button
            type="button"
            role="menuitem"
            onClick={goSubirReceta}
            style={{ transitionDelay: open ? '120ms' : '0ms' }}
            className="qa-card group flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-lg transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <ScrollText className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-text">
                Subir receta médica
              </span>
              <span className="block text-xs text-muted leading-snug">
                Envíala y la revisa nuestro equipo
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* ===== Botón flotante (FAB) ===== */}
      <button
        ref={fabRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="qa-fab-menu"
        aria-label={open ? 'Cerrar acciones rápidas' : 'Abrir acciones rápidas'}
        data-quiet={open || used}
        className="qa-fab-btn relative flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl ring-1 ring-black/5 transition-[transform,background-color] duration-200 hover:bg-brand-hover hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <img
            src={MASCOT_SRC}
            alt=""
            aria-hidden="true"
            className="h-11 w-11 object-contain drop-shadow-sm"
          />
        )}
      </button>
    </div>
  );
}
