import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function CierreCaja() {
  const navigate = useNavigate();
  const [cashCounted, setCashCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const shiftData = {
    worker: "Carlos Quispe",
    branch: "Ate",
    date: "21 Abr 2025",
    startTime: "08:00 AM",
    transactions: 0,
    cashTotal: 0.00,
    yapeTotal: 0.00,
    total: 0.00,
  };

  const sales: any[] = [];

  const cashCountedNum = parseFloat(cashCounted) || 0;
  const difference = cashCountedNum - shiftData.cashTotal;

  const getDifferenceStatus = () => {
    if (difference === 0) {
      return { icon: CheckCircle2, color: "#3AAB4A", text: `Cuadre correcto · Diferencia: S/ 0.00`, bg: "bg-green-50" };
    } else if (difference > 0) {
      return { icon: AlertTriangle, color: "#F59E0B", text: `Sobrante: S/ +${difference.toFixed(2)}`, bg: "bg-amber-50" };
    } else {
      return { icon: AlertTriangle, color: "#E03131", text: `Faltante: S/ ${difference.toFixed(2)}`, bg: "bg-red-50" };
    }
  };

  const status = getDifferenceStatus();
  const StatusIcon = status.icon;

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
    setShowSuccess(true);
  };

  const handleFinalLogout = () => {
    navigate("/staff");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Warning Banner */}
      <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm font-medium">
            Esta acción cerrará tu turno actual. Asegúrate de haber registrado todas las ventas.
          </p>
        </div>
      </div>

      {showSuccess ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-[#3AAB4A] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#3AAB4A] mb-2">Turno cerrado correctamente</h2>
          <p className="text-gray-600 mb-2">El reporte fue enviado al administrador</p>
          <p className="text-sm text-gray-500 mb-8">
            Cierre registrado: {shiftData.date} · 04:30 PM
          </p>
          <button
            onClick={handleFinalLogout}
            className="bg-[#1A1A1A] text-white px-8 py-3 rounded-lg font-semibold hover:bg-black transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      ) : (
        <>
          {/* Shift Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-xl mb-2">Resumen del turno — {shiftData.worker}</h2>
            <p className="text-sm text-gray-600 mb-6">
              {shiftData.branch} · {shiftData.date} · {shiftData.startTime} → ahora
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total ventas registradas</p>
                <p className="text-2xl font-bold">{shiftData.transactions}</p>
                <p className="text-xs text-gray-500 mt-1">transacciones</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total en efectivo</p>
                <p className="text-2xl font-bold text-[#3AAB4A]">S/ {shiftData.cashTotal.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total en Yape</p>
                <p className="text-2xl font-bold text-[#2B7DBF]">S/ {shiftData.yapeTotal.toFixed(2)}</p>
              </div>
              <div className="bg-[#FFF0E0] p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total general del turno</p>
                <p className="text-2xl font-bold text-[#FF6633]">S/ {shiftData.total.toFixed(2)}</p>
              </div>
            </div>

            {/* Sales Table */}
            <h3 className="font-bold mb-4">Detalle de ventas del turno</h3>
            {sales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se registraron ventas en este turno
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Hora</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Cant.</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Precio</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Método</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="px-4 py-3 text-sm">{sale.time}</td>
                        <td className="px-4 py-3 text-sm">{sale.product}</td>
                        <td className="px-4 py-3 text-sm">{sale.quantity}</td>
                        <td className="px-4 py-3 text-sm font-semibold">S/ {sale.price}</td>
                        <td className="px-4 py-3 text-sm">{sale.method}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-4 py-3 text-sm">TOTAL</td>
                      <td className="px-4 py-3 text-sm">—</td>
                      <td className="px-4 py-3 text-sm">—</td>
                      <td className="px-4 py-3 text-sm">S/ {shiftData.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cash Reconciliation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-lg mb-6">Cuadre de efectivo</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Efectivo registrado en sistema</span>
                <span className="font-semibold">S/ {shiftData.cashTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-gray-600">Efectivo contado físicamente</label>
                <input
                  type="number"
                  step="0.01"
                  value={cashCounted}
                  onChange={(e) => setCashCounted(e.target.value)}
                  placeholder="S/ 0.00"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-right font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
                />
              </div>
            </div>

            {cashCounted && (
              <div className={`${status.bg} border-l-4 p-4 rounded-lg mb-6`} style={{ borderColor: status.color }}>
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
                  <span className="font-semibold" style={{ color: status.color }}>
                    {status.text}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold mb-2">Observaciones (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Se encontró billete falso, cliente pagó con billete de S/100..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6633]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!cashCounted}
              className="w-full bg-[#FF6633] text-white py-4 rounded-lg font-semibold hover:bg-[#E85522] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
            >
              Confirmar cierre de turno
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">¿Confirmar cierre de turno?</h2>
            <div className="space-y-2 mb-6 text-sm">
              <p><span className="font-semibold">Turno:</span> {shiftData.startTime} — 04:30 PM</p>
              <p><span className="font-semibold">Ventas:</span> {shiftData.transactions} transacciones · S/ {shiftData.total.toFixed(2)}</p>
              <p><span className="font-semibold">Efectivo:</span> S/ {shiftData.cashTotal.toFixed(2)} · <span className="font-semibold">Yape:</span> S/ {shiftData.yapeTotal.toFixed(2)}</p>
              <p className="flex items-center gap-2">
                <span className="font-semibold">Diferencia:</span>
                <span style={{ color: status.color }} className="font-bold flex items-center gap-1">
                  {difference === 0 && <CheckCircle2 className="w-4 h-4" />}
                  S/ {difference.toFixed(2)}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmClose}
                className="flex-1 bg-[#FF6633] text-white py-3 rounded-lg font-semibold hover:bg-[#E85522]"
              >
                Cerrar turno
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
