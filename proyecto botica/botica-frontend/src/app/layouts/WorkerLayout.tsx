import { Outlet, Link, useLocation } from "react-router";
import { Home, ShoppingCart, Package, DollarSign, Bell, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationPanel } from "../components/NotificationPanel";
import { UserMenu } from "../components/UserMenu";
import { useAuth } from "../lib/AuthContext";

export function WorkerLayout() {
  const location = useLocation();
  const { user, getInitial } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "order" as const,
      title: "Nuevo pedido web",
      message: "Pedido #0045 pendiente de preparar",
      time: "Hace 10 min",
      read: false,
    },
    {
      id: "2",
      type: "warning" as const,
      title: "Stock bajo",
      message: "Paracetamol 500mg - Solo quedan 5 unidades",
      time: "Hace 30 min",
      read: false,
    },
    {
      id: "3",
      type: "info" as const,
      title: "Recordatorio",
      message: "Cierre de caja a las 18:00",
      time: "Hace 1 hora",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const menuItems = [
    { path: "/staff/dashboard", icon: Home, label: "Dashboard" },
    { path: "/staff/nueva-venta", icon: ShoppingCart, label: "Nueva Venta" },
    { path: "/staff/pedidos", icon: Package, label: "Pedidos Web" },
    { path: "/staff/cierre", icon: DollarSign, label: "Cierre de Caja" },
  ];

  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} · ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      {/* Left Sidebar */}
      <aside className="w-60 bg-[#1E293B] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <img
            src="/src/imports/Gemini_Generated_Image_o2t61no2t61no2t6-1.png"
            alt="Boticas Central"
            className="h-16 w-auto"
          />
        </div>

        {/* Worker Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FF6633] flex items-center justify-center text-white font-bold">
              {getInitial()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">
                {user?.full_name ?? '—'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-[#2B7DBF] text-white px-2 py-1 rounded-full">
              Personal
            </span>
            {user?.location_id != null && (
              <span className="text-xs bg-[#3AAB4A] text-white px-2 py-1 rounded-full">
                {user.location_id === 1 ? 'Sede Ate' : user.location_id === 2 ? 'Sede Santa Anita' : `Sede ${user.location_id}`}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#2D3F55] text-white border-l-4 border-[#FF6633]'
                      : 'text-gray-300 hover:bg-[#2D3F55] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/10">
          <p className="text-gray-400 text-xs">Turno iniciado: 08:00 AM</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="font-bold text-lg text-[#1A1A1A]">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Panel de Trabajadores'}
          </h1>

          <div className="flex items-center gap-4">
            {user?.location_id != null && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <MapPin className="w-4 h-4 text-[#3AAB4A]" />
                <span className="text-sm font-medium">
                  {user.location_id === 1 ? 'Sede Ate' : user.location_id === 2 ? 'Sede Santa Anita' : `Sede ${user.location_id}`}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-600">{formatDate(currentTime)}</span>
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF6633] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <UserMenu variant="light" showName={false} />
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
