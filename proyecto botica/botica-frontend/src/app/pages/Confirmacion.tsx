import { Link } from "react-router";
import { CheckCircle2, Package, Clock, Truck } from "lucide-react";

export function Confirmacion() {
  const orderNumber = "0001";
  const estimatedTime = "30 minutos";

  return (
    <div className="bg-[#F5F5F5] min-h-screen flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4 w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#3AAB4A] rounded-full mb-6">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-family-heading)' }}>
            ¡Pedido confirmado!
          </h1>
          <p className="text-lg text-gray-600">
            Tu pedido #{orderNumber} está siendo preparado
          </p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>
            Detalles del pedido
          </h2>

          {/* Products */}
          <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-sm">
              <span>2x Paracetamol 500mg x 100 tabletas</span>
              <span className="font-semibold">S/ 25.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>1x Ibuprofeno 400mg x 50 cápsulas</span>
              <span className="font-semibold">S/ 18.90</span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-3 text-sm mb-6">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-[#FF6633] mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Método de entrega:</p>
                <p className="text-gray-600">Recojo en tienda - Sede Ate</p>
                <p className="text-gray-500 text-xs mt-1">Av. Ejemplo 123, Ate, Lima</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#FF6633] mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Tiempo estimado:</p>
                <p className="text-gray-600">Listo en aprox. {estimatedTime}</p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-1">Método de pago:</p>
            <p className="text-sm text-gray-600">Efectivo (pagar al recoger)</p>
            <p className="text-lg font-bold text-[#FF6633] mt-2">Total: S/ 43.90</p>
          </div>
        </div>

        {/* Order Status Tracker */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="font-bold text-lg mb-6" style={{ fontFamily: 'var(--font-family-heading)' }}>
            Estado del pedido
          </h2>
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10">
              <div className="h-full bg-[#FF6633] w-1/3 transition-all duration-500"></div>
            </div>

            {/* Step 1 - Active */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-12 h-12 rounded-full bg-[#FF6633] text-white flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-[#FF6633]">Pendiente</span>
            </div>

            {/* Step 2 - Inactive */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center mb-2">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-sm text-gray-500">En preparación</span>
            </div>

            {/* Step 3 - Inactive */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center mb-2">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-sm text-gray-500">Entregado</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => alert('Inicia sesión para ver el estado de tu pedido')}
            className="flex-1 bg-[#FF6633] text-white py-3.5 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
          >
            Ver mis pedidos
          </button>
          <Link
            to="/"
            className="flex-1 border-2 border-[#2B7DBF] text-[#2B7DBF] py-3.5 rounded-lg font-semibold hover:bg-[#2B7DBF] hover:text-white transition-colors text-center"
          >
            Volver al inicio
          </Link>
        </div>

        {/* Info Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Recibirás un correo de confirmación a la dirección que proporcionaste
          </p>
        </div>
      </div>
    </div>
  );
}
