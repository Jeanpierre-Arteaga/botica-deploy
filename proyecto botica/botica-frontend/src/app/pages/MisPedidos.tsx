import { Link } from "react-router";
import { Package, Clock, CheckCircle, XCircle, ChevronRight, MapPin } from "lucide-react";
import { useState } from "react";

interface Order {
  id: string;
  date: string;
  status: "pending" | "processing" | "delivered" | "cancelled";
  total: number;
  items: number;
  branch: "ate" | "santa-anita";
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export function MisPedidos() {
  const [orders] = useState<Order[]>([
    {
      id: "PED-0045",
      date: "21 Abr 2026, 14:30",
      status: "processing",
      total: 145.50,
      items: 3,
      branch: "ate",
      products: [
        { name: "Paracetamol 500mg x 100 tabletas", quantity: 2, price: 25.00 },
        { name: "Vitamina C 1000mg x 60 tabletas", quantity: 1, price: 35.00 },
        { name: "Ibuprofeno 400mg x 50 cápsulas", quantity: 1, price: 18.90 },
      ],
    },
    {
      id: "PED-0042",
      date: "18 Abr 2026, 10:15",
      status: "delivered",
      total: 89.90,
      items: 2,
      branch: "santa-anita",
      products: [
        { name: "Omeprazol 20mg x 30 cápsulas", quantity: 2, price: 22.50 },
        { name: "Loratadina 10mg x 20 tabletas", quantity: 3, price: 15.00 },
      ],
    },
    {
      id: "PED-0038",
      date: "12 Abr 2026, 16:45",
      status: "delivered",
      total: 62.00,
      items: 2,
      branch: "ate",
      products: [
        { name: "Complejo B x 100 cápsulas", quantity: 1, price: 28.00 },
        { name: "Diclofenaco 50mg x 30 tabletas", quantity: 1, price: 19.50 },
      ],
    },
    {
      id: "PED-0035",
      date: "08 Abr 2026, 11:20",
      status: "cancelled",
      total: 125.00,
      items: 3,
      branch: "ate",
      products: [
        { name: "Amoxicilina 500mg x 30 cápsulas", quantity: 2, price: 25.00 },
        { name: "Metformina 850mg x 60 tabletas", quantity: 1, price: 32.00 },
      ],
    },
  ]);

  const getStatusConfig = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return {
          label: "Pendiente",
          icon: Clock,
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
        };
      case "processing":
        return {
          label: "En preparación",
          icon: Package,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
        };
      case "delivered":
        return {
          label: "Entregado",
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
        };
      case "cancelled":
        return {
          label: "Cancelado",
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link to="/" className="hover:text-[#FF6633]">
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Mis Pedidos</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Pedidos</h1>
          <p className="text-gray-600">Revisa el estado de tus compras recientes</p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">No tienes pedidos</h2>
            <p className="text-gray-600 mb-6">Cuando realices una compra, tus pedidos aparecerán aquí</p>
            <Link
              to="/catalogo"
              className="inline-block bg-[#FF6633] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">
                            Pedido {order.id}
                          </h3>
                          <span
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {order.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {order.branch === "ate" ? "Ate" : "Santa Anita"}
                          </div>
                          <span>{order.items} {order.items === 1 ? "producto" : "productos"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Total</p>
                        <p className="text-2xl font-bold text-[#FF6633]">
                          S/ {order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Products */}
                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Productos</h4>
                    <div className="space-y-3">
                      {order.products.map((product, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Cantidad: {product.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-800">
                            S/ {(product.price * product.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between gap-3">
                      {order.status === "processing" && (
                        <button className="text-sm text-red-600 font-semibold hover:text-red-700 transition-colors">
                          Cancelar pedido
                        </button>
                      )}
                      {order.status === "delivered" && (
                        <Link
                          to="/catalogo"
                          className="text-sm text-[#FF6633] font-semibold hover:text-[#E85522] transition-colors"
                        >
                          Volver a comprar
                        </Link>
                      )}
                      <div className="flex-1"></div>
                      <Link
                        to={`/mis-pedidos/${order.id}`}
                        className="text-sm text-[#2B7DBF] font-semibold hover:text-[#1E5A8F] transition-colors"
                      >
                        Ver detalles
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
