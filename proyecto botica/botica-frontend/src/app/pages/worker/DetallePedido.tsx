import { Link, useParams } from "react-router";
import { ArrowLeft, User, CreditCard, Phone, Mail, FileText, MapPin, Truck, DollarSign, Smartphone, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import yapeIcon from "../../../imports/image-3.png";

export function DetallePedido() {
  const { id } = useParams();
  const [status, setStatus] = useState<"pendiente" | "entregado" | "cancelado">("pendiente");
  const [showCancelModal, setShowCancelModal] = useState(false);

  const order = {
    id: id || "0001",
    date: "21 Abr 2025",
    time: "14:30",
    client: {
      name: "Juan Pérez",
      dni: "12345678",
      phone: "999 888 777",
      email: "juan@email.com",
      voucher: "Boleta",
    },
    products: [
      { name: "Paracetamol 500mg x 100 tabletas", brand: "Laboratorios Unidos", quantity: 2, subtotal: 25.00 },
      { name: "Vitamina C 1000mg x 60 tabletas", brand: "Vitamax", quantity: 1, subtotal: 35.00 },
    ],
    total: 60.00,
    deliveryMethod: "pickup",
    branch: "Ate",
    paymentMethod: "efectivo",
    status: status,
  };

  const handleMarkAsDelivered = () => {
    if (confirm("¿Marcar este pedido como entregado?")) {
      setStatus("entregado");
    }
  };

  const handleCancel = () => {
    setShowCancelModal(false);
    setStatus("cancelado");
  };

  const getStatusPill = (status: string) => {
    const configs = {
      pendiente: { style: "bg-amber-100 text-amber-800", icon: Clock, label: "Pendiente" },
      entregado: { style: "bg-green-100 text-green-800", icon: CheckCircle2, label: "Entregado" },
      cancelado: { style: "bg-red-100 text-red-800", icon: XCircle, label: "Cancelado" },
    };
    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${config.style}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Link */}
      <Link
        to="/staff/pedidos"
        className="inline-flex items-center gap-2 text-[#2B7DBF] hover:text-[#2369A3] mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a pedidos
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Pedido #{order.id}</h1>
                <p className="text-gray-600 text-sm">
                  Creado: {order.date} · {order.time}
                </p>
              </div>
              {getStatusPill(order.status)}
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-lg mb-4">Productos solicitados</h2>
            <div className="space-y-4">
              {order.products.map((product, index) => (
                <div key={index} className="flex justify-between items-start pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{product.brand}</p>
                    <span className="inline-block bg-[#2B7DBF] text-white text-xs px-2 py-1 rounded-full">
                      x{product.quantity}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[#FF6633] font-bold">S/ {product.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t-2 border-gray-300 flex justify-between items-center">
              <span className="font-bold text-lg">Total del pedido:</span>
              <span className="text-[#FF6633] font-extrabold text-2xl">
                S/ {order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Delivery Method */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-lg mb-4">Método de entrega</h2>
            <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
              {order.deliveryMethod === "pickup" ? (
                <>
                  <MapPin className="w-5 h-5 text-[#FF6633] mt-0.5" />
                  <div>
                    <p className="font-semibold">Recojo en Sede {order.branch}</p>
                    <p className="text-sm text-gray-600">Cliente recoge en tienda</p>
                  </div>
                </>
              ) : (
                <>
                  <Truck className="w-5 h-5 text-[#FF6633] mt-0.5" />
                  <div>
                    <p className="font-semibold">Delivery a domicilio</p>
                    <p className="text-sm text-gray-600">Dirección del cliente</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-lg mb-4">Método de pago</h2>
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
              {order.paymentMethod === "efectivo" ? (
                <>
                  <DollarSign className="w-5 h-5 text-[#3AAB4A]" />
                  <span className="font-semibold">Efectivo</span>
                </>
              ) : (
                <>
                  <img src={yapeIcon} alt="Yape" className="w-8 h-8 rounded" />
                  <span className="font-semibold">Yape</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Client & Actions */}
        <div className="space-y-6">
          {/* Client Data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-lg mb-4">Datos del cliente</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-600 text-xs">Nombre</p>
                  <p className="font-medium">{order.client.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-600 text-xs">DNI</p>
                  <p className="font-medium">{order.client.dni}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-600 text-xs">Celular</p>
                  <p className="font-medium">{order.client.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-600 text-xs">Correo</p>
                  <p className="font-medium">{order.client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-600 text-xs">Comprobante</p>
                  <p className="font-medium">{order.client.voucher}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-lg mb-4">Cambiar estado del pedido</h2>

            {order.status === "pendiente" && (
              <div className="space-y-3">
                <button
                  onClick={handleMarkAsDelivered}
                  className="w-full bg-[#3AAB4A] text-white py-3 rounded-lg font-semibold hover:bg-[#2E8B3A] transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Marcar como Entregado
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full border-2 border-[#E03131] text-[#E03131] py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Cancelar pedido
                </button>
              </div>
            )}

            {order.status === "entregado" && (
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-16 h-16 text-[#3AAB4A] mx-auto mb-3" />
                <p className="font-bold text-[#3AAB4A] mb-2">Pedido completado</p>
                <p className="text-sm text-gray-600">
                  Entregado el {order.date} · 15:00<br />
                  por Carlos Q.
                </p>
              </div>
            )}

            {order.status === "cancelado" && (
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <XCircle className="w-16 h-16 text-[#E03131] mx-auto mb-3" />
                <p className="font-bold text-[#E03131] mb-2">Pedido cancelado</p>
                <p className="text-xs text-gray-500 mt-3">
                  El stock fue restituido automáticamente
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">¿Cancelar este pedido?</h2>
            <p className="text-gray-600 mb-6">
              Esta acción restituirá el stock al inventario.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 bg-[#E03131] text-white py-3 rounded-lg font-semibold hover:bg-red-700"
              >
                Sí, cancelar
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                No, volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
