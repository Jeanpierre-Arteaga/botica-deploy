import { Link } from "react-router";
import { Eye, Clock, CheckCircle2, XCircle, Package } from "lucide-react";
import { useState } from "react";

interface Order {
  id: string;
  date: string;
  time: string;
  client: string;
  dni: string;
  products: string;
  total: number;
  branch: "ate" | "santa-anita";
  status: "pendiente" | "entregado" | "cancelado";
}

const mockOrders: Order[] = [
  {
    id: "0001",
    date: "21 Abr",
    time: "14:30",
    client: "Juan Pérez",
    dni: "12345678",
    products: "Paracetamol x2, Vitamina C x1",
    total: 43.90,
    branch: "ate",
    status: "pendiente",
  },
  {
    id: "0002",
    date: "21 Abr",
    time: "13:15",
    client: "María López",
    dni: "87654321",
    products: "Ibuprofeno x1, Omeprazol x2",
    total: 63.90,
    branch: "ate",
    status: "pendiente",
  },
  {
    id: "0003",
    date: "21 Abr",
    time: "12:00",
    client: "Carlos Ruiz",
    dni: "45678912",
    products: "Amoxicilina x3",
    total: 75.00,
    branch: "santa-anita",
    status: "entregado",
  },
  {
    id: "0004",
    date: "20 Abr",
    time: "18:45",
    client: "Ana Torres",
    dni: "78945612",
    products: "Loratadina x2, Cetirizina x1",
    total: 46.90,
    branch: "ate",
    status: "cancelado",
  },
];

export function PedidosWeb() {
  const [activeTab, setActiveTab] = useState<"todos" | "pendiente" | "entregado" | "cancelado">("todos");

  const filteredOrders = activeTab === "todos"
    ? mockOrders
    : mockOrders.filter(order => order.status === activeTab);

  const counts = {
    todos: mockOrders.length,
    pendiente: mockOrders.filter(o => o.status === "pendiente").length,
    entregado: mockOrders.filter(o => o.status === "entregado").length,
    cancelado: mockOrders.filter(o => o.status === "cancelado").length,
  };

  const getStatusPill = (status: Order["status"]) => {
    const configs = {
      pendiente: {
        style: "bg-amber-100 text-amber-800",
        icon: Clock,
        label: "Pendiente"
      },
      entregado: {
        style: "bg-green-100 text-green-800",
        icon: CheckCircle2,
        label: "Entregado"
      },
      cancelado: {
        style: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Cancelado"
      },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${config.style}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between border-b border-gray-200">
          <div className="flex">
            {(['todos', 'pendiente', 'entregado', 'cancelado'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold text-sm relative transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-[#FF6633] border-b-2 border-[#FF6633]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
                <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 px-6">
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Todas las sedes</option>
              <option value="ate">Ate</option>
              <option value="santa-anita">Santa Anita</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No hay pedidos en este estado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"># Pedido</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Productos</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sede</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order, index) => (
                  <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8F9FA]'}>
                    <td className="px-6 py-4">
                      <Link
                        to={`/staff/pedidos/${order.id}`}
                        className="text-[#003366] font-bold hover:underline"
                      >
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.date} · {order.time}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{order.client}</div>
                        <div className="text-gray-500 text-xs">DNI: {order.dni}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {order.products}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      S/ {order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs border border-[#003366] text-[#003366] px-2 py-1 rounded-full">
                        {order.branch === "ate" ? "Ate" : "Santa Anita"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusPill(order.status)}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/staff/pedidos/${order.id}`}
                        className="text-[#003366] hover:text-[#002244] transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
            <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Anterior
            </button>
            <button className="px-4 py-2 text-sm bg-[#FF6633] text-white rounded-lg font-medium">
              1
            </button>
            <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              2
            </button>
            <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
