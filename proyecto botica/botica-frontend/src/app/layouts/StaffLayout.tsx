import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router';
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, ClipboardList,
  LogOut, Menu, X, Building2,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const navItems = [
  { to: '/staff/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/staff/pedidos',     label: 'Pedidos web',  icon: ShoppingBag },
  { to: '/staff/nueva-venta', label: 'Nueva venta',  icon: ShoppingCart },
  { to: '/staff/cierre',      label: 'Cierre turno', icon: ClipboardList },
];

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/staff', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1A1F2E] text-white">
        <div className="p-6 border-b border-[#2A2F3E]">
          <Link to="/staff/dashboard" className="flex items-center gap-2">
            <Building2 className="text-[#F26430]" size={24} />
            <div>
              <p className="font-bold text-lg leading-tight">Botica Central</p>
              <p className="text-xs text-gray-400">Panel staff</p>
            </div>
          </Link>
        </div>

        <div className="p-4 border-b border-[#2A2F3E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F26430] flex items-center justify-center font-bold">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">
                {user?.role === 'admin' ? 'Administrador' : 'Empleado'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-[#F26430] text-white font-medium'
                      : 'text-gray-300 hover:bg-[#2A2F3E] hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2A2F3E]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-300 hover:bg-[#2A2F3E] hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#1A1F2E] text-white px-4 py-3 flex items-center justify-between">
        <Link to="/staff/dashboard" className="flex items-center gap-2">
          <Building2 className="text-[#F26430]" size={20} />
          <span className="font-bold">Botica Central</span>
        </Link>
        <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <Menu size={24} />
        </button>
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="w-64 h-full bg-[#1A1F2E] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#2A2F3E] flex items-center justify-between">
              <span className="font-bold">Menú</span>
              <button onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
                <X size={24} />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm ${
                        isActive ? 'bg-[#F26430] text-white font-medium' : 'text-gray-300'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
              <button
                onClick={() => { setSidebarOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-300"
              >
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden mt-14 lg:mt-0">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
