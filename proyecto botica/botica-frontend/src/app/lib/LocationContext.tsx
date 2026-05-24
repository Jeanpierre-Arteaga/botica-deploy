// ============================================================
// LocationContext — Sede seleccionada por el customer
// ============================================================
// Una sola sede está activa en toda la app. Afecta a:
// catálogo (stock por sede), producto detalle (stock filtrado),
// checkout (location_id del pedido). Persiste en localStorage.
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { api } from './api';
import type { Location } from './types';

interface LocationContextValue {
  locations: Location[];
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location) => void;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = 'botica_selected_location_id';

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocationState] =
    useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.locations.getAll();
      const activeLocations = data.filter((l) => l.is_active);
      setLocations(activeLocations);

      const savedId =
        typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const found = savedId
        ? activeLocations.find((l) => l.location_id === parseInt(savedId, 10))
        : null;
      setSelectedLocationState(found || activeLocations[0] || null);
    } catch (err) {
      console.error('Error cargando sedes:', err);
      setError('No se pudieron cargar las sedes disponibles.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setSelectedLocation = useCallback((location: Location) => {
    setSelectedLocationState(location);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(location.location_id));
    }
  }, []);

  const value = useMemo<LocationContextValue>(
    () => ({
      locations,
      selectedLocation,
      setSelectedLocation,
      isLoading,
      error,
      reload: load,
    }),
    [locations, selectedLocation, setSelectedLocation, isLoading, error, load],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocations(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocations debe usarse dentro de <LocationProvider>');
  }
  return ctx;
}
