// ============================================================
// AuthContext — Estado global de autenticación
// ============================================================
// FIX: añade validación de sesión al montar (detecta tokens
// corruptos/expirados automáticamente sin necesidad de que el
// usuario haga una petición que devuelva 401).
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api, tokenStorage, ApiError } from './api';
import type { Role } from './types';

// ============================================================
// TIPOS
// ============================================================

export interface AuthUser {
  id: number;
  role: Role;
  full_name: string;
  // Específico de staff/admin:
  user_code?: string;
  location_id?: number | null;
  /** Nombre de la sede asignada (para mostrar "Sede: ..." en el panel) */
  location_name?: string | null;
  // Específico de customer:
  email?: string;
  dni?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True mientras se valida el token al montar la app */
  isCheckingSession: boolean;
  loginStaff: (user_code: string, password: string, requiredRole?: 'admin' | 'emp') => Promise<void>;
  loginCustomer: (email: string, password: string, remember?: boolean) => Promise<void>;
  loginWithGoogle: (accessToken: string, remember?: boolean) => Promise<void>;
  registerCustomer: (payload: {
    full_name: string;
    email: string;
    customer_password: string;
    dni?: string;
    address?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  refreshUser: () => Promise<void>;
  /** Obtiene la inicial del nombre (para avatar) */
  getInitial: () => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'botica_user';

// ============================================================
// HELPERS
// ============================================================

function loadUserFromStorage(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    // Lee de sessionStorage primero (sesión de pestaña) y cae a localStorage
    // (sesión persistente "recordarme"). Mantiene el user junto al token.
    const raw =
      sessionStorage.getItem(USER_STORAGE_KEY) ||
      localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// persistent=true → localStorage (recordarme); false → sessionStorage.
// Por defecto true para no alterar staff/admin/registro.
function saveUserToStorage(user: AuthUser | null, persistent = true): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    return;
  }
  const raw = JSON.stringify(user);
  if (persistent) {
    localStorage.setItem(USER_STORAGE_KEY, raw);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } else {
    sessionStorage.setItem(USER_STORAGE_KEY, raw);
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

/** Decodifica el JWT sin validar firma (solo para leer el payload) */
function decodeTokenPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

/** Verifica si un token ha expirado o es inválido en formato */
function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload || !payload.exp) return true;
  // exp viene en segundos, Date.now() en ms
  return payload.exp * 1000 < Date.now();
}

// ============================================================
// PROVIDER
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();

  // Logout (limpia todo)
  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
    saveUserToStorage(null);
  }, []);

  // FIX: Validación de sesión al montar la app
  // - Si hay token guardado pero expirado/corrupto → limpia todo
  // - Si hay token válido pero el user no matchea → refresca user del backend
  useEffect(() => {
    const validateSession = async () => {
      const token = tokenStorage.get();
      const storedUser = loadUserFromStorage();

      // No hay sesión guardada
      if (!token || !storedUser) {
        setIsCheckingSession(false);
        return;
      }

      // Token expirado o corrupto en formato → limpiar silenciosamente
      if (isTokenExpired(token)) {
        api.auth.logout();
        setUser(null);
        saveUserToStorage(null);
        setIsCheckingSession(false);
        return;
      }

      // Token válido en formato → validar contra backend que aún es aceptado
      try {
        if (storedUser.role === 'cust') {
          await api.customers.getMe();
          // Sesión válida, mantener el user actual
        } else {
          // Enriquecemos el user con datos frescos del backend (p. ej. location_name,
          // que sesiones anteriores a este fix podían no tener guardado).
          const u = await api.users.getMe();
          if (u.location_name && u.location_name !== storedUser.location_name) {
            const enriched: AuthUser = {
              ...storedUser,
              location_id: u.location_id ?? storedUser.location_id ?? null,
              location_name: u.location_name,
            };
            setUser(enriched);
            saveUserToStorage(enriched);
          }
        }
      } catch (err) {
        // 401 → token rechazado por backend (sesión inválida)
        if (err instanceof ApiError && err.status === 401) {
          api.auth.logout();
          setUser(null);
          saveUserToStorage(null);
          // No mostramos toast aquí porque es validación silenciosa al montar
        }
        // Otros errores (network, 500) → mantener sesión local, ya se manejará después
      } finally {
        setIsCheckingSession(false);
      }
    };

    validateSession();
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Interceptor global: si cualquier request devuelve 401 después de tener sesión, hacemos logout y redirect
  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent<{ status: number }>;
      if (customEvent.detail?.status === 401 && user) {
        logout();
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
        navigate('/login');
      }
    };
    window.addEventListener('api-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('api-unauthorized', handleUnauthorized);
  }, [user, logout, navigate]);

  // Login para staff/admin
  const loginStaff = useCallback(
    async (
      user_code: string,
      password: string,
      requiredRole?: 'admin' | 'emp'
    ) => {
      setIsLoading(true);
      try {
        const res = await api.auth.loginStaff(user_code, password);

        if (requiredRole && res.user.role !== requiredRole) {
          api.auth.logout();
          throw new ApiError(
            403,
            requiredRole === 'admin'
              ? 'Esta cuenta no tiene permisos de administrador.'
              : 'Esta cuenta no es de personal de botica.'
          );
        }

        const authUser: AuthUser = {
          id: res.user.user_id,
          role: res.user.role,
          full_name: res.user.full_name,
          user_code: res.user.user_code,
          location_id: res.user.location_id,
          location_name: res.user.location_name ?? null,
        };
        setUser(authUser);
        saveUserToStorage(authUser);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Login para customer. remember controla la persistencia de la sesión.
  const loginCustomer = useCallback(
    async (email: string, password: string, remember = false) => {
      setIsLoading(true);
      try {
        const res = await api.auth.loginCustomer(email, password, remember);
        const authUser: AuthUser = {
          id: res.customer.customer_id,
          role: 'cust',
          full_name: res.customer.full_name,
          email: res.customer.email,
          dni: res.customer.dni,
          phone: res.customer.phone,
          address: res.customer.address,
        };
        setUser(authUser);
        saveUserToStorage(authUser, remember);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Login / alta con Google
  const loginWithGoogle = useCallback(
    async (accessToken: string, remember = true) => {
      setIsLoading(true);
      try {
        const res = await api.auth.loginWithGoogle(accessToken, remember);
        const authUser: AuthUser = {
          id: res.customer.customer_id,
          role: 'cust',
          full_name: res.customer.full_name,
          email: res.customer.email,
          dni: res.customer.dni,
          phone: res.customer.phone,
          address: res.customer.address,
        };
        setUser(authUser);
        saveUserToStorage(authUser, remember);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Registro de customer (auto-login incluido)
  const registerCustomer = useCallback(
    async (payload: {
      full_name: string;
      email: string;
      customer_password: string;
      dni?: string;
      address?: string;
      phone?: string;
    }) => {
      setIsLoading(true);
      try {
        const res = await api.auth.registerCustomer(payload);
        const authUser: AuthUser = {
          id: res.customer.customer_id,
          role: 'cust',
          full_name: res.customer.full_name,
          email: res.customer.email,
          dni: res.customer.dni,
          phone: res.customer.phone,
          address: res.customer.address,
        };
        setUser(authUser);
        saveUserToStorage(authUser);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Refresh user
  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      if (user.role === 'cust') {
        const customer = await api.customers.getMe();
        const updated: AuthUser = {
          ...user,
          full_name: customer.full_name,
          email: customer.email || undefined,
          dni: customer.dni,
          phone: customer.phone,
          address: customer.address,
        };
        setUser(updated);
        saveUserToStorage(updated);
      } else {
        const u = await api.users.getMe();
        const updated: AuthUser = {
          ...user,
          full_name: u.full_name,
          user_code: u.user_code,
          location_id: u.location_id,
          location_name: u.location_name ?? null,
        };
        setUser(updated);
        saveUserToStorage(updated);
      }
    } catch {
      // Si falla, posiblemente el token expiró → el interceptor lo maneja
    }
  }, [user]);

  const hasRole = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const getInitial = useCallback((): string => {
    if (!user?.full_name) return '?';
    const trimmed = user.full_name.trim();
    if (!trimmed) return '?';
    return trimmed.charAt(0).toUpperCase();
  }, [user]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null && tokenStorage.get() !== null,
    isLoading,
    isCheckingSession,
    loginStaff,
    loginCustomer,
    loginWithGoogle,
    registerCustomer,
    logout,
    hasRole,
    refreshUser,
    getInitial,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
