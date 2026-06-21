import { Outlet, Link, useLocation } from "react-router";
import { Home, Package, Warehouse, ShoppingBag, Users, BarChart3, Bell } from "lucide-react";
import { useState } from "react";
import { NotificationPanel } from "../components/NotificationPanel";
import { UserMenu } from "../components/UserMenu";
import { AccessibilityMenu } from "../components/AccessibilityMenu";
import { useAuth } from "../lib/AuthContext";

export function AdminLayout() {
  const location = useLocation();
  const { user, getInitial } = useAuth();
  const [activeBranch, setActiveBranch] = useState<"both" | "ate" | "santa-anita">("both");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "warning" as const,
      title: "Stock crítico",
      message: "Paracetamol 500mg tiene solo 5 unidades en Ate",
      time: "Hace 5 min",
      read: false,
    },
    {
      id: "2",
      type: "order" as const,
      title: "Nuevo pedido web",
      message: "Pedido #0045 recibido - S/ 145.50",
      time: "Hace 15 min",
      read: false,
    },
    {
      id: "3",
      type: "success" as const,
      title: "Reposición completada",
      message: "Vitamina C 1000mg - Santa Anita",
      time: "Hace 1 hora",
      read: false,
    },
    {
      id: "4",
      type: "info" as const,
      title: "Reporte mensual disponible",
      message: "El reporte de ventas de marzo está listo",
      time: "Hace 2 horas",
      read: true,
    },
    {
      id: "5",
      type: "warning" as const,
      title: "Usuario inactivo",
      message: "Luis Mendoza no ha iniciado sesión en 7 días",
      time: "Hace 3 horas",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const menuSections = [
    {
      label: "GENERAL",
      items: [
        { path: "/admin/dashboard", icon: Home, label: "Dashboard" },
      ],
    },
    {
      label: "INVENTARIO",
      items: [
        { path: "/admin/productos", icon: Package, label: "Gestión de Productos" },
        { path: "/admin/stock", icon: Warehouse, label: "Control de Stock" },
      ],
    },
    {
      label: "OPERACIONES",
      items: [
        { path: "/admin/pedidos", icon: ShoppingBag, label: "Pedidos Web" },
        { path: "/admin/usuarios", icon: Users, label: "Gestión de Usuarios" },
      ],
    },
    {
      label: "REPORTES",
      items: [
        { path: "/admin/reportes", icon: BarChart3, label: "Ventas y Rotación" },
      ],
    },
  ];

  const today = new Date();
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dateStr = `${days[today.getDay()]} ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="flex h-screen bg-page">
      {/* Left Sidebar */}
      <aside className="w-[276px] bg-ink flex flex-col border-r border-white/5 shadow-[8px_0_32px_-16px_rgba(15,23,42,0.45)]">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/[0.07]">
          <img
            src="/src/imports/Gemini_Generated_Image_o2t61no2t61no2t6-1.png"
            alt="Boticas Central"
            className="h-16 w-auto"
          />
        </div>

        {/* Owner Info */}
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_14px_-2px_rgba(241,90,41,0.5)] ring-2 ring-white/10">
              {getInitial()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate leading-tight">
                {user?.full_name ?? '—'}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">Panel administrativo</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-[11px] bg-brand/15 text-brand border border-brand/25 px-2.5 py-1 rounded-full font-semibold">
              Administrador
            </span>
            <span className="text-[11px] bg-success/15 text-emerald-300 border border-success/25 px-2.5 py-1 rounded-full font-semibold">
              Ambas sedes
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3.5 py-5 overflow-y-auto scroll-navy">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-7">
              <p className="text-slate-500 text-[10px] font-bold mb-2.5 px-3.5 uppercase tracking-[0.14em]">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-brand/[0.18] via-brand/[0.06] to-transparent text-white'
                          : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-brand shadow-[0_0_12px_rgba(241,90,41,0.7)]" />
                      )}
                      <Icon
                        className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                          isActive ? 'text-brand' : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="px-5 py-4 border-t border-white/[0.07]">
          <p className="text-slate-500 text-xs">Última sesión: 20 Abr · 09:00 AM</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-[#1E293B] h-16 flex items-center justify-between px-6">
          <h1 className="font-bold text-lg text-white">
            {menuSections.flatMap(s => s.items).find(item => item.path === location.pathname)?.label || 'Panel Administrativo'}
          </h1>

          <div className="flex items-center gap-4">
            {/* Branch Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveBranch("both")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeBranch === "both"
                    ? 'bg-[#FF6633] text-white'
                    : 'bg-[#0F172A] text-gray-300 hover:text-white'
                }`}
              >
                Ambas sedes
              </button>
              <button
                onClick={() => setActiveBranch("ate")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeBranch === "ate"
                    ? 'bg-[#FF6633] text-white'
                    : 'bg-[#0F172A] text-gray-300 hover:text-white'
                }`}
              >
                Ate
              </button>
              <button
                onClick={() => setActiveBranch("santa-anita")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeBranch === "santa-anita"
                    ? 'bg-[#FF6633] text-white'
                    : 'bg-[#0F172A] text-gray-300 hover:text-white'
                }`}
              >
                Santa Anita
              </button>
            </div>

            {/* Accesibilidad */}
            <AccessibilityMenu variant="dark" />

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 hover:bg-[#0F172A] rounded-full transition-colors"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF6633] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Date */}
            <span className="text-white text-sm">{dateStr}</span>

            <UserMenu variant="dark" showName={false} />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  );
}
