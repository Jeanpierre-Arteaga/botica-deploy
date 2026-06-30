// ============================================================
// QuickActionFab — Botón flotante de acción rápida (asistente)
// ============================================================
// FAB circular fijo abajo-derecha, SOLO en el layout de cliente.
// Al tocarlo despliega un mini-panel con 4 accesos directos:
//   1) Asesoría farmacéutica → tarjeta con avatar de la botica + "Consultar
//      ahora" que abre WhatsApp del químico colegiado.
//   2) Subir receta médica  → abre el modal EXISTENTE de PrescriptionUpload
//      (vía evento global, sin duplicar la función ni usar IA para recetar).
//   3) Preguntas frecuentes → panel con acordeón (texto fijo, sin IA/backend).
//   4) Ver estado de mis pedidos → atajo a /mis-pedidos (con manejo de
//      no-logueado: avisa y lleva a iniciar sesión).
//
// Cierra con: clic fuera, Esc o volver a tocar el FAB. Accesible (roles ARIA,
// focus management). Coherente con tokens de marca, claro/oscuro y radios.
// ============================================================

import { useEffect, useRef, useState, useCallback, forwardRef, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  X, UserCheck, ScrollText, HelpCircle, ListOrdered, ChevronDown, ArrowLeft, MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PRESCRIPTION_OPEN_EVENT } from './PrescriptionUpload';
import { useAuth } from '../lib/AuthContext';
import { whatsappHref } from '../lib/contact';
import mascotaBot from '@/assets/home/mascota-bot-original.png';
import boticaAvatar from '@/imports/botica_icono-2.jpeg';

// Mascota del FAB (PNG con fondo transparente). Para cambiarla, reemplaza el
// archivo o ajusta este import.
const MASCOT_SRC: string = mascotaBot;

// WhatsApp del químico farmacéutico (asesoría). 9 dígitos: el helper antepone 51.
const PHARMACIST_WA = '915252167';
const PHARMACIST_WA_MSG = 'Hola, quisiera una asesoría farmacéutica 👨‍⚕️';

type View = 'menu' | 'faq' | 'asesoria';

// Preguntas frecuentes (texto fijo, respuestas de 1–2 frases).
const FAQS: { q: string; a: string }[] = [
  {
    q: '¿Cuáles son los horarios?',
    a: 'Sedes Ate y Santa Anita: Lunes a Viernes, de 7:00 a.m. a 12:00 a.m. (medianoche).',
  },
  {
    q: '¿Hacen delivery?',
    a: 'Sí, a todo Lima. Envío gratis desde S/ 50 y lo recibes en 24–48 horas.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Yape, Plin, tarjeta (Visa/Mastercard), efectivo contra entrega y transferencia.',
  },
  {
    q: '¿Cómo subo mi receta?',
    a: 'Toca “Subir receta médica”, envía la foto y nuestro equipo la revisa.',
  },
  {
    q: '¿Necesito receta para algunos productos?',
    a: 'Algunos medicamentos sí la requieren; lo verás indicado en la ficha del producto.',
  },
];

export function QuickActionFab() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  // Una vez que el usuario interactúa, silenciamos la micro-animación de atención.
  const [used, setUsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const rootRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const subBackRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setView('menu');
  }, []);

  const toggle = useCallback(() => {
    setUsed(true);
    setView('menu');
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

  // Cerrar con Esc y devolver el foco al FAB (desde un sub-panel, primero vuelve al menú).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (view !== 'menu') {
        setView('menu');
      } else {
        close();
        fabRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, view, close]);

  // Gestión de foco: al abrir el menú o cambiar de vista, enfoca el primer control.
  useEffect(() => {
    if (!open) return;
    if (view === 'menu') firstItemRef.current?.focus();
    else subBackRef.current?.focus();
  }, [open, view]);

  // ── Acción 1 → Asesoría: scroll a #asesoria de la Home ("Conoce más"). ──
  const scrollToAsesoria = useCallback(() => {
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
      navigate('/');
      let tries = 0;
      const tick = () => {
        if (scrollToAnchor() || tries++ > 60) return;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [close, location.pathname, navigate]);

  // Asesoría → abrir WhatsApp del químico farmacéutico.
  const goAsesoriaWhatsApp = useCallback(() => {
    close();
    window.open(whatsappHref(PHARMACIST_WA, PHARMACIST_WA_MSG), '_blank', 'noopener,noreferrer');
  }, [close]);

  // ── Acción 2 → Subir receta médica (reutiliza el modal existente). ──
  const goSubirReceta = useCallback(() => {
    close();
    window.dispatchEvent(new CustomEvent(PRESCRIPTION_OPEN_EVENT));
  }, [close]);

  // ── Acción 4 → Ver mis pedidos (atajo a la pantalla existente). ──
  const goMisPedidos = useCallback(() => {
    close();
    if (user && user.role === 'cust') {
      navigate('/mis-pedidos');
    } else {
      // Coherente con el acceso a Mis Pedidos: requiere sesión de cliente.
      toast.info('Inicia sesión para ver el estado de tus pedidos.');
      navigate('/login');
    }
  }, [close, navigate, user]);

  return (
    <div
      ref={rootRef}
      className="qa-fab-root fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-[1050] flex flex-col items-end gap-3"
    >
      {/* ===== Panel (se despliega hacia arriba) ===== */}
      <div
        id="qa-fab-menu"
        data-open={open}
        className="qa-menu w-80 max-w-[calc(100vw-2rem)]"
      >
        {view === 'menu' && (
          <div role="menu" aria-label="Asistente Boticas Central" className="flex flex-col gap-2.5">
            <MenuItem
              ref={firstItemRef}
              icon={UserCheck}
              title="Asesoría farmacéutica"
              desc="Consulta gratis con un químico colegiado"
              delay={open ? '60ms' : '0ms'}
              onClick={() => setView('asesoria')}
            />
            <MenuItem
              icon={ScrollText}
              title="Subir receta médica"
              desc="Envíala y la revisa nuestro equipo"
              delay={open ? '110ms' : '0ms'}
              onClick={goSubirReceta}
            />
            <MenuItem
              icon={HelpCircle}
              title="Preguntas frecuentes"
              desc="Horarios, delivery, pagos y más"
              delay={open ? '160ms' : '0ms'}
              onClick={() => { setOpenFaq(0); setView('faq'); }}
            />
            <MenuItem
              icon={ListOrdered}
              title="Ver estado de mis pedidos"
              desc="Sigue tus compras en un toque"
              delay={open ? '210ms' : '0ms'}
              onClick={goMisPedidos}
            />
          </div>
        )}

        {view === 'faq' && (
          <SubPanel
            backRef={subBackRef}
            title="Preguntas frecuentes"
            onBack={() => setView('menu')}
            onClose={close}
          >
            <ul className="flex flex-col gap-2">
              {FAQS.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <li key={i} className="rounded-xl border border-line bg-surface-2 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`qa-faq-panel-${i}`}
                      className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl"
                    >
                      <span className="text-sm font-semibold text-text">{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <p
                        id={`qa-faq-panel-${i}`}
                        className="animate-fade-in-up px-3.5 pb-3 text-xs leading-relaxed text-muted"
                      >
                        {item.a}
                        {i === 3 && (
                          <button
                            type="button"
                            onClick={goSubirReceta}
                            className="ml-1 font-semibold text-brand underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
                          >
                            Subir receta médica
                          </button>
                        )}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </SubPanel>
        )}

        {view === 'asesoria' && (
          <SubPanel
            backRef={subBackRef}
            title="Asesoría farmacéutica"
            onBack={() => setView('menu')}
            onClose={close}
          >
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
              <img
                src={boticaAvatar}
                alt="Boticas Central"
                className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-1 ring-line"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">Consulta gratuita</p>
                <p className="text-xs leading-snug text-muted">
                  Habla con un químico farmacéutico colegiado sobre dosis, interacciones y genéricos.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={goAsesoriaWhatsApp}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-4 w-4" />
              Consultar ahora por WhatsApp
            </button>
            <button
              type="button"
              onClick={scrollToAsesoria}
              className="mt-2 w-full text-center text-xs font-medium text-muted transition-colors hover:text-brand focus:outline-none focus-visible:text-brand"
            >
              Conoce más sobre la asesoría
            </button>
          </SubPanel>
        )}
      </div>

      {/* ===== Botón flotante (FAB) ===== */}
      <button
        ref={fabRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="qa-fab-menu"
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente de Boticas Central'}
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

// Tarjeta de opción del menú principal (ícono + título + apoyo). Misma forma
// para los 4 accesos → consistentes entre sí.
interface MenuItemProps {
  icon: typeof UserCheck;
  title: string;
  desc: string;
  delay: string;
  onClick: () => void;
}

const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ icon: Icon, title, desc, delay, onClick }, ref) => (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{ transitionDelay: delay }}
      className="qa-card group flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-lg transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text">{title}</span>
        <span className="block text-xs leading-snug text-muted">{desc}</span>
      </span>
    </button>
  ),
);
MenuItem.displayName = 'MenuItem';

// Sub-panel (FAQ / Asesoría): tarjeta única con cabecera (volver + título + cerrar).
function SubPanel({
  title, onBack, onClose, backRef, children,
}: {
  title: string;
  onBack: () => void;
  onClose: () => void;
  backRef: React.Ref<HTMLButtonElement>;
  children: ReactNode;
}) {
  return (
    <div className="qa-card rounded-2xl border border-line bg-surface p-3.5 shadow-lg" style={{ transitionDelay: '0ms' }}>
      <div className="mb-3 flex items-center gap-2">
        <button
          ref={backRef}
          type="button"
          onClick={onBack}
          aria-label="Volver al menú"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-soft hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-text">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar asistente"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  );
}
