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
      return { bg: "bg-purple-100", text: "text-purple-700", label: "Administrador" };
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
      <div className="bg-surface rounded-xl shadow-sm border border-line p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o código..."
              className="w-full pl-12 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <select className="px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
            <option>Todos los roles</option>
            <option>Administradores</option>
            <option>Trabajadores</option>
          </select>
          <select className="px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
            <option>Todas las sedes</option>
            <option>Ate</option>
            <option>Santa Anita</option>
            <option>Ambas sedes</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-medium">Total usuarios</p>
            <UserCheck className="w-5 h-5 text-faint" />
          </div>
          <p className="text-2xl font-bold text-brand">{users.length}</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-medium">Usuarios activos</p>
            <UserCheck className="w-5 h-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-success">{users.filter(u => u.status === "active").length}</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-medium">Administradores</p>
            <Shield className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === "admin").length}</p>
        </div>
        <div className="bg-surface rounded-xl shadow-sm border border-line p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted font-medium">Trabajadores</p>
            <UserCheck className="w-5 h-5 text-info" />
          </div>
          <p className="text-2xl font-bold text-cool">{users.filter(u => u.role === "worker").length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-page border-b border-line">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Sede asignada</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Último acceso</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted">Acciones</th>
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
                          user.role === "admin" ? "bg-purple-500" : "bg-cool"
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status === "active"
                          ? "bg-success-soft text-success"
                          : "bg-line-2 text-muted"
                      }`}>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-6">
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>

            <form className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted">Nombre completo</label>
                <input
                  type="text"
                  defaultValue={editingUser?.name}
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-muted">Email corporativo</label>
                <input
                  type="email"
                  defaultValue={editingUser?.email}
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="usuario@boticascentral.pe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-muted">Rol</label>
                  <select
                    defaultValue={editingUser?.role}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="worker">Trabajador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-muted">Sede</label>
                  <select
                    defaultValue={editingUser?.branch}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="ate">Ate</option>
                    <option value="santa-anita">Santa Anita</option>
                    <option value="both">Ambas sedes</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-muted">Contraseña inicial</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activeStatus"
                  defaultChecked={editingUser?.status === "active" || !editingUser}
                  className="w-5 h-5 rounded border-line text-brand focus:ring-brand"
                />
                <label htmlFor="activeStatus" className="text-sm font-semibold text-muted">
                  Usuario activo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors"
                >
                  {editingUser ? "Guardar cambios" : "Crear usuario"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-line text-muted py-3 rounded-lg font-semibold hover:bg-line-2 transition-colors"
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
