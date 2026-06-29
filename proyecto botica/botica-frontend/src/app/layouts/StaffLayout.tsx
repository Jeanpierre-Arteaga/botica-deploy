import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, ClipboardList,
  LogOut, Menu, X, MapPin, Store, Pencil,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { AccessibilityMenu } from '../components/AccessibilityMenu';
import { ProfileModal } from '../components/ProfileModal';

/**
 * Logo de marca ("Boticas Central — Salud y ahorro").
 * - `LOGO_MARK`: versión con FONDO TRANSPARENTE (sin recuadro/halo blanco),
 *   pensada para el sidebar OSCURO. El arte ya viene con el navy exacto del
 *   panel (#0F172A), por eso se integra sin costuras sobre `bg-ink`.
 * - `LOGO_SRC`: versión con fondo propio, para el chip claro de la cabecera
 *   móvil (superficie blanca), donde el texto claro del logo necesita base.
 * Ambos viven en `botica-frontend/public/`.
 */
const LOGO_MARK = '/logo-botica-mark.png';
const LOGO_SRC = '/logo-botica.png';

const navItems = [
  { to: '/staff/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/staff/pedidos',     label: 'Pedidos',      icon: ShoppingBag },
  { to: '/staff/nueva-venta', label: 'Nueva venta',  icon: ShoppingCart },
  { to: '/staff/cierre',      label: 'Cierre turno', icon: ClipboardList },
];

export default function StaffLayout() {
  const { user, logout, getInitial } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/staff', { replace: true });
  };

  const roleLabel = user?.role === 'admin' ? 'Administrador' : 'Empleado';
  const sede = user?.location_name?.trim() || null;

  // Título de sección a partir de la ruta activa (para la topbar).
  const activeItem = navItems.find((i) => location.pathname.startsWith(i.to));
  const sectionTitle = activeItem?.label ?? 'Panel de personal';

  return (
    <div className="min-h-screen flex bg-page">
      {/* ============================================================
          SIDEBAR DESKTOP — navy, altura completa y fijo. La navegación
          hace scroll de forma independiente para que el pie (cerrar
          sesión) quede SIEMPRE visible aunque haya listas largas.
          ============================================================ */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-ink text-white h-screen sticky top-0">
        {/* Marca: logo con fondo TRANSPARENTE integrado al navy del sidebar
            (sin recuadro ni halo blanco; la estrella de Gemini se recortó del
            propio asset). Centrado, grande, con aire arriba y separado del
            bloque de usuario por el borde inferior + padding generoso. */}
        <div className="flex justify-center px-4 pt-6 pb-7 border-b border-white/10">
          <Link
            to="/staff/dashboard"
            aria-label="Ir al inicio del panel"
            className="block rounded-lg transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <img
              src={LOGO_MARK}
              alt="Boticas Central — Salud y ahorro"
              className="h-16 w-auto object-contain select-none"
              draggable={false}
            />
          </Link>
        </div>

        {/* Tarjeta de usuario: nombre, rol y sede asignada. El lápiz (editar
            perfil) queda justificado a la derecha (space-between). */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="" className="w-10 h-10 shrink-0 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-10 h-10 shrink-0 rounded-full bg-brand text-white flex items-center justify-center font-bold">
                {getInitial()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.full_name}</p>
              <p className="text-slate-400 text-xs">{roleLabel}</p>
            </div>
            <button
              onClick={() => setProfileOpen(true)}
              aria-label="Editar mi perfil"
              title="Editar mi perfil"
              className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Pencil size={15} />
            </button>
          </div>
          {sede && (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5">
              <MapPin size={14} className="shrink-0 text-brand" />
              <span className="text-[11px] font-medium text-slate-200 truncate">
                Sede: {sede}
              </span>
            </div>
          )}
        </div>

        {/* Navegación (scrollea de forma independiente) */}
        <nav className="flex-1 overflow-y-auto scroll-navy p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-brand text-white font-medium'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Pie fijo: ir a la tienda + cerrar sesión (con texto), siempre visible */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/"
            aria-label="Ir a la tienda (web pública)"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <Store size={18} className="shrink-0" />
            Ir a la tienda
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-error/15 hover:text-[#FCA5A5] transition-colors focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <LogOut size={18} className="shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ============================================================
          COLUMNA DE CONTENIDO
          ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar desktop — superficie clara con la sección y la sede */}
        <header
          className="hidden lg:flex sticky top-0 z-20 items-center justify-between gap-4 h-16 px-6 border-b border-line"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--c-surface) 88%, transparent)',
            backdropFilter: 'saturate(180%) blur(8px)',
            WebkitBackdropFilter: 'saturate(180%) blur(8px)',
          }}
        >
          <div className="min-w-0">
            <p className="text-base font-bold uppercase tracking-[0.12em] text-muted leading-none">
              Panel de personal
            </p>
          </div>
          <div className="flex items-center gap-3">
            {sede && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-page px-3 py-1.5 text-xs font-semibold text-muted">
                <MapPin size={14} className="text-brand" />
                Sede: <span className="text-text">{sede}</span>
              </span>
            )}
            <AccessibilityMenu variant="light" align="right" />
          </div>
        </header>

        {/* Header móvil — claro, con logo en chip */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-surface border-b border-line">
          <Link to="/staff/dashboard" className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
            <img src={LOGO_SRC} alt="Boticas Central" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-1">
            <AccessibilityMenu variant="light" align="right" />
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
              className="flex items-center justify-center w-10 h-10 rounded-xl text-ink-2 hover:bg-line-2 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Área de contenido con fondo de puntos sutil */}
        <main className="flex-1 bg-app-canvas">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ============================================================
          DRAWER MÓVIL
          ============================================================ */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="w-72 max-w-[85%] h-full bg-ink text-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
              <img src={LOGO_MARK} alt="Boticas Central" className="h-11 w-auto object-contain select-none" draggable={false} />
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Cerrar menú"
                className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Usuario + sede */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="" className="w-9 h-9 shrink-0 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="w-9 h-9 shrink-0 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">
                    {getInitial()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{user?.full_name}</p>
                  <p className="text-slate-400 text-xs">{roleLabel}</p>
                </div>
                <button
                  onClick={() => { setSidebarOpen(false); setProfileOpen(true); }}
                  aria-label="Editar mi perfil"
                  title="Editar mi perfil"
                  className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Pencil size={15} />
                </button>
              </div>
              {sede && (
                <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5">
                  <MapPin size={14} className="shrink-0 text-brand" />
                  <span className="text-[11px] font-medium text-slate-200 truncate">
                    Sede: {sede}
                  </span>
                </div>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto scroll-navy p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-brand text-white font-medium'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-3 border-t border-white/10 space-y-1">
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                aria-label="Ir a la tienda (web pública)"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Store size={18} className="shrink-0" />
                Ir a la tienda
              </Link>
              <button
                onClick={() => { setSidebarOpen(false); handleLogout(); }}
                aria-label="Cerrar sesión"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-error/15 hover:text-[#FCA5A5] transition-colors"
              >
                <LogOut size={18} className="shrink-0" />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Modal de perfil propio (editar datos / foto / contraseña / desactivar) */}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  );
}
