import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Check, Banknote } from "lucide-react";
import yapeIcon from "../../imports/image-3.png";

type Step = 1 | 2 | 3;

export function Checkout() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    fullName: "",
    dni: "",
    email: "",
    phone: "",
    needsInvoice: false,
    ruc: "",
    businessName: "",
    deliveryMethod: "pickup",
    branch: "ate",
    address: "",
    district: "",
    reference: "",
    paymentMethod: "cash",
  });

  const cartItems = [
    { id: "1", name: "Paracetamol 500mg x 100 tabletas", quantity: 2, price: 12.50 },
    { id: "2", name: "Ibuprofeno 400mg x 50 cápsulas", quantity: 1, price: 18.90 },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const delivery = formData.deliveryMethod === "delivery" ? 5.00 : 0;
  const total = subtotal + delivery;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/confirmacion");
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Stepper */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                      currentStep >= step
                        ? 'bg-[#FF6633] text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {currentStep > step ? <Check className="w-6 h-6" /> : step}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${
                    currentStep >= step ? 'text-[#FF6633]' : 'text-gray-500'
                  }`}>
                    {step === 1 && "Datos"}
                    {step === 2 && "Entrega"}
                    {step === 3 && "Pago"}
                  </span>
                </div>
                {step < 3 && (
                  <div className={`h-1 flex-1 -mt-8 ${currentStep > step ? 'bg-[#FF6633]' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left - Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-8">
                {/* Step 1: Datos personales */}
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-family-heading)' }}>
                      Datos personales
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Nombre completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                          placeholder="Ej: Juan Pérez García"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">DNI *</label>
                          <input
                            type="text"
                            required
                            maxLength={8}
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                            placeholder="12345678"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Número de celular *</label>
                          <input
                            type="tel"
                            required
                            maxLength={9}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                            placeholder="999999999"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Correo electrónico *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                      <div className="pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.needsInvoice}
                            onChange={(e) => setFormData({ ...formData, needsInvoice: e.target.checked })}
                            className="accent-[#FF6633]"
                          />
                          <span className="text-sm font-medium">¿Necesitas boleta o factura?</span>
                        </label>
                      </div>
                      {formData.needsInvoice && (
                        <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <label className="block text-sm font-semibold mb-2">RUC</label>
                            <input
                              type="text"
                              maxLength={11}
                              value={formData.ruc}
                              onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                              placeholder="20123456789"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2">Razón social</label>
                            <input
                              type="text"
                              value={formData.businessName}
                              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                              placeholder="Empresa S.A.C."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="mt-6 w-full bg-[#FF6633] text-white py-3.5 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
                    >
                      Continuar
                    </button>
                  </div>
                )}

                {/* Step 2: Método de entrega */}
                {currentStep === 2 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-family-heading)' }}>
                      Método de entrega
                    </h2>
                    <div className="space-y-4">
                      <label className={`flex items-start gap-4 p-6 border-2 rounded-xl cursor-pointer transition-colors ${
                        formData.deliveryMethod === "pickup" ? 'border-[#FF6633] bg-[#FFF0E0]' : 'border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="pickup"
                          checked={formData.deliveryMethod === "pickup"}
                          onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                          className="mt-1 accent-[#FF6633]"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">Recojo en tienda (gratis)</h3>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="branch"
                                value="ate"
                                checked={formData.branch === "ate"}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="accent-[#FF6633]"
                              />
                              <span className="text-sm">Sede Ate</span>
                              <span className="text-xs text-[#3AAB4A]">• Disponible</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="branch"
                                value="santa-anita"
                                checked={formData.branch === "santa-anita"}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="accent-[#FF6633]"
                              />
                              <span className="text-sm">Sede Santa Anita</span>
                              <span className="text-xs text-[#3AAB4A]">• Disponible</span>
                            </label>
                          </div>
                        </div>
                      </label>

                      <label className={`flex items-start gap-4 p-6 border-2 rounded-xl cursor-pointer transition-colors ${
                        formData.deliveryMethod === "delivery" ? 'border-[#FF6633] bg-[#FFF0E0]' : 'border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="delivery"
                          checked={formData.deliveryMethod === "delivery"}
                          onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                          className="mt-1 accent-[#FF6633]"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">Delivery a domicilio (S/ 5.00)</h3>
                          {formData.deliveryMethod === "delivery" && (
                            <div className="space-y-3 mt-4">
                              <input
                                type="text"
                                placeholder="Calle y número"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                              />
                              <input
                                type="text"
                                placeholder="Distrito"
                                value={formData.district}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                              />
                              <input
                                type="text"
                                placeholder="Referencia"
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                              />
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 border-2 border-gray-300 text-gray-700 py-3.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Volver
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 bg-[#FF6633] text-white py-3.5 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Método de pago */}
                {currentStep === 3 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-family-heading)' }}>
                      Método de pago
                    </h2>
                    <div className="space-y-4">
                      <label className={`flex items-start gap-4 p-6 border-2 rounded-xl cursor-pointer transition-colors ${
                        formData.paymentMethod === "cash" ? 'border-[#FF6633] bg-[#FFF0E0]' : 'border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={formData.paymentMethod === "cash"}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="mt-1 accent-[#FF6633]"
                        />
                        <div className="flex-1 flex items-center gap-4">
                          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                            <Banknote className="w-8 h-8 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">Efectivo</h3>
                            <p className="text-sm text-gray-600">Paga al momento del recojo o entrega</p>
                          </div>
                        </div>
                      </label>

                      <label className={`flex items-start gap-4 p-6 border-2 rounded-xl cursor-pointer transition-colors ${
                        formData.paymentMethod === "yape" ? 'border-[#FF6633] bg-[#FFF0E0]' : 'border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="yape"
                          checked={formData.paymentMethod === "yape"}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="mt-1 accent-[#FF6633]"
                        />
                        <div className="flex-1 flex items-center gap-4">
                          <img src={yapeIcon} alt="Yape" className="w-16 h-16 rounded-lg" />
                          <div>
                            <h3 className="font-semibold mb-1">Yape</h3>
                            <p className="text-sm text-gray-600">Realiza el pago por Yape y envía el comprobante</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    <p className="text-xs text-gray-500 mt-6 p-4 bg-gray-50 rounded-lg">
                      Al confirmar, el stock será reservado para tu pedido
                    </p>

                    <div className="flex gap-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="flex-1 border-2 border-gray-300 text-gray-700 py-3.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Volver
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-[#FF6633] text-white py-3.5 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
                      >
                        Confirmar pedido
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-24">
                <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-family-heading)' }}>
                  Resumen de pedido
                </h2>
                <div className="space-y-3 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">{item.quantity}x {item.name.substring(0, 25)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">S/ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery:</span>
                    <span className="font-semibold">
                      {delivery === 0 ? <span className="text-[#3AAB4A]">Gratis</span> : `S/ ${delivery.toFixed(2)}`}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-[#FF6633]" style={{ fontFamily: 'var(--font-family-heading)' }}>
                      S/ {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
