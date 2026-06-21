import { Search, Plus, Edit2, Trash2, UserCheck, Shield, Lock } from "lucide-react";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "worker";
  branch: "ate" | "santa-anita" | "both";
  status: "active" | "inactive";
  lastLogin: string;
}

export function GestionUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const users: User[] = [
    {
      id: "USR-001",
      name: "Jorge Pérez",
      email: "jorge.perez@boticascentral.pe",
      role: "admin",
      branch: "both",
      status: "active",
      lastLogin: "21 Abr 2026, 14:30",
    },
    {
      id: "USR-002",
      name: "Carlos Quispe",
      email: "carlos.quispe@boticascentral.pe",
      role: "worker",
      branch: "ate",
      status: "active",
      lastLogin: "21 Abr 2026, 08:15",
    },
    {
      id: "USR-003",
      name: "Ana Torres",
      email: "ana.torres@boticascentral.pe",
      role: "worker",
      branch: "santa-anita",
      status: "active",
      lastLogin: "21 Abr 2026, 08:00",
    },
    {
      id: "USR-004",
      name: "Luis Mendoza",
      email: "luis.mendoza@boticascentral.pe",
      role: "worker",
      branch: "ate",
      status: "inactive",
      lastLogin: "15 Abr 2026, 17:45",
    },
  ];

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return { bg: "bg-violet-soft", text: "text-violet", label: "Administrador" };
    }
    return { bg: "bg-info-soft", text: "text-info", label: "Trabajador" };
  };

  const getBranchBadge = (branch: string) => {
    if (branch === "both") return { bg: "bg-success-soft", text: "text-success", label: "Ambas sedes" };
    if (branch === "ate") return { bg: "bg-brand-soft", text: "text-brand", label: "Ate" };
    return { bg: "bg-info-soft", text: "text-info", label: "Santa Anita" };
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Gestión de Usuarios</h1>
          <p className="text-sm text-muted">Administra los accesos y permisos del personal</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-brand text-white px-5 py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o código..."
              className="w-full pl-12 pr-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
            />
          </div>
          <select className="px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors">
            <option>Todos los roles</option>
            <option>Administradores</option>
            <option>Trabajadores</option>
          </select>
          <select className="px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors">
            <option>Todas las sedes</option>
            <option>Ate</option>
            <option>Santa Anita</option>
            <option>Ambas sedes</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <UserStat icon={UserCheck} label="Total usuarios" value={users.length} accent="#F15A29" index={0} />
        <UserStat icon={UserCheck} label="Usuarios activos" value={users.filter(u => u.status === "active").length} accent="#16A34A" index={1} />
        <UserStat icon={Shield} label="Administradores" value={users.filter(u => u.role === "admin").length} accent="#8B6FC9" index={2} />
        <UserStat icon={UserCheck} label="Trabajadores" value={users.filter(u => u.role === "worker").length} accent="#4C82A8" index={3} />
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-2xl shadow-soft border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-page border-b border-line">
              <tr>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Usuario</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Email</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Rol</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Sede asignada</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Estado</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Último acceso</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                const branchBadge = getBranchBadge(user.branch);
                return (
                  <tr key={user.id} className="border-b border-line hover:bg-page transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          user.role === "admin" ? "bg-violet" : "bg-cool"
                        }`}>
                          {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-text">{user.name}</p>
                          <p className="text-xs text-muted font-mono">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge.bg} ${roleBadge.text}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${branchBadge.bg} ${branchBadge.text}`}>
                        {branchBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.status === "active"
                          ? "bg-success-soft text-success"
                          : "bg-line-2 text-muted"
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{user.lastLogin}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 hover:bg-info-soft rounded-lg transition-colors group"
                        >
                          <Edit2 className="w-4 h-4 text-muted group-hover:text-cool" />
                        </button>
                        <button className="p-2 hover:bg-warning-soft rounded-lg transition-colors group">
                          <Lock className="w-4 h-4 text-muted group-hover:text-warning" />
                        </button>
                        <button className="p-2 hover:bg-error-soft rounded-lg transition-colors group">
                          <Trash2 className="w-4 h-4 text-muted group-hover:text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-pop border border-line p-8 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-text">
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
            </div>

            <form className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Nombre completo</label>
                <input
                  type="text"
                  defaultValue={editingUser?.name}
                  className="w-full px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Email corporativo</label>
                <input
                  type="email"
                  defaultValue={editingUser?.email}
                  className="w-full px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  placeholder="usuario@boticascentral.pe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text">Rol</label>
                  <select
                    defaultValue={editingUser?.role}
                    className="w-full px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  >
                    <option value="worker">Trabajador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text">Sede</label>
                  <select
                    defaultValue={editingUser?.branch}
                    className="w-full px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                  >
                    <option value="ate">Ate</option>
                    <option value="santa-anita">Santa Anita</option>
                    <option value="both">Ambas sedes</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text">Contraseña inicial</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-page border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 bg-page border border-line rounded-lg px-4 py-3">
                <input
                  type="checkbox"
                  id="activeStatus"
                  defaultChecked={editingUser?.status === "active" || !editingUser}
                  className="w-5 h-5 rounded border-line text-brand focus:ring-brand accent-[var(--c-brand)]"
                />
                <label htmlFor="activeStatus" className="text-sm font-semibold text-text">
                  Usuario activo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-hover active:scale-[0.99] transition-all"
                >
                  {editingUser ? "Guardar cambios" : "Crear usuario"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-page text-muted border border-line py-3 rounded-lg font-semibold hover:bg-line-2 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UserStat({
  icon: Icon, label, value, accent, index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
  index: number;
}) {
  return (
    <div
      className="animate-panel relative overflow-hidden bg-surface rounded-2xl shadow-soft border border-line p-5 hover:shadow-card hover:-translate-y-0.5 transition-all"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="absolute left-0 top-0 h-full w-1 rounded-r" style={{ backgroundColor: accent }} />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon className="w-[22px] h-[22px]" />
      </div>
      <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-[26px] lg:text-[28px] leading-none font-bold text-text tabular-nums">{value}</p>
    </div>
  );
}
