import { Link, useLocation } from "react-router";
import { LucideIcon, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useState } from "react";
import image_botica_icono from "@/imports/botica_icono.jpeg";

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  to: string;
}

interface SidebarProps {
  items: SidebarItem[];
  userRole: "staff" | "admin";
}

export function Sidebar({ items, userRole }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (to: string) => {
    return location.pathname === to;
  };

  return (
    <aside
      className={`bg-surface border-r border-line h-screen sticky top-0 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-line flex items-center justify-between">
        {!isCollapsed && (
          <img
            src={image_botica_icono}
            alt="Boticas Central"
            className="h-10 w-auto"
          />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-[10px] hover:bg-surface-2 text-muted transition-colors ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all relative group ${
                active
                  ? "bg-brand-soft text-brand-hover"
                  : "text-muted hover:bg-surface-2"
              }`}
            >
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand rounded-r-full" />
              )}
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "" : "group-hover:text-brand"}`} />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-line">
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center text-brand font-semibold">
            {userRole === "admin" ? "A" : "S"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">
                {userRole === "admin" ? "Administrador" : "Staff"}
              </p>
              <p className="text-xs text-faint">
                {userRole === "admin" ? "Admin" : "Vendedor"}
              </p>
            </div>
          )}
        </div>
        <button
          className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-[10px] text-error hover:bg-error-soft transition-colors w-full ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="text-sm font-medium">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
