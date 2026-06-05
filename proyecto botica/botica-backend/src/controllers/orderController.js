const OrderModel = require('../models/orderModel');
const pool = require('../config/db');
const { toFloat, toInt } = require('../utils/casting');
const { processCardPayment } = require('../services/paymentService');

const VALID_ORDER_STATES = ['pendiente', 'en proceso', 'entregado', 'cancelado'];
const VALID_DELIVERY_TYPES = ['delivery', 'pickup'];
const VALID_PAYMENT_METHODS = ['efectivo', 'yape', 'plin', 'tarjeta', 'transferencia'];
const VALID_VOUCHER_TYPES = ['boleta', 'factura', 'ticket'];

const orderController = {

  // GET /api/orders
  // Multi-tenancy:
  //  - emp   → SIEMPRE se fuerza su sede (req.user.location_id), ignora el query.
  //  - admin → filtro de sede opcional vía ?location_id.
  // (La ruta solo admite admin/emp; los customers usan /my-orders.)
  getAll: async (req, res) => {
    try {
      const filtros = { ...req.query };

      if (req.user.role === 'emp') {
        filtros.location_id = req.user.location_id; // sede del trabajador, no negociable
      }
      // admin: respeta filtros.location_id del query si vino (o ninguno = todas las sedes)

      const orders = await OrderModel.findAll(filtros);
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
  // Acepta DOS formatos:
  //  1) Flat (frontend web checkout con MercadoPago):
  //     { items: [...], delivery_type, address, phone, notes,
  //       payment_method, voucher_type, location_id,
  //       card_token, mp_payment_method_id, installments,
  //       payer_email, payer_identification }
  //  2) Legacy { order: {...}, details: [...] } — mantenido por compatibilidad
  create: async (req, res) => {
    const isFlat = Array.isArray(req.body && req.body.items);

    if (!isFlat) {
      // ===== Legacy path ({order, details}) =====
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
        return res.status(201).json(newOrder);
      } catch (err) {
        console.error('[orders/create:legacy]', err);
        return res.status(500).json({ message: 'Error en el servidor.' });
      }
    }

    // ===== Flat path (web checkout + MercadoPago) =====
    const {
      items,
      delivery_type,
      phone,
      payment_method,
      voucher_type,
      location_id,
      card_token,
      mp_payment_method_id,
      installments,
      payer_email,
      payer_identification,
    } = req.body;

    // Validaciones básicas
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Carrito vacío.' });
    }
    if (!location_id) {
      return res.status(400).json({ message: 'Se requiere location_id.' });
    }
    if (!payment_method || !VALID_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({
        message: `payment_method requerido. Debe ser: ${VALID_PAYMENT_METHODS.join(', ')}.`,
      });
    }
    if (delivery_type && !VALID_DELIVERY_TYPES.includes(delivery_type)) {
      return res.status(400).json({
        message: `delivery_type debe ser '${VALID_DELIVERY_TYPES.join("' o '")}'.`,
      });
    }
    if (voucher_type && !VALID_VOUCHER_TYPES.includes(voucher_type)) {
      return res.status(400).json({
        message: `voucher_type inválido. Debe ser: ${VALID_VOUCHER_TYPES.join(', ')}.`,
      });
    }
    if (payment_method === 'tarjeta' && !card_token) {
      return res.status(400).json({ message: 'Token de tarjeta requerido.' });
    }

    // Validar stock antes de tocar el pago
    for (const it of items) {
      const stockResult = await pool.query(
        `SELECT current_stock FROM inventory
         WHERE product_id = $1 AND location_id = $2`,
        [it.product_id, location_id]
      );
      const stock = stockResult.rows[0];
      if (!stock || stock.current_stock < Number(it.amount)) {
        return res.status(409).json({
          message: `Stock insuficiente para el producto ID ${it.product_id}.`,
        });
      }
    }

    // Calcular totales (regla: envío gratis si pickup o subtotal >= 50)
    const subtotal = items.reduce(
      (sum, i) => sum + Number(i.unit_price) * Number(i.amount),
      0
    );
    const shipping = delivery_type === 'pickup' ? 0 : (subtotal >= 50 ? 0 : 8);
    const total = subtotal + shipping;

    // Procesar pago con MercadoPago ANTES de tocar BD
    let mpResult = null;
    if (payment_method === 'tarjeta') {
      mpResult = await processCardPayment({
        token: card_token,
        amount: total,
        payment_method_id: mp_payment_method_id,
        installments: installments || 1,
        email: payer_email || req.user.email,
        description: `Pedido Botica Central - ${items.length} producto(s)`,
        payer: { identification: payer_identification },
      });

      if (!mpResult.success) {
        return res.status(402).json({
          message: 'Pago rechazado por MercadoPago',
          status: mpResult.status,
          status_detail: mpResult.status_detail,
        });
      }
    }

    // Estado del pedido según método de pago
    let orderState = 'pendiente';
    if (payment_method === 'tarjeta' && mpResult && mpResult.success) orderState = 'en proceso';
    else if (payment_method === 'efectivo') orderState = 'en proceso';

    const customer_id = req.user.customer_id || null;

    // Transacción BD
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `INSERT INTO orders
          (order_state, delivery_type, order_date, total_price, customer_id, user_id, location_id)
         VALUES ($1, $2, NOW(), $3, $4, NULL, $5)
         RETURNING *`,
        [orderState, delivery_type, total, customer_id, location_id]
      );
      const order = orderResult.rows[0];

      for (const it of items) {
        const sub_total = Number(it.unit_price) * Number(it.amount);
        await client.query(
          `INSERT INTO order_detail (amount, unit_price, sub_total_price, product_id, order_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [it.amount, it.unit_price, sub_total, it.product_id, order.order_id]
        );

        const stockUpd = await client.query(
          `UPDATE inventory
           SET current_stock = current_stock - $1
           WHERE product_id = $2 AND location_id = $3 AND current_stock >= $1
           RETURNING current_stock`,
          [it.amount, it.product_id, location_id]
        );
        if (stockUpd.rowCount === 0) {
          throw new Error(`Stock insuficiente para producto ${it.product_id}`);
        }
      }

      // Payment: incluye campos MP si era tarjeta (la tabla payment fue ampliada
      // con mp_payment_id, mp_status, mp_status_detail en .env/BD).
      await client.query(
        `INSERT INTO payment
          (payment_method, total_price, voucher_type, email_pay, phone_pay,
           mp_payment_id, mp_status, mp_status_detail, order_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          payment_method,
          total,
          voucher_type || null,
          payer_email || req.user.email || null,
          phone || null,
          mpResult ? mpResult.mp_payment_id : null,
          mpResult ? mpResult.status : null,
          mpResult ? mpResult.status_detail : null,
          order.order_id,
        ]
      );

      await client.query('COMMIT');

      const fullOrder = await OrderModel.findById(order.order_id);
      return res.status(201).json(fullOrder);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[orders/create:flat]', err);

      if (mpResult && mpResult.success) {
        // Pago cobrado pero BD falló → caso crítico que en G se resolverá con reembolso/webhook
        console.error('[orders/create:flat] CRITICAL: payment captured but DB failed.', {
          mp_payment_id: mpResult.mp_payment_id,
        });
      }

      if (err && err.message && err.message.includes('Stock insuficiente')) {
        return res.status(409).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Error al crear el pedido.' });
    } finally {
      client.release();
    }
  },

  // POST /api/orders/walk-in
  // Venta presencial (POS) registrada por un trabajador (emp/admin).
  // Formato del body (nested, alineado con OrderWalkInPayload del frontend):
  //   {
  //     order:   { location_id, customer_id, delivery_type? },
  //     details: [{ product_id, amount, unit_price, sub_total_price? }],
  //     payment: { payment_method, voucher_type? }
  //   }
  // El DNI/cliente es OBLIGATORIO (customer_id) para emitir comprobante.
  // Hace BEGIN/COMMIT/ROLLBACK: crea orders ('entregado'), order_detail,
  // descuenta inventario validando stock, y registra el payment.
  createWalkIn: async (req, res) => {
    const { order, details, payment } = req.body || {};

    // ---- Validaciones (antes de tocar BD) ----
    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ message: 'Se requiere al menos un item.' });
    }
    if (!order || !order.location_id) {
      return res.status(400).json({ message: 'Se requiere location_id.' });
    }
    if (!order.customer_id) {
      return res.status(400).json({ message: 'Cliente requerido (DNI obligatorio).' });
    }
    if (!payment || !payment.payment_method) {
      return res.status(400).json({ message: 'Método de pago requerido.' });
    }

    // POS solo acepta pagos presenciales (sin transferencia ni tarjeta MP online)
    const POS_PAYMENT_METHODS = ['efectivo', 'yape', 'plin', 'tarjeta'];
    if (!POS_PAYMENT_METHODS.includes(payment.payment_method)) {
      return res.status(400).json({
        message: `Método de pago inválido para POS. Debe ser: ${POS_PAYMENT_METHODS.join(', ')}.`
      });
    }
    if (payment.voucher_type && !VALID_VOUCHER_TYPES.includes(payment.voucher_type)) {
      return res.status(400).json({
        message: `voucher_type inválido. Debe ser: ${VALID_VOUCHER_TYPES.join(', ')}.`
      });
    }

    const delivery_type = order.delivery_type || 'pickup';
    if (!VALID_DELIVERY_TYPES.includes(delivery_type)) {
      return res.status(400).json({
        message: `delivery_type debe ser '${VALID_DELIVERY_TYPES.join("' o '")}'.`
      });
    }

    const location_id = order.location_id;
    const customer_id = order.customer_id;

    // Total calculado en backend (no se confía en el total del cliente)
    const total = details.reduce(
      (sum, d) => sum + Number(d.unit_price) * Number(d.amount), 0
    );
    if (!(total > 0)) {
      return res.status(400).json({ message: 'Total inválido.' });
    }

    // El cliente debe existir y estar activo
    const custResult = await pool.query(
      'SELECT customer_id FROM customer WHERE customer_id = $1 AND is_active = true',
      [customer_id]
    );
    if (custResult.rowCount === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    // ---- Transacción ----
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Pedido (POS = entregado de inmediato, registrado por el trabajador)
      const orderResult = await client.query(
        `INSERT INTO orders
          (order_state, delivery_type, order_date, total_price, customer_id, user_id, location_id)
         VALUES ('entregado', $1, NOW(), $2, $3, $4, $5)
         RETURNING *`,
        [delivery_type, total, customer_id, req.user.user_id, location_id]
      );
      const newOrder = orderResult.rows[0];

      // 2. Detalles + descuento de stock con validación atómica
      for (const d of details) {
        const sub_total = Number(d.unit_price) * Number(d.amount);

        await client.query(
          `INSERT INTO order_detail (amount, unit_price, sub_total_price, product_id, order_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [d.amount, d.unit_price, sub_total, d.product_id, newOrder.order_id]
        );

        const stockUpd = await client.query(
          `UPDATE inventory
           SET current_stock = current_stock - $1
           WHERE product_id = $2 AND location_id = $3 AND current_stock >= $1
           RETURNING current_stock`,
          [d.amount, d.product_id, location_id]
        );
        if (stockUpd.rowCount === 0) {
          throw new Error(`Stock insuficiente para el producto ID ${d.product_id}.`);
        }
      }

      // 3. Pago presencial
      await client.query(
        `INSERT INTO payment
          (payment_method, total_price, voucher_type, order_id)
         VALUES ($1, $2, $3, $4)`,
        [payment.payment_method, total, payment.voucher_type || 'ticket', newOrder.order_id]
      );

      await client.query('COMMIT');

      const fullOrder = await OrderModel.findById(newOrder.order_id);
      return res.status(201).json(fullOrder);
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) { /* noop */ }
      console.error('[orders/createWalkIn]', err);
      if (err && err.message && err.message.includes('Stock insuficiente')) {
        return res.status(409).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Error al procesar la venta.' });
    } finally {
      client.release();
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

      // "Ventas" = sólo ventas realizadas (en proceso + entregado), incluye POS
      // (walk-in con user_id) y web. Las pendientes (sin pago validado) NO suman
      // a ventas pero sí se cuentan aparte. Las canceladas quedan fuera.
      const kpisQ = pool.query(
        `SELECT
           COALESCE(SUM(total_price) FILTER (WHERE order_state IN ('en proceso','entregado')), 0)  AS ventas,
           COUNT(*) FILTER (WHERE order_state IN ('en proceso','entregado'))::int                  AS pedidos,
           COUNT(*) FILTER (WHERE order_state = 'pendiente')::int                                  AS pendientes,
           COALESCE(AVG(total_price) FILTER (WHERE order_state IN ('en proceso','entregado')), 0)  AS ticket_promedio
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
           AND order_state = 'entregado'`,
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
           AND o.order_state = 'entregado'
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

      // Top 3 productos vendidos por el trabajador en el turno
      const topQ = pool.query(
        `SELECT
           pr.product_id,
           pr.product_name,
           SUM(od.amount)::int          AS total_sold,
           COALESCE(SUM(od.sub_total_price), 0) AS revenue
         FROM order_detail od
         JOIN orders  o  ON o.order_id  = od.order_id
         JOIN product pr ON pr.product_id = od.product_id
         WHERE DATE(o.order_date) = $1::date
           AND o.user_id = $2::int
           AND o.order_state = 'entregado'
         GROUP BY pr.product_id, pr.product_name
         ORDER BY total_sold DESC
         LIMIT 3`,
        params
      );

      const [rTot, rPay, rTx, rTop] = await Promise.all([totalsQ, payQ, txQ, topQ]);
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
        top_products: rTop.rows.map(r => ({
          product_id: r.product_id,
          product_name: r.product_name,
          total_sold: toInt(r.total_sold),
          revenue: toFloat(r.revenue)
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
  },

  // PATCH /api/orders/:id/cancel
  // Cancelación del pedido por parte del cliente dueño.
  // Reglas:
  //   - Ownership: req.user.customer_id === order.customer_id
  //   - Estado debe ser 'pendiente' o 'en proceso'
  //   - payment_method NO puede ser 'tarjeta' (requeriría refund con MP)
  // Si pasa: BEGIN → UPDATE orders + restaurar stock por cada order_detail → COMMIT.
  cancel: async (req, res) => {
    const client = await pool.connect();

    try {
      const orderId = parseInt(req.params.id, 10);
      if (!orderId) return res.status(400).json({ message: 'ID inválido' });

      // 1. Verificar existencia + ownership + estado + método de pago
      const checkResult = await client.query(
        `SELECT o.order_id, o.order_state, o.customer_id, o.location_id, p.payment_method
         FROM orders o
         LEFT JOIN payment p ON p.order_id = o.order_id
         WHERE o.order_id = $1`,
        [orderId]
      );

      if (checkResult.rowCount === 0) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }

      const order = checkResult.rows[0];

      if (order.customer_id !== req.user.customer_id) {
        return res.status(403).json({ message: 'No tienes permiso para cancelar este pedido' });
      }

      if (!['pendiente', 'en proceso'].includes(order.order_state)) {
        return res.status(409).json({
          message: `No se puede cancelar un pedido en estado "${order.order_state}"`
        });
      }

      if (order.payment_method === 'tarjeta') {
        return res.status(409).json({
          message: 'Los pedidos pagados con tarjeta no pueden cancelarse desde aquí. Contacta al staff para procesar la devolución.'
        });
      }

      // 2. Transacción: cancelar + restaurar stock
      await client.query('BEGIN');

      await client.query(
        `UPDATE orders SET order_state = 'cancelado' WHERE order_id = $1`,
        [orderId]
      );

      const detailsResult = await client.query(
        `SELECT product_id, amount FROM order_detail WHERE order_id = $1`,
        [orderId]
      );

      for (const detail of detailsResult.rows) {
        // product_id puede ser NULL si el producto fue eliminado: en ese caso no se restaura.
        if (detail.product_id) {
          await client.query(
            `UPDATE inventory
             SET current_stock = current_stock + $1
             WHERE product_id = $2 AND location_id = $3`,
            [detail.amount, detail.product_id, order.location_id]
          );
        }
      }

      await client.query('COMMIT');

      const updatedOrder = await OrderModel.findById(orderId);
      return res.json(updatedOrder);
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) { /* noop */ }
      console.error('[orders/cancel]', err);
      return res.status(500).json({ message: 'Error al cancelar el pedido' });
    } finally {
      client.release();
    }
  },

  // POST /api/orders/:id/cancel-with-refund
  // Cancelación de pedidos pagados con TARJETA por parte del staff (emp/admin).
  // Requiere que el staff confirme que ya procesó el refund manual en MercadoPago.
  // Reglas:
  //   - Estado debe ser 'pendiente' o 'en proceso'
  //   - payment_method debe ser 'tarjeta'
  //   - emp solo puede cancelar pedidos de su sede
  //   - Hasta 7 días desde el pedido. Admin puede forzar con force=true.
  //   - refund_confirmed debe ser true (auditoría: el staff afirma que lo procesó)
  //   - reason mínimo 5 caracteres
  // Si pasa: BEGIN → UPDATE orders (estado + auditoría) + restaurar stock → COMMIT.
  cancelWithRefund: async (req, res) => {
    const client = await pool.connect();

    try {
      const orderId = parseInt(req.params.id, 10);
      const { reason, refund_confirmed, force = false } = req.body || {};

      if (!orderId) return res.status(400).json({ message: 'ID inválido' });
      if (!refund_confirmed) {
        return res.status(400).json({
          message: 'Debe confirmar que procesó el refund en MercadoPago'
        });
      }
      if (!reason || String(reason).trim().length < 5) {
        return res.status(400).json({
          message: 'Razón de cancelación requerida (mín. 5 caracteres)'
        });
      }

      const checkResult = await client.query(
        `SELECT o.order_id, o.order_state, o.location_id, o.order_date,
                p.payment_method
         FROM orders o
         LEFT JOIN payment p ON p.order_id = o.order_id
         WHERE o.order_id = $1`,
        [orderId]
      );

      if (checkResult.rowCount === 0) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }

      const order = checkResult.rows[0];

      // emp solo puede cancelar pedidos de SU sede
      if (req.user.role === 'emp' && order.location_id !== req.user.location_id) {
        return res.status(403).json({ message: 'Solo puede cancelar pedidos de su sede' });
      }

      if (!['pendiente', 'en proceso'].includes(order.order_state)) {
        return res.status(409).json({
          message: `No se puede cancelar un pedido en estado "${order.order_state}"`
        });
      }

      if (order.payment_method !== 'tarjeta') {
        return res.status(409).json({
          message: 'Este endpoint es solo para pedidos con tarjeta. Use el endpoint regular para otros métodos.'
        });
      }

      const orderDate = new Date(order.order_date);
      const daysSince = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 7 && !force) {
        return res.status(409).json({
          message: `Han pasado ${Math.floor(daysSince)} días desde el pedido. Solo admin puede forzar.`,
          days_since: Math.floor(daysSince),
          requires_force: true,
        });
      }
      if (daysSince > 7 && force && req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Solo admin puede forzar cancelaciones después de 7 días'
        });
      }

      await client.query('BEGIN');

      await client.query(
        `UPDATE orders
         SET order_state = 'cancelado',
             cancelled_by_user_id = $1,
             cancelled_at = CURRENT_TIMESTAMP,
             cancellation_reason = $2,
             refund_processed = true
         WHERE order_id = $3`,
        [req.user.user_id, String(reason).trim(), orderId]
      );

      const detailsResult = await client.query(
        `SELECT product_id, amount FROM order_detail WHERE order_id = $1`,
        [orderId]
      );

      for (const detail of detailsResult.rows) {
        if (detail.product_id) {
          await client.query(
            `UPDATE inventory
             SET current_stock = current_stock + $1
             WHERE product_id = $2 AND location_id = $3`,
            [detail.amount, detail.product_id, order.location_id]
          );
        }
      }

      await client.query('COMMIT');

      const updatedOrder = await OrderModel.findById(orderId);
      return res.json(updatedOrder);
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) { /* noop */ }
      console.error('[orders/cancelWithRefund]', err);
      return res.status(500).json({ message: 'Error al cancelar el pedido' });
    } finally {
      client.release();
    }
  }
};

module.exports = orderController;