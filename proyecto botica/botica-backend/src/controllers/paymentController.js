const PaymentModel = require('../models/paymentModel');
const {
  processCardPayment,
  getPaymentStatus,
} = require('../services/paymentService');

const VALID_PAYMENT_METHODS = ['efectivo', 'yape', 'plin', 'tarjeta', 'transferencia'];
const VALID_VOUCHER_TYPES = ['boleta', 'factura', 'ticket'];

const paymentController = {

  getAll: async (req, res) => {
    try {
      const payments = await PaymentModel.findAll();
      res.json(payments);
    } catch (err) {
      console.error('[payments/getAll]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getById: async (req, res) => {
    try {
      const payment = await PaymentModel.findById(req.params.id);
      if (!payment) return res.status(404).json({ message: 'Pago no encontrado.' });
      res.json(payment);
    } catch (err) {
      console.error('[payments/getById]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getByOrder: async (req, res) => {
    try {
      const payment = await PaymentModel.findByOrder(req.params.order_id);
      if (!payment) return res.status(404).json({ message: 'Pago no encontrado para ese pedido.' });
      res.json(payment);
    } catch (err) {
      console.error('[payments/getByOrder]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  create: async (req, res) => {
    try {
      const { payment_method, voucher_type } = req.body || {};

      if (!VALID_PAYMENT_METHODS.includes(payment_method)) {
        return res.status(400).json({
          message: `payment_method inválido. Debe ser: ${VALID_PAYMENT_METHODS.join(', ')}.`
        });
      }
      if (voucher_type !== undefined && voucher_type !== null && !VALID_VOUCHER_TYPES.includes(voucher_type)) {
        return res.status(400).json({
          message: `voucher_type inválido. Debe ser: ${VALID_VOUCHER_TYPES.join(', ')}.`
        });
      }

      const payment = await PaymentModel.create(req.body);
      res.status(201).json(payment);
    } catch (err) {
      console.error('[payments/create]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  update: async (req, res) => {
    try {
      const { payment_method, voucher_type } = req.body || {};

      if (payment_method !== undefined && !VALID_PAYMENT_METHODS.includes(payment_method)) {
        return res.status(400).json({
          message: `payment_method inválido. Debe ser: ${VALID_PAYMENT_METHODS.join(', ')}.`
        });
      }
      if (voucher_type !== undefined && voucher_type !== null && !VALID_VOUCHER_TYPES.includes(voucher_type)) {
        return res.status(400).json({
          message: `voucher_type inválido. Debe ser: ${VALID_VOUCHER_TYPES.join(', ')}.`
        });
      }

      const payment = await PaymentModel.update(req.params.id, req.body);
      if (!payment) return res.status(404).json({ message: 'Pago no encontrado.' });
      res.json(payment);
    } catch (err) {
      console.error('[payments/update]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  delete: async (req, res) => {
    try {
      const payment = await PaymentModel.delete(req.params.id);
      if (!payment) return res.status(404).json({ message: 'Pago no encontrado.' });
      res.json({ message: 'Pago eliminado.', payment });
    } catch (err) {
      console.error('[payments/delete]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // POST /api/payments/process
  // Cargo con tarjeta independiente vía MercadoPago. En el flujo de
  // producción el cargo va dentro de POST /api/orders; este endpoint
  // queda como utilidad para pruebas o flujos custom.
  processCardCharge: async (req, res) => {
    try {
      const result = await processCardPayment(req.body);
      if (!result.success) {
        return res.status(402).json(result);
      }
      return res.json(result);
    } catch (err) {
      console.error('[payments/process]', err);
      return res.status(500).json({ message: 'Error al procesar el pago.' });
    }
  },

  // GET /api/payments/mp/:id
  // Consulta estado actual de un pago en MercadoPago.
  mpStatus: async (req, res) => {
    try {
      const result = await getPaymentStatus(req.params.id);
      if (!result.success) return res.status(404).json(result);
      return res.json(result);
    } catch (err) {
      console.error('[payments/mp/:id]', err);
      return res.status(500).json({ message: 'Error consultando pago.' });
    }
  },
};

module.exports = paymentController;
