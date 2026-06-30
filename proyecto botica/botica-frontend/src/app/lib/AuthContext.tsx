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
import type { Role, StaffLoginResponse, ResendTwofaResponse, CustomerAuthResponse } from './types';

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
  /** Foto de perfil (CloudFront). Si existe, reemplaza el avatar de iniciales. */
  photo_url?: string | null;
  // Específico de customer:
  email?: string;
  dni?: string | null;
  phone?: string | null;
  address?: string | null;
  /** True si la cuenta del cliente tiene contraseña (login con email). False = Google. */
  has_password?: boolean;
}

/**
 * Resultado del paso 1 del login de personal. Si twofaRequired es true, el
 * formulario debe pasar al paso de verificación (código por correo) usando los
 * datos del challenge; si es false, la sesión ya quedó iniciada.
 */
export interface StaffLoginOutcome {
  twofaRequired: boolean;
  challenge?: string;
  emailMasked?: string;
  resendAvailableIn?: number;
  expiresIn?: number;
  userCode?: string;
}

interface VerifyStaff2faArgs {
  challenge: string;
  code: string;
  rememberDevice: boolean;
  userCode: string;
  requiredRole?: 'admin' | 'emp';
}

/**
 * Resultado del paso 1 del login de cliente. Si twofaRequired es true, el
 * formulario pasa al paso de verificación (código por correo); si es false, la
 * sesión ya quedó iniciada.
 */
export interface CustomerLoginOutcome {
  twofaRequired: boolean;
  challenge?: string;
  emailMasked?: string;
  resendAvailableIn?: number;
  expiresIn?: number;
}

interface VerifyCustomer2faArgs {
  challenge: string;
  code: string;
  /** Persistencia elegida en el paso 1 (sesión larga vs. de pestaña). */
  remember: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True mientras se valida el token al montar la app */
  isCheckingSession: boolean;
  loginStaff: (user_code: string, password: string, requiredRole?: 'admin' | 'emp') => Promise<StaffLoginOutcome>;
  /** Paso 2 del login de personal: valida el código 2FA y abre la sesión. */
  verifyStaff2fa: (args: VerifyStaff2faArgs) => Promise<void>;
  /** Reenvía el código 2FA (respeta cooldown del backend). */
  resendStaff2fa: (challenge: string) => Promise<ResendTwofaResponse>;
  /** Login de cliente con correo+contraseña. Puede pedir verificación 2FA. */
  loginCustomer: (email: string, password: string, remember?: boolean) => Promise<CustomerLoginOutcome>;
  /** Paso 2 del login de cliente: valida el código 2FA y abre la sesión. */
  verifyCustomer2fa: (args: VerifyCustomer2faArgs) => Promise<void>;
  /** Reenvía el código 2FA del cliente (respeta cooldown del backend). */
  resendCustomer2fa: (challenge: string) => Promise<ResendTwofaResponse>;
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
  /** Aplica cambios al user en memoria + storage (p. ej. tras editar el perfil). */
  applyUserPatch: (patch: Partial<AuthUser>) => void;
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
          // Sesión válida → enriquecemos con datos frescos (foto, has_password,
          // datos editables) por si cambiaron o la sesión es anterior a este fix.
          const c = await api.customers.getMe();
          const enriched: AuthUser = {
            ...storedUser,
            full_name: c.full_name ?? storedUser.full_name,
            email: c.email ?? storedUser.email,
            dni: c.dni ?? null,
            phone: c.phone ?? null,
            address: c.address ?? null,
            photo_url: c.photo_url ?? null,
            has_password: c.has_password ?? storedUser.has_password,
          };
          setUser(enriched);
          saveUserToStorage(enriched, !!localStorage.getItem(USER_STORAGE_KEY));
        } else {
          // Enriquecemos el user con datos frescos del backend (p. ej. location_name,
          // que sesiones anteriores a este fix podían no tener guardado).
          const u = await api.users.getMe();
          const needsEnrich =
            (u.location_name && u.location_name !== storedUser.location_name) ||
            ((u.photo_url ?? null) !== (storedUser.photo_url ?? null));
          if (needsEnrich) {
            const enriched: AuthUser = {
              ...storedUser,
              location_id: u.location_id ?? storedUser.location_id ?? null,
              location_name: u.location_name ?? storedUser.location_name ?? null,
              photo_url: u.photo_url ?? null,
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

  // Crea el AuthUser de personal y abre la sesión (memoria + storage).
  const openStaffSession = useCallback(
    (resUser: StaffLoginResponse['user'], requiredRole?: 'admin' | 'emp') => {
      if (requiredRole && resUser.role !== requiredRole) {
        api.auth.logout();
        throw new ApiError(
          403,
          requiredRole === 'admin'
            ? 'Esta cuenta no tiene permisos de administrador.'
            : 'Esta cuenta no es de personal de botica.'
        );
      }
      const authUser: AuthUser = {
        id: resUser.user_id,
        role: resUser.role,
        full_name: resUser.full_name,
        user_code: resUser.user_code,
        location_id: resUser.location_id,
        location_name: resUser.location_name ?? null,
        photo_url: resUser.photo_url ?? null,
      };
      setUser(authUser);
      saveUserToStorage(authUser);
    },
    []
  );

  // Login para staff/admin — paso 1 (credenciales). Puede completar la sesión
  // directamente (sin 2FA o con dispositivo recordado) o pedir verificación.
  const loginStaff = useCallback(
    async (
      user_code: string,
      password: string,
      requiredRole?: 'admin' | 'emp'
    ): Promise<StaffLoginOutcome> => {
      setIsLoading(true);
      try {
        const res = await api.auth.loginStaff(user_code, password);

        if ('twofa_required' in res && res.twofa_required) {
          return {
            twofaRequired: true,
            challenge: res.challenge,
            emailMasked: res.email_masked,
            resendAvailableIn: res.resend_available_in,
            expiresIn: res.expires_in,
            userCode: user_code,
          };
        }

        openStaffSession((res as StaffLoginResponse).user, requiredRole);
        return { twofaRequired: false };
      } finally {
        setIsLoading(false);
      }
    },
    [openStaffSession]
  );

  // Login para staff/admin — paso 2 (verificación del código 2FA).
  const verifyStaff2fa = useCallback(
    async ({ challenge, code, rememberDevice, userCode, requiredRole }: VerifyStaff2faArgs) => {
      setIsLoading(true);
      try {
        const res = await api.auth.verifyTwofa(challenge, code, rememberDevice, userCode);
        openStaffSession(res.user, requiredRole);
      } finally {
        setIsLoading(false);
      }
    },
    [openStaffSession]
  );

  // Reenvía el código 2FA. El backend aplica el cooldown.
  const resendStaff2fa = useCallback(
    (challenge: string) => api.auth.resendTwofa(challenge),
    []
  );

  // Crea el AuthUser de cliente y abre la sesión (memoria + storage). remember
  // controla la persistencia (localStorage vs sessionStorage).
  const openCustomerSession = useCallback(
    (resCustomer: CustomerAuthResponse['customer'], remember: boolean) => {
      const authUser: AuthUser = {
        id: resCustomer.customer_id,
        role: 'cust',
        full_name: resCustomer.full_name,
        email: resCustomer.email,
        dni: resCustomer.dni,
        phone: resCustomer.phone,
        address: resCustomer.address,
        photo_url: resCustomer.photo_url ?? null,
        has_password: true, // entró con email + contraseña
      };
      setUser(authUser);
      saveUserToStorage(authUser, remember);
    },
    []
  );

  // Login de cliente — paso 1 (credenciales). Puede completar la sesión o pedir
  // verificación 2FA (código por correo). remember controla la persistencia.
  const loginCustomer = useCallback(
    async (email: string, password: string, remember = false): Promise<CustomerLoginOutcome> => {
      setIsLoading(true);
      try {
        const res = await api.auth.loginCustomer(email, password, remember);

        if ('twofa_required' in res && res.twofa_required) {
          return {
            twofaRequired: true,
            challenge: res.challenge,
            emailMasked: res.email_masked,
            resendAvailableIn: res.resend_available_in,
            expiresIn: res.expires_in,
          };
        }

        openCustomerSession((res as CustomerAuthResponse).customer, remember);
        return { twofaRequired: false };
      } finally {
        setIsLoading(false);
      }
    },
    [openCustomerSession]
  );

  // Login de cliente — paso 2 (verificación del código 2FA).
  const verifyCustomer2fa = useCallback(
    async ({ challenge, code, remember }: VerifyCustomer2faArgs) => {
      setIsLoading(true);
      try {
        const res = await api.auth.verifyCustomerTwofa(challenge, code, remember);
        openCustomerSession(res.customer, remember);
      } finally {
        setIsLoading(false);
      }
    },
    [openCustomerSession]
  );

  // Reenvía el código 2FA del cliente. El backend aplica el cooldown.
  const resendCustomer2fa = useCallback(
    (challenge: string) => api.auth.resendCustomerTwofa(challenge),
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
          photo_url: res.customer.photo_url ?? null,
          // La cuenta de Google puede no tener contraseña; /customers/me lo
          // confirma al validar la sesión (has_password real).
          has_password: false,
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
          photo_url: res.customer.photo_url ?? null,
          has_password: true, // se registró con contraseña
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
          photo_url: customer.photo_url ?? null,
          has_password: customer.has_password ?? user.has_password,
        };
        setUser(updated);
        saveUserToStorage(updated, !!localStorage.getItem(USER_STORAGE_KEY));
      } else {
        const u = await api.users.getMe();
        const updated: AuthUser = {
          ...user,
          full_name: u.full_name,
          user_code: u.user_code,
          location_id: u.location_id,
          location_name: u.location_name ?? null,
          photo_url: u.photo_url ?? null,
        };
        setUser(updated);
        saveUserToStorage(updated);
      }
    } catch {
      // Si falla, posiblemente el token expiró → el interceptor lo maneja
    }
  }, [user]);

  // Aplica un parche al user actual (memoria + storage). Lo usa el modal de
  // perfil para reflejar nombre/acceso/foto sin recargar.
  const applyUserPatch = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      saveUserToStorage(updated);
      return updated;
    });
  }, []);

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
    verifyStaff2fa,
    resendStaff2fa,
    loginCustomer,
    verifyCustomer2fa,
    resendCustomer2fa,
    loginWithGoogle,
    registerCustomer,
    logout,
    hasRole,
    refreshUser,
    applyUserPatch,
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
