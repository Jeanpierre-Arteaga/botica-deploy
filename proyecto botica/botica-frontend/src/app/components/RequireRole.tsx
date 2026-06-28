// ============================================================
// RequireRole — Wrapper para proteger rutas por rol
// ============================================================
// FIX: usa <Navigate> sincrónico en lugar de useEffect+navigate
// para evitar el flash de contenido durante el render inicial.
// ============================================================

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../lib/AuthContext';
import type { Role } from '../lib/types';

interface RequireRoleProps {
  roles: Role[];
  children: ReactNode;
}

/** Determina la ruta de login apropiada según el rol requerido */
function getLoginPathForRole(roles: Role[]): string {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('emp')) return '/staff';
  return '/login';
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, isAuthenticated, hasRole, isCheckingSession } = useAuth();
  const location = useLocation();

  // Mientras se valida la sesión al montar la app, no decidimos nada todavía
  // (evita flash de redirect cuando la app arranca con token válido)
  if (isCheckingSession) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted text-sm">Cargando...</div>
      </div>
    );
  }

  // No autenticado → redirigir al login apropiado (SINCRÓNICO, no useEffect)
  if (!isAuthenticated || !user) {
    const loginPath = getLoginPathForRole(roles);
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  // Autenticado pero sin el rol → redirigir a su área correspondiente
  if (!hasRole(...roles)) {
    // Mostrar toast solo una vez (setTimeout 0 evita warning de actualizar estado durante render)
    setTimeout(() => {
      toast.error('No tienes permiso para acceder a esta sección.');
    }, 0);

    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'emp') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
