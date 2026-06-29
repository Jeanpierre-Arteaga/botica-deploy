// ============================================================
// UserMenu — Avatar circular con dropdown
// ============================================================
// Componente compartido entre Navbar (customer), WorkerLayout
// y AdminLayout. Muestra el avatar con inicial del nombre +
// nombre al lado + dropdown con opciones.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { User, LogOut, Package, ChevronDown, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/AuthContext';

interface UserMenuProps {
  /** Si se muestra dentro de un sidebar oscuro (admin/staff). Por defecto false (navbar claro). */
  variant?: 'light' | 'dark';
  /** Si se muestra el nombre al lado del avatar. Por defecto true en desktop. */
  showName?: boolean;
  /** Abre el modal "Mi perfil" (solo aplica al cliente). Lo provee el navbar. */
  onOpenProfile?: () => void;
}

export function UserMenu({ variant = 'light', showName = true, onOpenProfile }: UserMenuProps) {
  const { user, logout, getInitial } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.success('Sesión cerrada correctamente.');
    navigate('/', { replace: true });
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  // Estilos según variante
  const buttonStyles =
    variant === 'dark'
      ? 'text-white hover:bg-white/10'
      : 'text-text hover:bg-surface-2';
  const avatarBg =
    variant === 'dark' ? 'bg-surface text-brand' : 'bg-brand text-white';

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${buttonStyles}`}
        aria-label="Menú de usuario"
      >
        {/* Avatar circular: foto/avatar si existe, si no la inicial */}
        {user.photo_url ? (
          <img
            src={user.photo_url}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-line bg-surface"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${avatarBg}`}
          >
            {getInitial()}
          </div>
        )}

        {/* Nombre */}
        {showName && (
          <span className="hidden md:flex items-center gap-1 text-sm font-medium max-w-[140px]">
            <span className="truncate">{user.full_name}</span>
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
            />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl shadow-lg border border-line py-2 z-50">
          {/* Header con nombre y rol */}
          <div className="px-4 py-3 border-b border-line">
            <div className="flex items-center gap-3">
              {user.photo_url ? (
                <img src={user.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-line bg-surface" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-semibold">
                  {getInitial()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-muted truncate">
                  {user.role === 'cust' && user.email}
                  {user.role === 'admin' && 'Administrador'}
                  {user.role === 'emp' && 'Personal de botica'}
                </p>
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="py-1">
            {/* Customer: Mis Pedidos → Mi perfil */}
            {user.role === 'cust' && (
              <>
                <button
                  onClick={() => handleNavigate('/mis-pedidos')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
                >
                  <Package className="w-4 h-4 text-muted" />
                  Mis Pedidos
                </button>
                <button
                  onClick={() => { setOpen(false); onOpenProfile?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
                >
                  <UserCog className="w-4 h-4 text-muted" />
                  Mi perfil
                </button>
              </>
            )}

            {/* Staff ve sus stats */}
            {user.role === 'emp' && (
              <button
                onClick={() => handleNavigate('/staff/dashboard')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
              >
                <User className="w-4 h-4 text-muted" />
                Mi Panel
              </button>
            )}

            {/* Admin tiene su panel */}
            {user.role === 'admin' && (
              <button
                onClick={() => handleNavigate('/admin/dashboard')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-surface-2 transition-colors"
              >
                <User className="w-4 h-4 text-muted" />
                Panel Admin
              </button>
            )}

            {/* Cerrar sesión (todos) */}
            <div className="border-t border-line my-1"></div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error-soft transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
