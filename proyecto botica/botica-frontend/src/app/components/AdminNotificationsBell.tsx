// ============================================================
// AdminNotificationsBell — Campana funcional del panel admin
// ============================================================
// Botón con badge de conteo real + panel desplegable accesible
// (role=menu, foco al abrir, Esc para cerrar, click fuera cierra).
// Los datos salen de useAdminNotifications (stock crítico/bajo y
// pedidos pendientes, reales y filtrados por la sede activa).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell,
  AlertTriangle,
  Package,
  ShoppingBag,
  CheckCheck,
  Trash2,
  Inbox,
  MapPin,
} from 'lucide-react';
import { useAdminScope } from '../lib/AdminScopeContext';
import { useAdminNotificationsContext } from '../lib/AdminNotificationsContext';
import type { AdminNotification } from '../lib/useAdminNotifications';

const TYPE_META: Record<
  AdminNotification['type'],
  { Icon: typeof Bell; color: string; soft: string }
> = {
  critical: { Icon: AlertTriangle, color: 'text-error', soft: 'bg-error-soft' },
  low: { Icon: Package, color: 'text-warning', soft: 'bg-warning-soft' },
  order: { Icon: ShoppingBag, color: 'text-info', soft: 'bg-info-soft' },
};

export function AdminNotificationsBell() {
  const { scopeLabel } = useAdminScope();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useAdminNotificationsContext();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Cerrar al hacer click fuera o con Escape; devolver foco al botón.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Mover el foco al panel al abrir (accesibilidad de teclado).
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const handleOpen = (n: AdminNotification) => {
    markAsRead(n.id);
    setOpen(false);
    navigate(n.href);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : 'Notificaciones'
        }
        className="relative flex items-center justify-center w-10 h-10 rounded-xl text-muted hover:bg-line-2 hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Notificaciones"
          tabIndex={-1}
          className="absolute right-0 top-full mt-2 z-[60] w-[min(23rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-surface shadow-pop overflow-hidden focus:outline-none"
          style={{ animation: 'adminBellPop .16s cubic-bezier(0.16,1,0.3,1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line bg-surface-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-text leading-tight">
                Notificaciones
              </p>
              <p className="inline-flex items-center gap-1 text-[11px] text-muted mt-0.5">
                <MapPin className="w-3 h-3 text-brand" />
                {scopeLabel}
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-soft text-brand text-[11px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Acciones */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-line bg-surface-2">
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-muted hover:bg-surface hover:text-text transition-colors disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar leídas
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-muted hover:bg-error-soft hover:text-error transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar
              </button>
            </div>
          )}

          {/* Lista */}
          <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-faint">
                Cargando alertas…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-success-soft flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6 text-success" />
                </div>
                <p className="text-sm font-semibold text-text">Todo en orden</p>
                <p className="text-xs text-muted mt-1">
                  Sin alertas de stock ni pedidos pendientes en {scopeLabel.toLowerCase()}.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line-2">
                {notifications.map((n) => {
                  const { Icon, color, soft } = TYPE_META[n.type];
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleOpen(n)}
                        className={`w-full text-left flex gap-3 px-4 py-3 transition-colors hover:bg-page focus-visible:outline-none focus-visible:bg-page ${
                          !n.read ? 'bg-brand-soft/40' : ''
                        }`}
                      >
                        <span
                          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${soft}`}
                        >
                          <Icon className={`w-[18px] h-[18px] ${color}`} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-text truncate">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span
                                className="shrink-0 w-2 h-2 rounded-full bg-brand"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                          <span className="block text-xs text-muted mt-0.5 truncate">
                            {n.message}
                          </span>
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-faint">
                            <MapPin className="w-3 h-3" />
                            {n.sede}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Animación de entrada del panel */}
      <style>{`
        @keyframes adminBellPop {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
