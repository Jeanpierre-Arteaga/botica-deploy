// ============================================================
// useAdminNotifications — Notificaciones REALES del panel admin
// ============================================================
// Construye la lista de la campana a partir de datos de negocio:
//   1. Stock crítico / bajo por sede  → GET /api/inventory/low-stock
//   2. Pedidos pendientes             → GET /api/orders?order_state=pendiente
//
// Respeta el alcance de sede del admin (null = ambas). El estado
// "leída" / "descartada" vive en localStorage con ids ESTABLES por
// origen, así que sobrevive a recargas y refetch. Las marcas de items
// que ya se resolvieron se purgan solas en cada carga.
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from './api';

export type AdminNotifType = 'critical' | 'low' | 'order';

export interface AdminNotification {
  /** Estable: 'stock-<inventory_id>' | 'order-<order_id>'. */
  id: string;
  type: AdminNotifType;
  title: string;
  message: string;
  /** Nombre de la sede a la que pertenece la alerta. */
  sede: string;
  /** Ruta a la sección correspondiente. */
  href: string;
  read: boolean;
  /** Para ordenar: crítico (0) → bajo (1) → pedido (2). */
  sortKey: number;
}

type RawNotification = Omit<AdminNotification, 'read'>;

const READ_KEY = 'botica_admin_notif_read';
const DISMISS_KEY = 'botica_admin_notif_dismissed';
const POLL_MS = 60_000; // refresco en vivo cada minuto

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function useAdminNotifications(locationId: number | null) {
  const [raw, setRaw] = useState<RawNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadSet(READ_KEY));
  const [dismissed, setDismissed] = useState<Set<string>>(() =>
    loadSet(DISMISS_KEY),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [low, pending] = await Promise.all([
        api.inventory.getLowStock().catch(() => []),
        api.orders
          .getAll({
            order_state: 'pendiente',
            location_id: locationId ?? undefined,
          })
          .catch(() => []),
      ]);

      const items: RawNotification[] = [];

      for (const it of low) {
        // El endpoint trae todas las sedes; filtramos por alcance.
        if (locationId != null && it.location_id !== locationId) continue;
        const critical = it.current_stock <= Math.ceil(it.min_stock / 2);
        items.push({
          id: `stock-${it.inventory_id}`,
          type: critical ? 'critical' : 'low',
          title: critical ? 'Stock crítico' : 'Stock bajo',
          message: `${it.product_name ?? 'Producto'} · ${it.current_stock}/${it.min_stock} unidades`,
          sede: it.location_name ?? '—',
          href: '/admin/stock',
          sortKey: critical ? 0 : 1,
        });
      }

      for (const o of pending) {
        items.push({
          id: `order-${o.order_id}`,
          type: 'order',
          title: 'Pedido pendiente',
          message: `Pedido #${o.order_id} · S/ ${o.total_price.toFixed(2)}`,
          sede: o.location_name ?? '—',
          href: `/admin/pedidos/${o.order_id}`,
          sortKey: 2,
        });
      }

      setRaw(items);

      // Purga marcas de items que ya no existen (resueltos): mantiene
      // localStorage pequeño y permite que una alerta reaparezca si vuelve.
      const present = new Set(items.map((i) => i.id));
      setReadIds((prev) => {
        const next = new Set([...prev].filter((id) => present.has(id)));
        if (next.size !== prev.size) saveSet(READ_KEY, next);
        return next;
      });
      setDismissed((prev) => {
        const next = new Set([...prev].filter((id) => present.has(id)));
        if (next.size !== prev.size) saveSet(DISMISS_KEY, next);
        return next;
      });
    } catch {
      setError('No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresco en vivo del conteo.
  useEffect(() => {
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const notifications = useMemo<AdminNotification[]>(
    () =>
      raw
        .filter((n) => !dismissed.has(n.id))
        .map((n) => ({ ...n, read: readIds.has(n.id) }))
        .sort((a, b) => a.sortKey - b.sortKey || a.id.localeCompare(b.id)),
    [raw, dismissed, readIds],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      saveSet(READ_KEY, next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveSet(READ_KEY, next);
      return next;
    });
  }, [notifications]);

  const clearAll = useCallback(() => {
    setDismissed((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveSet(DISMISS_KEY, next);
      return next;
    });
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
    reload: load,
  };
}
