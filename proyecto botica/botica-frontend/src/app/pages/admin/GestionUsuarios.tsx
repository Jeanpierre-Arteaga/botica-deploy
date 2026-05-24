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
    return { bg: "bg-blue-100", text: "text-blue-700", label: "Trabajador" };
  };

  const getBranchBadge = (branch: string) => {
    if (branch === "both") return { bg: "bg-green-100", text: "text-green-700", label: "Ambas sedes" };
    if (branch === "ate") return { bg: "bg-[#FFCCAA]", text: "text-[#FF6633]", label: "Ate" };
    return { bg: "bg-blue-100", text: "text-blue-700", label: "Santa Anita" };
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-600">Administra los accesos y permisos del personal</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-[#FF6633] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o código..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
            />
          </div>
          <select className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]">
            <option>Todos los roles</option>
            <option>Administradores</option>
            <option>Trabajadores</option>
          </select>
          <select className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]">
            <option>Todas las sedes</option>
            <option>Ate</option>
            <option>Santa Anita</option>
            <option>Ambas sedes</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium">Total usuarios</p>
            <UserCheck className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-[#FF6633]">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium">Usuarios activos</p>
            <UserCheck className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-[#3AAB4A]">{users.filter(u => u.status === "active").length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium">Administradores</p>
            <Shield className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === "admin").length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium">Trabajadores</p>
            <UserCheck className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-[#2B7DBF]">{users.filter(u => u.role === "worker").length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Sede asignada</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Último acceso</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                const branchBadge = getBranchBadge(user.branch);
                return (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          user.role === "admin" ? "bg-purple-500" : "bg-[#2B7DBF]"
                        }`}>
                          {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
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
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.lastLogin}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600 group-hover:text-[#2B7DBF]" />
                        </button>
                        <button className="p-2 hover:bg-amber-50 rounded-lg transition-colors group">
                          <Lock className="w-4 h-4 text-gray-600 group-hover:text-amber-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors group">
                          <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
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
          <div className="bg-white rounded-xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-6">
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>

            <form className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Nombre completo</label>
                <input
                  type="text"
                  defaultValue={editingUser?.name}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Email corporativo</label>
                <input
                  type="email"
                  defaultValue={editingUser?.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                  placeholder="usuario@boticascentral.pe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Rol</label>
                  <select
                    defaultValue={editingUser?.role}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                  >
                    <option value="worker">Trabajador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Sede</label>
                  <select
                    defaultValue={editingUser?.branch}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                  >
                    <option value="ate">Ate</option>
                    <option value="santa-anita">Santa Anita</option>
                    <option value="both">Ambas sedes</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Contraseña inicial</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activeStatus"
                  defaultChecked={editingUser?.status === "active" || !editingUser}
                  className="w-5 h-5 rounded border-gray-300 text-[#FF6633] focus:ring-[#FF6633]"
                />
                <label htmlFor="activeStatus" className="text-sm font-semibold text-gray-700">
                  Usuario activo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-[#FF6633] text-white py-3 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
                >
                  {editingUser ? "Guardar cambios" : "Crear usuario"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
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
