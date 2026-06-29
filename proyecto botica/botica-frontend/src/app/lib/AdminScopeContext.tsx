// ============================================================
// AdminScopeContext — Sede activa del panel ADMIN
// ============================================================
// El admin supervisa AMBAS sedes (Ate / Santa Anita). El selector
// de la barra superior fija un "alcance" global que consumen las
// pantallas dependientes de sede (Dashboard, Control de Stock, la
// campana de notificaciones, etc.).
//
//   selectedLocationId === null  → "Ambas sedes" (sin filtro)
//   selectedLocationId === <id>  → solo esa sede
//
// Es DISTINTO de LocationContext (la sede que elige el CLIENTE en la
// tienda): aquí el valor por defecto es "ambas" y nunca afecta al
// catálogo público. Persiste en localStorage para sobrevivir recargas.
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { api } from './api';
import type { Location } from './types';

interface AdminScopeValue {
  /** Sedes activas disponibles (ordenadas por id). */
  locations: Location[];
  isLoading: boolean;
  /** location_id seleccionado, o null cuando es "Ambas sedes". */
  selectedLocationId: number | null;
  /** Objeto sede seleccionado (null cuando es "Ambas sedes"). */
  selectedLocation: Location | null;
  /** true cuando el alcance abarca las dos sedes. */
  isBoth: boolean;
  /** Etiqueta corta para mostrar: "Ambas sedes" | "Ate" | "Santa Anita". */
  scopeLabel: string;
  /** Fija el alcance. Pasa un location_id, o null para "Ambas sedes". */
  setScope: (locationId: number | null) => void;
}

const AdminScopeContext = createContext<AdminScopeValue | undefined>(undefined);

const STORAGE_KEY = 'botica_admin_scope'; // 'both' | '<location_id>'

function readStoredScope(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw || raw === 'both') return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

export function AdminScopeProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] =
    useState<number | null>(readStoredScope);

  // Carga las sedes una sola vez (endpoint público).
  useEffect(() => {
    let alive = true;
    api.locations
      .getAll()
      .then((data) => {
        if (!alive) return;
        setLocations(
          data
            .filter((l) => l.is_active)
            .sort((a, b) => a.location_id - b.location_id),
        );
      })
      .catch(() => {
        // Si falla, el selector degrada a solo "Ambas sedes".
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const setScope = useCallback((locationId: number | null) => {
    setSelectedLocationId(locationId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        STORAGE_KEY,
        locationId == null ? 'both' : String(locationId),
      );
    }
  }, []);

  // Si la sede guardada ya no existe (sede dada de baja), vuelve a "ambas".
  useEffect(() => {
    if (
      selectedLocationId != null &&
      locations.length > 0 &&
      !locations.some((l) => l.location_id === selectedLocationId)
    ) {
      setScope(null);
    }
  }, [locations, selectedLocationId, setScope]);

  const selectedLocation = useMemo(
    () => locations.find((l) => l.location_id === selectedLocationId) ?? null,
    [locations, selectedLocationId],
  );

  const value = useMemo<AdminScopeValue>(
    () => ({
      locations,
      isLoading,
      selectedLocationId,
      selectedLocation,
      isBoth: selectedLocationId == null,
      scopeLabel: selectedLocation?.location_name ?? 'Ambas sedes',
      setScope,
    }),
    [locations, isLoading, selectedLocationId, selectedLocation, setScope],
  );

  return (
    <AdminScopeContext.Provider value={value}>
      {children}
    </AdminScopeContext.Provider>
  );
}

export function useAdminScope(): AdminScopeValue {
  const ctx = useContext(AdminScopeContext);
  if (!ctx) {
    throw new Error('useAdminScope debe usarse dentro de <AdminScopeProvider>');
  }
  return ctx;
}

/**
 * Igual que useAdminScope pero NO lanza si está fuera del provider: devuelve
 * undefined. Útil en componentes COMPARTIDOS entre staff (sin provider) y admin
 * (con provider), p. ej. la página de Pedidos.
 */
export function useAdminScopeOptional(): AdminScopeValue | undefined {
  return useContext(AdminScopeContext);
}
