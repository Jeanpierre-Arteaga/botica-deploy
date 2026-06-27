import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, ClipboardList,
  LogOut, Menu, X, MapPin, Store,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { AccessibilityMenu } from '../components/AccessibilityMenu';

/**
 * Logo de marca ("Boticas Central — Salud y ahorro").
 * El archivo vive en `botica-frontend/public/`. Para cambiarlo basta con
 * reemplazar el PNG o editar este path (se sirve desde la raíz pública).
 */
const LOGO_SRC = '/logo-botica.png';

const navItems = [
  { to: '/staff/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/staff/pedidos',     label: 'Pedidos',      icon: ShoppingBag },
  { to: '/staff/nueva-venta', label: 'Nueva venta',  icon: ShoppingCart },
  { to: '/staff/cierre',      label: 'Cierre turno', icon: ClipboardList },
];

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        {/* Logo sobre chip claro: el PNG trae bastante aire blanco propio, así que
            el recuadro lleva ALTURA FIJA + object-cover para recortar ese margen
            vertical. Resultado: contenedor más bajo y el logo se ve más grande y
            legible (sin deformar el arte, gracias a object-cover/center). */}
        <div className="px-3 py-2.5 border-b border-white/10">
          <Link
            to="/staff/dashboard"
            className="flex items-center justify-center h-16 rounded-xl bg-white shadow-sm overflow-hidden transition-transform hover:scale-[1.02]"
            aria-label="Ir al inicio del panel"
          >
            <img
              src={LOGO_SRC}
              alt="Boticas Central — Salud y ahorro"
              className="w-full h-full object-cover object-center"
            />
          </Link>
        </div>

        {/* Tarjeta de usuario: nombre, rol y sede asignada */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full bg-brand text-white flex items-center justify-center font-bold">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.full_name}</p>
              <p className="text-slate-400 text-xs">{roleLabel}</p>
            </div>
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
            <p className="text-[11px] font-semibold uppercase tracking-wider text-faint leading-none">
              Panel de personal
            </p>
            <div className="text-lg font-bold text-text leading-tight truncate">{sectionTitle}</div>
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
              <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
                <img src={LOGO_SRC} alt="Boticas Central" className="h-7 w-auto" />
              </div>
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
              <p className="text-white font-semibold text-sm truncate">{user?.full_name}</p>
              <p className="text-slate-400 text-xs">{roleLabel}</p>
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
    </div>
  );
}
