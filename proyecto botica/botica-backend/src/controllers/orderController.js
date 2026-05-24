const OrderModel = require('../models/orderModel');
const pool = require('../config/db');
const { toFloat, toInt } = require('../utils/casting');

const VALID_ORDER_STATES = ['pendiente', 'en proceso', 'entregado', 'cancelado'];
const VALID_DELIVERY_TYPES = ['delivery', 'pickup'];

const orderController = {

  // GET /api/orders
  getAll: async (req, res) => {
    try {
      const orders = await OrderModel.findAll(req.query);
      res.json(orders);
    } catch (err) {
      console.error('[orders/getAll]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // GET /api/orders/:id
  getById: async (req, res) => {
    try {
      const order = await OrderModel.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });

      // Ownership: customers solo ven sus propios pedidos
      if (req.user.role === 'cust' && order.customer_id !== req.user.customer_id) {
        return res.status(403).json({
          message: 'No tienes permiso para ver este pedido.'
        });
      }

      return res.json(order);
    } catch (err) {
      console.error('[orders/getById]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // GET /api/orders/my-orders
  getMyOrders: async (req, res) => {
    try {
      let customer_id;

      if (req.user.role === 'cust') {
        // Cliente: SIEMPRE usa su propio customer_id, ignora el query
        customer_id = req.user.customer_id;
      } else if (req.user.role === 'admin' || req.user.role === 'emp') {
        // Staff/admin: pueden pasar customer_id por query (uso en panel)
        customer_id = req.query.customer_id ? parseInt(req.query.customer_id, 10) : null;
        if (!customer_id) {
          return res.status(400).json({
            message: 'Para staff/admin, se requiere customer_id en query.'
          });
        }
      } else {
        return res.status(403).json({ message: 'Acceso denegado.' });
      }

      const orders = await OrderModel.findByCustomer(customer_id);
      return res.json(orders);
    } catch (err) {
      console.error('[orders/getMyOrders]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // POST /api/orders
  create: async (req, res) => {
    try {
      const { order, details } = req.body;

      if (!details || details.length === 0) {
        return res.status(400).json({ message: 'El pedido debe tener al menos un producto.' });
      }

      if (order && order.delivery_type && !VALID_DELIVERY_TYPES.includes(order.delivery_type)) {
        return res.status(400).json({
          message: `delivery_type debe ser '${VALID_DELIVERY_TYPES.join("' o '")}'.`
        });
      }

      // Verificar stock antes de crear
      for (const detail of details) {
        const stockResult = await pool.query(
          `SELECT current_stock FROM inventory
           WHERE product_id = $1 AND location_id = $2`,
          [detail.product_id, order.location_id]
        );
        const stock = stockResult.rows[0];
        if (!stock || stock.current_stock < detail.amount) {
          return res.status(409).json({
            message: `Stock insuficiente para el producto ID ${detail.product_id}.`
          });
        }
      }

      const newOrder = await OrderModel.create(order, details);
      res.status(201).json(newOrder);
    } catch (err) {
      console.error('[orders/create]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // POST /api/orders/walk-in
  // Venta presencial registrada por un trabajador (emp/admin)
  // El customer_id puede ser null (cliente genérico) o un customer existente
  createWalkIn: async (req, res) => {
    try {
      const { order, details } = req.body;

      // Validar campos requeridos
      if (!details || !Array.isArray(details) || details.length === 0) {
        return res.status(400).json({ message: 'Se requiere al menos un item.' });
      }
      if (!order || !order.location_id) {
        return res.status(400).json({ message: 'Se requiere location_id.' });
      }

      // Forzar valores del trabajador autenticado (del JWT)
      const walkInOrder = {
        ...order,
        user_id: req.user.user_id,           // el emp/admin que registra la venta
        order_state: 'entregado',            // venta presencial = entrega inmediata
        delivery_type: order.delivery_type || 'pickup',
        // customer_id viene del body (puede ser null para cliente genérico)
      };

      if (walkInOrder.delivery_type && !VALID_DELIVERY_TYPES.includes(walkInOrder.delivery_type)) {
        return res.status(400).json({
          message: `delivery_type debe ser '${VALID_DELIVERY_TYPES.join("' o '")}'.`
        });
      }

      // Verificar stock antes de crear
      for (const detail of details) {
        const stockResult = await pool.query(
          `SELECT current_stock FROM inventory
           WHERE product_id = $1 AND location_id = $2`,
          [detail.product_id, walkInOrder.location_id]
        );
        const stock = stockResult.rows[0];
        if (!stock || stock.current_stock < detail.amount) {
          return res.status(409).json({
            message: `Stock insuficiente para el producto ID ${detail.product_id}.`
          });
        }
      }

      const newOrder = await OrderModel.create(walkInOrder, details);
      return res.status(201).json(newOrder);
    } catch (err) {
      console.error('[orders/createWalkIn]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // GET /api/orders/stats?date=YYYY-MM-DD&location_id=
  getStats: async (req, res) => {
    try {
      const date = req.query.date || new Date().toISOString().slice(0, 10);
      let locId;
      if (req.user.role === 'emp') {
        locId = req.user.location_id;
      } else {
        locId = req.query.location_id ? parseInt(req.query.location_id, 10) : null;
      }

      const params = [date, locId];

      const kpisQ = pool.query(
        `SELECT
           COALESCE(SUM(total_price), 0)  AS ventas,
           COUNT(*)::int                  AS pedidos,
           COUNT(*) FILTER (WHERE order_state = 'pendiente')::int AS pendientes,
           COALESCE(AVG(total_price), 0)  AS ticket_promedio
         FROM orders
         WHERE DATE(order_date) = $1::date
           AND order_state != 'cancelado'
           AND ($2::int IS NULL OR location_id = $2::int)`,
        params
      );

      const payQ = pool.query(
        `SELECT
           COALESCE(pay.payment_method, 'sin_pago') AS payment_method,
           COALESCE(SUM(o.total_price), 0)          AS total,
           COUNT(o.order_id)::int                   AS count
         FROM orders o
         LEFT JOIN payment pay ON pay.order_id = o.order_id
         WHERE DATE(o.order_date) = $1::date
           AND o.order_state != 'cancelado'
           AND ($2::int IS NULL OR o.location_id = $2::int)
         GROUP BY COALESCE(pay.payment_method, 'sin_pago')
         ORDER BY total DESC`,
        params
      );

      const [rKpis, rPay] = await Promise.all([kpisQ, payQ]);
      const k = rKpis.rows[0] || {};

      return res.json({
        date,
        location_id: locId,
        ventas: toFloat(k.ventas),
        pedidos: toInt(k.pedidos),
        pendientes: toInt(k.pendientes),
        ticket_promedio: toFloat(k.ticket_promedio),
        ventas_por_metodo_pago: rPay.rows.map(r => ({
          payment_method: r.payment_method,
          total: toFloat(r.total),
          count: toInt(r.count)
        }))
      });
    } catch (err) {
      console.error('[orders/getStats]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // GET /api/orders/shift-summary?date=YYYY-MM-DD
  getShiftSummary: async (req, res) => {
    try {
      const date = req.query.date || new Date().toISOString().slice(0, 10);
      const userId = req.user.user_id;
      const fullName = req.user.full_name;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado.' });
      }

      const params = [date, userId];

      const totalsQ = pool.query(
        `SELECT
           COALESCE(SUM(total_price), 0) AS total_sales,
           COUNT(*)::int                  AS total_transactions,
           COALESCE(AVG(total_price), 0)  AS average_ticket
         FROM orders
         WHERE DATE(order_date) = $1::date
           AND user_id = $2::int
           AND order_state != 'cancelado'`,
        params
      );

      const payQ = pool.query(
        `SELECT
           COALESCE(pay.payment_method, 'sin_pago') AS payment_method,
           COALESCE(SUM(o.total_price), 0)          AS total,
           COUNT(o.order_id)::int                   AS count
         FROM orders o
         LEFT JOIN payment pay ON pay.order_id = o.order_id
         WHERE DATE(o.order_date) = $1::date
           AND o.user_id = $2::int
           AND o.order_state != 'cancelado'
         GROUP BY COALESCE(pay.payment_method, 'sin_pago')
         ORDER BY total DESC`,
        params
      );

      // Las transacciones del turno incluyen canceladas (es histórico completo)
      const txQ = pool.query(
        `SELECT
           o.order_id,
           o.order_date,
           o.total_price,
           o.order_state,
           o.delivery_type,
           c.full_name AS customer_name,
           COALESCE(pay.payment_method, 'sin_pago') AS payment_method
         FROM orders o
         LEFT JOIN customer c   ON o.customer_id = c.customer_id
         LEFT JOIN payment  pay ON pay.order_id  = o.order_id
         WHERE DATE(o.order_date) = $1::date
           AND o.user_id = $2::int
         ORDER BY o.order_date DESC`,
        params
      );

      const [rTot, rPay, rTx] = await Promise.all([totalsQ, payQ, txQ]);
      const t = rTot.rows[0] || {};

      return res.json({
        date,
        user_id: userId,
        full_name: fullName,
        total_sales: toFloat(t.total_sales),
        total_transactions: toInt(t.total_transactions),
        average_ticket: toFloat(t.average_ticket),
        by_payment_method: rPay.rows.map(r => ({
          payment_method: r.payment_method,
          total: toFloat(r.total),
          count: toInt(r.count)
        })),
        transactions: rTx.rows.map(r => ({
          order_id: r.order_id,
          order_date: r.order_date,
          total_price: toFloat(r.total_price),
          order_state: r.order_state,
          delivery_type: r.delivery_type,
          customer_name: r.customer_name,
          payment_method: r.payment_method
        }))
      });
    } catch (err) {
      console.error('[orders/getShiftSummary]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // PATCH /api/orders/:id/status
  updateStatus: async (req, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { order_state } = req.body;

      if (!VALID_ORDER_STATES.includes(order_state)) {
        return res.status(400).json({
          message: `Estado inválido. Debe ser: ${VALID_ORDER_STATES.join(', ')}.`
        });
      }

      const currentOrder = await OrderModel.findById(orderId);
      if (!currentOrder) {
        return res.status(404).json({ message: 'Pedido no encontrado.' });
      }

      // Reglas según rol
      if (req.user.role === 'cust') {
        // Cust: solo cancelar sus propios pedidos en estado 'pendiente'
        if (currentOrder.customer_id !== req.user.customer_id) {
          return res.status(403).json({
            message: 'No tienes permiso sobre este pedido.'
          });
        }
        if (order_state !== 'cancelado') {
          return res.status(403).json({
            message: 'Los clientes solo pueden cancelar pedidos.'
          });
        }
        if (currentOrder.order_state !== 'pendiente') {
          return res.status(409).json({
            message: 'Solo se pueden cancelar pedidos en estado pendiente.'
          });
        }
      }
      // Staff/admin: cualquier transición permitida

      // Actualizar SOLO el estado (no tocar user_id original)
      const updated = await OrderModel.updateStatus(orderId, order_state);
      return res.json(updated);
    } catch (err) {
      console.error('[orders/updateStatus]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = orderController;