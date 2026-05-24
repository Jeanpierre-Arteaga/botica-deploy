import { Link } from "react-router";
import { ShoppingCart, Package, AlertTriangle, Banknote, Eye, PackageOpen } from "lucide-react";

export function WorkerDashboard() {
  const stats = [
    {
      icon: ShoppingCart,
      iconColor: "#FF6633",
      value: "S/ 0.00",
      label: "Ventas registradas hoy",
      subtext: "0 transacciones",
      subtextColor: "#003366",
    },
    {
      icon: Package,
      iconColor: "#F59E0B",
      value: "3",
      label: "Pedidos por atender",
      link: { text: "Ver pedidos →", to: "/staff/pedidos" },
    },
    {
      icon: AlertTriangle,
      iconColor: "#F59E0B",
      value: "5 productos",
      label: "Alertas de stock bajo",
      link: { text: "Revisar →", to: "/staff/stock" },
    },
    {
      icon: Banknote,
      iconColor: "#3AAB4A",
      value: "S/ 0.00",
      label: "Efectivo acumulado",
      subtext: "Yape: S/ 0.00",
      subtextColor: "#6B7280",
    },
  ];

  const recentSales: any[] = [];

  const pendingOrders = [
    { id: "#0001", client: "Juan Pérez", products: "Paracetamol x2, Vitamina C x1", status: "Pendiente" },
    { id: "#0002", client: "María López", products: "Ibuprofeno x1, Omeprazol x2", status: "Pendiente" },
    { id: "#0003", client: "Carlos Ruiz", products: "Amoxicilina x3", status: "Pendiente" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#FF6633] to-[#E85522] rounded-xl p-8 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl mb-2">Buenos días, Carlos</h2>
          <p className="text-white/90">Turno activo desde las 08:00 AM</p>
        </div>
        <Link
          to="/staff/nueva-venta"
          className="bg-white text-[#FF6633] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
        >
          Registrar venta
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-8 h-8" style={{ color: stat.iconColor }} />
              </div>
              <div className="text-3xl font-extrabold mb-2" style={{ color: stat.iconColor }}>
                {stat.value}
              </div>
              <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
              {stat.subtext && (
                <p className="text-xs" style={{ color: stat.subtextColor }}>
                  {stat.subtext}
                </p>
              )}
              {stat.link && (
                <Link
                  to={stat.link.to}
                  className="text-[#003366] text-xs font-medium hover:underline inline-block mt-2"
                >
                  {stat.link.text}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-bold text-lg">Últimas ventas del turno</h3>
        </div>
        {recentSales.length === 0 ? (
          <div className="p-12 text-center">
            <PackageOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">Aún no hay ventas en este turno</p>
            <Link
              to="/staff/nueva-venta"
              className="inline-block bg-[#FF6633] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
            >
              Registrar primera venta
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Método</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8F9FA]'}>
                    <td className="px-6 py-4 text-sm">{sale.time}</td>
                    <td className="px-6 py-4 text-sm font-medium">{sale.product}</td>
                    <td className="px-6 py-4 text-sm">{sale.quantity}</td>
                    <td className="px-6 py-4 text-sm font-semibold">S/ {sale.price}</td>
                    <td className="px-6 py-4 text-sm">{sale.method}</td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-[#003366] hover:text-[#002244]">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Orders Mini List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-lg">Pedidos web recientes</h3>
          <span className="bg-[#FF6633] text-white text-xs font-bold px-3 py-1 rounded-full">
            {pendingOrders.length}
          </span>
        </div>
        <div className="divide-y divide-gray-200">
          {pendingOrders.map((order) => (
            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex-1 grid grid-cols-4 gap-4">
                <span className="font-semibold text-[#003366]">{order.id}</span>
                <span className="text-sm text-gray-900">{order.client}</span>
                <span className="text-sm text-gray-600 truncate">{order.products}</span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full self-start">
                  {order.status}
                </span>
              </div>
              <Link
                to={`/staff/pedidos/${order.id.replace('#', '')}`}
                className="ml-4 px-4 py-2 bg-[#003366] text-white text-sm rounded-lg hover:bg-[#002244] transition-colors"
              >
                Atender
              </Link>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 text-center">
          <Link
            to="/staff/pedidos"
            className="text-[#003366] text-sm font-medium hover:underline"
          >
            Ver todos los pedidos →
          </Link>
        </div>
      </div>
    </div>
  );
}
