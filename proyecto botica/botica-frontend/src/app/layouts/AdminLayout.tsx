import { Outlet, Link, useLocation } from "react-router";
import { Home, Package, Warehouse, ShoppingBag, Users, BarChart3, Bell } from "lucide-react";
import { useState } from "react";
import { NotificationPanel } from "../components/NotificationPanel";
import { UserMenu } from "../components/UserMenu";
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
    <div className="flex h-screen bg-[#F1F5F9]">
      {/* Left Sidebar */}
      <aside className="w-[260px] bg-[#0F172A] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <img
            src="/src/imports/Gemini_Generated_Image_o2t61no2t61no2t6-1.png"
            alt="Boticas Central"
            className="h-16 w-auto"
          />
        </div>

        {/* Owner Info */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-[#FF6633] flex items-center justify-center text-white font-bold text-lg">
              {getInitial()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">
                {user?.full_name ?? '—'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-[#FF6633] text-white px-2.5 py-1 rounded-full font-medium">
              Administrador
            </span>
            <span className="text-xs bg-[#3AAB4A] text-white px-2.5 py-1 rounded-full font-medium">
              Ambas sedes
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <p className="text-gray-400 text-xs font-semibold mb-2 px-3 uppercase tracking-wider">
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
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-[#1E293B] text-white border-l-4 border-[#FF6633] pl-3'
                          : 'text-gray-300 hover:bg-[#1E293B] hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/10">
          <p className="text-gray-400 text-xs">Última sesión: 20 Abr · 09:00 AM</p>
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
