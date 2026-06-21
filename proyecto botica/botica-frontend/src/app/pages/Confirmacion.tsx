import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { CheckCircle2, Package, ArrowRight, Home } from 'lucide-react';
import { api } from '../lib/api';
import type { Order } from '../lib/types';

export function Confirmacion() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('ID de pedido no especificado');
      setIsLoading(false);
      return;
    }

    api.orders
      .getById(parseInt(orderId, 10))
      .then(setOrder)
      .catch((err) => {
        console.error(err);
        setError('No se pudo cargar el pedido');
      })
      .finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-muted mt-4">Cargando confirmación...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-error mb-4">{error || 'Pedido no encontrado'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white font-medium rounded-md"
        >
          <Home size={18} />
          Volver al inicio
        </Link>
      </div>
    );
  }

  const paymentMethod = order.payment?.payment_method;
  const isPendingValidation = order.order_state === 'pendiente';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-surface rounded-2xl border border-line p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-success-soft rounded-full flex items-center justify-center">
          <CheckCircle2 className="text-success" size={48} />
        </div>

        <h1 className="text-3xl font-bold text-text mb-2">¡Pedido confirmado!</h1>
        <p className="text-muted mb-6">Hemos recibido tu pedido correctamente</p>

        <div className="bg-brand-soft rounded-xl p-6 mb-6">
          <p className="text-xs text-muted uppercase tracking-wide">Número de pedido</p>
          <p className="text-3xl font-bold text-brand mt-1">#{order.order_id}</p>
          <div className="border-t border-brand/20 mt-4 pt-4">
            <p className="text-xs text-muted uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-text">
              S/ {Number(order.total_price).toFixed(2)}
            </p>
          </div>
        </div>

        {isPendingValidation && (paymentMethod === 'yape' || paymentMethod === 'plin') && (
          <div className="bg-warning-soft border border-warning rounded-lg p-4 mb-6 text-left">
            <p className="font-semibold text-text mb-1">Pago pendiente de validación</p>
            <p className="text-sm text-muted">
              Una vez confirmemos tu pago con {paymentMethod === 'yape' ? 'Yape' : 'Plin'},
              procesaremos tu pedido. Esto puede tomar unas horas.
            </p>
          </div>
        )}

        {isPendingValidation && paymentMethod === 'transferencia' && (
          <div className="bg-warning-soft border border-warning rounded-lg p-4 mb-6 text-left">
            <p className="font-semibold text-text mb-1">Esperando transferencia</p>
            <p className="text-sm text-muted">
              Cuando recibamos tu transferencia, procesaremos tu pedido.
            </p>
          </div>
        )}

        {paymentMethod === 'tarjeta' && (
          <div className="bg-success-soft border border-success rounded-lg p-4 mb-6 text-left">
            <p className="font-semibold text-text mb-1">Pago aprobado</p>
            <p className="text-sm text-muted">
              Tu pago con tarjeta fue procesado exitosamente. Empezamos a preparar tu pedido.
            </p>
          </div>
        )}

        {paymentMethod === 'efectivo' && (
          <div className="bg-warning-soft border border-warning rounded-lg p-4 mb-6 text-left">
            <p className="font-semibold text-text mb-1">Pago contra entrega</p>
            <p className="text-sm text-muted">
              Paga en efectivo cuando recibas tu pedido. Por favor ten el monto exacto.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link
            to={`/mis-pedidos/${order.order_id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white font-medium rounded-md transition-colors"
          >
            <Package size={18} />
            Ver detalle del pedido
          </Link>
          <Link
            to="/catalogo"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-line hover:border-brand text-text font-medium rounded-md transition-colors"
          >
            Seguir comprando
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
