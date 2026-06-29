import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router';
import {
  Home,
  Package,
  Warehouse,
  ShoppingBag,
  Users,
  BarChart3,
  LogOut,
  Store,
  Menu,
  X,
  CalendarDays,
  MapPin,
  Pencil,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useAdminScope } from '../lib/AdminScopeContext';
import { AccessibilityMenu } from '../components/AccessibilityMenu';
import { AdminNotificationsBell } from '../components/AdminNotificationsBell';
import { ProfileModal } from '../components/ProfileModal';
import { formatLimaDate } from '../lib/dates';

/**
 * Mismo logo de marca que el panel de personal (idéntico tratamiento).
 * - `LOGO_MARK`: versión TRANSPARENTE (sin recuadro/halo blanco) para el
 *   sidebar OSCURO; el arte ya viene con el navy exacto del panel y se integra
 *   sin costuras sobre `bg-ink`.
 * - `LOGO_SRC`: versión con fondo propio para el chip claro de la cabecera
 *   móvil. Ambos viven en `botica-frontend/public/`.
 */
const LOGO_MARK = '/logo-botica-mark.png';
const LOGO_SRC = '/logo-botica.png';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const menuSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'GENERAL',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: Home }],
  },
  {
    label: 'INVENTARIO',
    items: [
      { to: '/admin/productos', label: 'Gestión de Productos', icon: Package },
      { to: '/admin/stock', label: 'Control de Stock', icon: Warehouse },
    ],
  },
  {
    label: 'OPERACIONES',
    items: [
      { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
      { to: '/admin/usuarios', label: 'Gestión de Usuarios', icon: Users },
    ],
  },
  {
    label: 'REPORTES',
    items: [{ to: '/admin/reportes', label: 'Ventas y Rotación', icon: BarChart3 }],
  },
];

const allItems = menuSections.flatMap((s) => s.items);

export function AdminLayout() {
  const { user, logout, getInitial } = useAuth();
  const { scopeLabel } = useAdminScope();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Reloj/fecha en hora de Perú (refresca cada minuto).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  // Título de la sección activa (para la topbar). startsWith cubre los
  // detalles anidados (p. ej. /admin/pedidos/:id).
  const activeItem = allItems.find((i) => location.pathname.startsWith(i.to));
  const sectionTitle = activeItem?.label ?? 'Panel administrativo';

  return (
    <div className="min-h-screen flex bg-page">
      {/* ============================================================
          SIDEBAR DESKTOP — navy, altura completa y fijo. La navegación
          scrollea de forma independiente para que el pie (ir a la web /
          cerrar sesión) quede SIEMPRE visible.
          ============================================================ */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-ink text-white h-screen sticky top-0">
        {/* Marca: logo con fondo TRANSPARENTE integrado al navy del sidebar
            (sin recuadro ni halo blanco; la estrella de Gemini se recortó del
            propio asset). Centrado, grande, con aire arriba y separado del
            bloque de usuario por el borde inferior + padding generoso. */}
        <div className="flex justify-center px-4 pt-6 pb-7 border-b border-white/10">
          <Link
            to="/admin/dashboard"
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

        {/* Identidad del admin: nombre, rol y alcance "Ambas sedes". El lápiz
            (editar perfil) queda justificado a la derecha (space-between). */}
        <div className="px-3 pt-5 pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="" className="w-9 h-9 shrink-0 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-9 h-9 shrink-0 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">
                {getInitial()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate leading-tight">
                {user?.full_name ?? '—'}
              </p>
              <p className="text-slate-400 text-xs">Administrador</p>
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
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1">
            <MapPin size={13} className="shrink-0 text-brand" />
            <span className="text-[11px] font-medium text-slate-200 truncate">
              {scopeLabel}
            </span>
          </div>
        </div>

        {/* Navegación agrupada. flex-1 + min-h-0 para que el pie quede abajo sin
            scrollbar en pantallas normales; en pantallas muy bajas, scrollea. */}
        <nav className="flex-1 min-h-0 overflow-y-auto scroll-navy px-3 py-3 space-y-3.5">
          {menuSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-brand text-white font-medium'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      <Icon size={18} className="shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Pie fijo: ir a la web + cerrar sesión (idéntico a staff) */}
        <div className="px-3 py-2.5 border-t border-white/10 space-y-1">
          <Link
            to="/"
            aria-label="Ir a la tienda (web pública)"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <Store size={18} className="shrink-0" />
            Ir a la web
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-error/15 hover:text-[#FCA5A5] transition-colors focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
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
        {/* Topbar desktop — superficie clara con sección, selector de sede,
            accesibilidad, campana y fecha de Lima */}
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
              Panel administrativo
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SedeSegmented />
            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-line bg-page px-3 py-1.5 text-xs font-medium text-muted">
              <CalendarDays size={14} className="text-brand" />
              {formatLimaDate(now)}
            </span>
            <AccessibilityMenu variant="light" align="right" />
            <AdminNotificationsBell />
          </div>
        </header>

        {/* Header móvil — claro, con logo en chip + acciones */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-surface border-b border-line">
          <Link
            to="/admin/dashboard"
            className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm"
          >
            <img src={LOGO_SRC} alt="Boticas Central" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-1">
            <AccessibilityMenu variant="light" align="right" />
            <AdminNotificationsBell />
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
              className="flex items-center justify-center w-10 h-10 rounded-xl text-ink-2 hover:bg-line-2 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Selector de sede en móvil (la topbar desktop ya lo tiene) */}
        <div className="lg:hidden px-4 py-2.5 bg-surface border-b border-line overflow-x-auto">
          <SedeSegmented />
        </div>

        {/* Área de contenido con fondo de puntos sutil (igual que staff) */}
        <main className="flex-1 bg-app-canvas">
          <Outlet />
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

            {/* Identidad */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="" className="w-9 h-9 shrink-0 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="w-9 h-9 shrink-0 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">
                    {getInitial()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{user?.full_name ?? '—'}</p>
                  <p className="text-slate-400 text-xs">Administrador</p>
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
              <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5">
                <MapPin size={14} className="shrink-0 text-brand" />
                <span className="text-[11px] font-medium text-slate-200 truncate">
                  {scopeLabel}
                </span>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto scroll-navy p-4 space-y-5">
              {menuSections.map((section) => (
                <div key={section.label}>
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {section.label}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
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
                          <Icon size={18} className="shrink-0" />
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-3 border-t border-white/10 space-y-1">
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                aria-label="Ir a la tienda (web pública)"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Store size={18} className="shrink-0" />
                Ir a la web
              </Link>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  handleLogout();
                }}
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

/**
 * Selector de sede (segmented control). Fija el alcance global del admin
 * que consumen Dashboard, Control de Stock y la campana. "Ambas sedes"
 * (null) primero, luego cada sede activa.
 */
function SedeSegmented() {
  const { locations, selectedLocationId, setScope } = useAdminScope();

  const options: { id: number | null; label: string }[] = [
    { id: null, label: 'Ambas sedes' },
    ...locations.map((l) => ({ id: l.location_id, label: l.location_name })),
  ];

  return (
    <div
      role="group"
      aria-label="Filtrar por sede"
      className="inline-flex items-center gap-1 rounded-full border border-line bg-page p-1"
    >
      {options.map((opt) => {
        const active = (opt.id ?? null) === (selectedLocationId ?? null);
        return (
          <button
            key={opt.id ?? 'both'}
            type="button"
            onClick={() => setScope(opt.id)}
            aria-pressed={active}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${
              active
                ? 'bg-brand text-white shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
