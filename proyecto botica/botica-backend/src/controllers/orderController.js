const OrderModel = require('../models/orderModel');
const LocationModel = require('../models/locationModel');
const pool = require('../config/db');
const { toFloat, toInt } = require('../utils/casting');
const { todayInLima } = require('../utils/dates');
const { processCardPayment } = require('../services/paymentService');
const { buildVoucherPdf } = require('../services/voucherService');
const { uploadBuffer } = require('../config/s3');
const { rucError, billingNameError, sanitizeRuc } = require('../utils/billing');

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

  // GET /api/orders/:id/voucher
  // Devuelve la URL (CloudFront) del comprobante interno en PDF del pedido.
  // Generación PEREZOSA con caché: si ya existe (payment.voucher_pdf_url) se
  // reutiliza; si no, se genera el PDF, se sube a S3 (prefijo vouchers/) y se
  // guarda la URL. Autorización: el cliente dueño, o staff/admin.
  getVoucher: async (req, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (!orderId) return res.status(400).json({ message: 'ID inválido.' });

      const order = await OrderModel.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });

      // Ownership: el cliente solo accede a sus propios pedidos.
      if (req.user.role === 'cust' && order.customer_id !== req.user.customer_id) {
        return res.status(403).json({ message: 'No tienes permiso para ver este comprobante.' });
      }

      if (!order.payment) {
        return res.status(400).json({ message: 'El pedido aún no tiene un pago registrado.' });
      }

      // Guardia defensiva: al CLIENTE no se le expone el comprobante hasta que
      // el pago esté confirmado/validado (tarjeta aprobada, manual validado por
      // el staff → 'en proceso'/'entregado', efectivo → solo 'entregado').
      // El staff/admin siempre pueden generarlo. Espeja isPaymentConfirmed del
      // frontend (lib/orderStatus.ts).
      if (req.user.role === 'cust') {
        const method = order.payment.payment_method;
        const state = order.order_state;
        const confirmed =
          state !== 'cancelado' &&
          (method === 'tarjeta'
            ? state !== 'pendiente'
            : method === 'efectivo'
            ? state === 'entregado'
            : state === 'en proceso' || state === 'entregado');
        if (!confirmed) {
          return res.status(403).json({
            message: 'El comprobante estará disponible cuando se valide tu pago.',
          });
        }
      }

      // Ya generado → reutilizar (no regenerar).
      if (order.payment.voucher_pdf_url) {
        return res.json({
          order_id: orderId,
          voucher_type: order.payment.voucher_type || null,
          voucher_pdf_url: order.payment.voucher_pdf_url,
          cached: true,
        });
      }

      const location = order.location_id
        ? await LocationModel.findById(order.location_id)
        : null;

      const pdfBuffer = await buildVoucherPdf({
        order: {
          order_id: order.order_id,
          order_date: order.order_date,
          total_price: order.total_price,
          delivery_type: order.delivery_type,
        },
        customer: { full_name: order.customer_name, dni: order.customer_dni },
        location: location || { location_name: order.location_name },
        items: (order.details || []).map((d) => ({
          product_name: d.product_name,
          product_id: d.product_id,
          amount: d.amount,
          unit_price: d.unit_price,
          sub_total_price: d.sub_total_price,
        })),
        payment: {
          payment_method: order.payment.payment_method,
          voucher_type: order.payment.voucher_type,
          billing_ruc: order.payment.billing_ruc,
          billing_name: order.payment.billing_name,
        },
      });

      const { url } = await uploadBuffer(pdfBuffer, 'application/pdf', 'vouchers');

      await pool.query(
        `UPDATE payment SET voucher_pdf_url = $1 WHERE order_id = $2`,
        [url, orderId]
      );

      return res.json({
        order_id: orderId,
        voucher_type: order.payment.voucher_type || null,
        voucher_pdf_url: url,
        cached: false,
      });
    } catch (err) {
      console.error('[orders/getVoucher]', err);
      return res.status(500).json({ message: 'Error al generar el comprobante.' });
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
      billing_ruc,
      billing_name,
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

    // Datos fiscales: SOLO aplican a "factura" y se re-validan en backend (no se
    // confía en el front). Para boleta/ticket quedan en NULL.
    let billingRuc = null;
    let billingName = null;
    if (voucher_type === 'factura') {
      const rErr = rucError(billing_ruc);
      if (rErr) return res.status(400).json({ message: rErr });
      const nErr = billingNameError(billing_name);
      if (nErr) return res.status(400).json({ message: nErr });
      billingRuc = sanitizeRuc(billing_ruc);
      billingName = String(billing_name).trim();
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

    // ── Recalcular totales desde la BD (fuente de verdad) ──────────────
    // NUNCA se confía en el unit_price que manda el frontend: se relee el
    // product_price oficial. Además se redondea SIEMPRE a 2 decimales para
    // evitar el "Invalid transaction_amount" de MercadoPago, que se dispara
    // cuando transaction_amount llega con cola de flotante (ej. 58.6999999).
    const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

    const productIds = [...new Set(items.map((it) => Number(it.product_id)))];
    const priceResult = await pool.query(
      `SELECT product_id, product_price FROM product
       WHERE product_id = ANY($1::int[]) AND is_active = true`,
      [productIds]
    );
    const priceMap = new Map(
      priceResult.rows.map((r) => [r.product_id, Number(r.product_price)])
    );

    // Construir las líneas del pedido con el precio oficial de la BD.
    const pricedItems = [];
    for (const it of items) {
      const pid = Number(it.product_id);
      const dbPrice = priceMap.get(pid);
      if (dbPrice == null) {
        return res.status(400).json({
          message: `Producto ID ${pid} no disponible.`,
        });
      }
      const amount = Number(it.amount);
      pricedItems.push({
        product_id: pid,
        amount,
        unit_price: round2(dbPrice),
        sub_total: round2(dbPrice * amount),
      });
    }

    // Totales (regla: envío gratis si pickup o subtotal >= 50)
    const subtotal = round2(pricedItems.reduce((sum, i) => sum + i.sub_total, 0));
    const shipping = delivery_type === 'pickup' ? 0 : (subtotal >= 50 ? 0 : 8);
    const total = round2(subtotal + shipping);

    if (!(total > 0)) {
      return res.status(400).json({ message: 'Total inválido.' });
    }

    // Procesar pago con MercadoPago ANTES de tocar BD
    let mpResult = null;
    if (payment_method === 'tarjeta') {
      mpResult = await processCardPayment({
        token: card_token,
        amount: total, // Number con 2 decimales, recalculado en backend
        payment_method_id: mp_payment_method_id,
        installments: installments || 1,
        email: payer_email || req.user.email,
        description: `Pedido Botica Central - ${items.length} producto(s)`,
        payer: { identification: payer_identification },
      });

      if (!mpResult.success) {
        console.error('[payment] MercadoPago rechazó el cargo', {
          transaction_amount: total,
          status: mpResult.status,
          status_detail: mpResult.status_detail,
          error: mpResult.error,
        });
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

      for (const it of pricedItems) {
        await client.query(
          `INSERT INTO order_detail (amount, unit_price, sub_total_price, product_id, order_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [it.amount, it.unit_price, it.sub_total, it.product_id, order.order_id]
        );
      }

      // Payment: incluye campos MP si era tarjeta (la tabla payment fue ampliada
      // con mp_payment_id, mp_status, mp_status_detail en .env/BD).
      await client.query(
        `INSERT INTO payment
          (payment_method, total_price, voucher_type, email_pay, phone_pay,
           billing_ruc, billing_name,
           mp_payment_id, mp_status, mp_status_detail, order_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          payment_method,
          total,
          voucher_type || null,
          payer_email || req.user.email || null,
          phone || null,
          billingRuc,
          billingName,
          mpResult ? mpResult.mp_payment_id : null,
          mpResult ? mpResult.status : null,
          mpResult ? mpResult.status_detail : null,
          order.order_id,
        ]
      );

      // Descuento de stock SOLO si el pago ya quedó confirmado (tarjeta aprobada
      // → estado 'en proceso'). Para métodos manuales (yape/plin/transferencia,
      // 'pendiente') y efectivo contra entrega ('en proceso', se cobra al
      // entregar) NO se descuenta aún: se hará al validar/entregar. Idempotente.
      await OrderModel.syncStock(client, order.order_id);

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

      // 2. Detalles del pedido
      for (const d of details) {
        const sub_total = Number(d.unit_price) * Number(d.amount);
        await client.query(
          `INSERT INTO order_detail (amount, unit_price, sub_total_price, product_id, order_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [d.amount, d.unit_price, sub_total, d.product_id, newOrder.order_id]
        );
      }

      // 3. Pago presencial
      await client.query(
        `INSERT INTO payment
          (payment_method, total_price, voucher_type, order_id)
         VALUES ($1, $2, $3, $4)`,
        [payment.payment_method, total, payment.voucher_type || 'ticket', newOrder.order_id]
      );

      // 4. POS: la venta YA ocurrió (estado 'entregado') → el pago está
      // confirmado, así que se descuenta el stock ahora (validando disponibilidad
      // de forma atómica). Idempotente y marca stock_discounted para que una
      // cancelación futura reponga correctamente.
      await OrderModel.syncStock(client, newOrder.order_id);

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
      // "Hoy" SIEMPRE en zona de Perú (America/Lima), no en UTC. Ver utils/dates.
      const date = req.query.date || todayInLima();
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

  // GET /api/orders/sales-series?days=7&location_id=
  // Serie diaria de ventas para el gráfico del dashboard del staff.
  // "Ventas" = pedidos 'en proceso' + 'entregado' (misma definición que getStats).
  //  - emp   → SIEMPRE su sede (req.user.location_id), ignora el query.
  //  - admin → ?location_id opcional (sin él, todas las sedes).
  // Devuelve un punto por día (incluye días sin ventas con 0) vía generate_series.
  getSalesSeries: async (req, res) => {
    try {
      let days = parseInt(req.query.days, 10);
      if (!Number.isFinite(days) || days < 1) days = 7;
      if (days > 31) days = 31; // tope defensivo

      let locId;
      if (req.user.role === 'emp') {
        locId = req.user.location_id;
      } else {
        locId = req.query.location_id ? parseInt(req.query.location_id, 10) : null;
      }

      const result = await pool.query(
        `WITH dias AS (
           SELECT (CURRENT_DATE - gs)::date AS dia
           FROM generate_series(0, $1::int - 1) AS gs
         )
         SELECT
           to_char(d.dia, 'YYYY-MM-DD') AS date,
           COALESCE(SUM(o.total_price)
             FILTER (WHERE o.order_state IN ('en proceso','entregado')), 0) AS ventas,
           COUNT(o.order_id)
             FILTER (WHERE o.order_state IN ('en proceso','entregado'))::int AS pedidos
         FROM dias d
         LEFT JOIN orders o
           ON DATE(o.order_date) = d.dia
          AND ($2::int IS NULL OR o.location_id = $2::int)
         GROUP BY d.dia
         ORDER BY d.dia ASC`,
        [days, locId]
      );

      return res.json({
        days,
        location_id: locId,
        series: result.rows.map(r => ({
          date: r.date, // 'YYYY-MM-DD' (to_char en SQL, sin ambigüedad de zona horaria)
          ventas: toFloat(r.ventas),
          pedidos: toInt(r.pedidos)
        }))
      });
    } catch (err) {
      console.error('[orders/getSalesSeries]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // GET /api/orders/shift-summary?date=YYYY-MM-DD
  getShiftSummary: async (req, res) => {
    try {
      // "Hoy" SIEMPRE en zona de Perú (America/Lima), no en UTC. Ver utils/dates.
      const date = req.query.date || todayInLima();
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

      // Transacción: cambia el estado y SINCRONIZA el stock en un solo paso.
      //  - Validar pago manual (pendiente → en proceso) o entregar efectivo
      //    (→ entregado): el pago queda confirmado → DESCUENTA stock.
      //  - Cancelar un pedido ya descontado (→ cancelado): REPONE stock.
      //  - Idempotente vía orders.stock_discounted (no doble descuento/reposición).
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE orders SET order_state = $1 WHERE order_id = $2`,
          [order_state, orderId]
        );
        await OrderModel.syncStock(client, orderId);
        await client.query('COMMIT');
      } catch (e) {
        try { await client.query('ROLLBACK'); } catch (_) { /* noop */ }
        // Stock insuficiente al validar el pago → 409 claro para el staff.
        if (e && e.status === 409) {
          return res.status(409).json({ message: e.message });
        }
        throw e;
      } finally {
        client.release();
      }

      // Devolvemos el pedido COMPLETO (cliente, entrega, productos, pago) para
      // que el frontend no se quede con datos parciales tras la acción.
      const fullOrder = await OrderModel.findById(orderId);
      return res.json(fullOrder);
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

      // 2. Transacción: cancelar + (si corresponde) restaurar stock.
      await client.query('BEGIN');

      await client.query(
        `UPDATE orders SET order_state = 'cancelado' WHERE order_id = $1`,
        [orderId]
      );

      // Repone stock SOLO si el pedido YA lo había descontado (idempotente).
      // Un pedido manual aún 'pendiente' (sin validar) no descontó nada → no se
      // toca el inventario.
      await OrderModel.syncStock(client, orderId);

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

      // Repone stock si el pedido lo había descontado (tarjeta aprobada siempre
      // descuenta al crear). Idempotente vía orders.stock_discounted.
      await OrderModel.syncStock(client, orderId);

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