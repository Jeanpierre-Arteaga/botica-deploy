// ============================================================
// AdminNotificationsContext — Fuente única de la campana admin
// ============================================================
// Envuelve al panel para que TODAS las campanas (topbar desktop y
// header móvil) compartan una sola instancia del hook: un único
// sondeo cada minuto y el mismo estado "leída/descartada" en memoria,
// en vez de que cada campana sondee y lleve su propio estado.
// ============================================================

import { createContext, useContext, ReactNode } from 'react';
import { useAdminScope } from './AdminScopeContext';
import { useAdminNotifications } from './useAdminNotifications';

type AdminNotificationsValue = ReturnType<typeof useAdminNotifications>;

const AdminNotificationsContext =
  createContext<AdminNotificationsValue | null>(null);

export function AdminNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { selectedLocationId } = useAdminScope();
  const value = useAdminNotifications(selectedLocationId);
  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotificationsContext(): AdminNotificationsValue {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) {
    throw new Error(
      'useAdminNotificationsContext debe usarse dentro de <AdminNotificationsProvider>',
    );
  }
  return ctx;
}
