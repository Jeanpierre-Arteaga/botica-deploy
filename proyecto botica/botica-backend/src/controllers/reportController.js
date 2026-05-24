const pool = require('../config/db');
const { toFloat, toInt } = require('../utils/casting');

const reportController = {

  // GET /api/reports/sales?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&location_id=
  sales: async (req, res) => {
    try {
      const { date_from, date_to } = req.query;
      const locId = req.query.location_id ? parseInt(req.query.location_id, 10) : null;

      if (!date_from || !date_to) {
        return res.status(400).json({
          message: 'Se requieren los parámetros date_from y date_to (formato YYYY-MM-DD).'
        });
      }

      const params = [date_from, date_to, locId];

      // 1. Totales del rango
      const qTotales = pool.query(
        `SELECT
           COALESCE(SUM(total_price), 0)  AS total_sales,
           COUNT(*)::int                  AS total_orders,
           COALESCE(AVG(total_price), 0)  AS average_ticket
         FROM orders
         WHERE order_date::date BETWEEN $1::date AND $2::date
           AND order_state != 'cancelado'
           AND ($3::int IS NULL OR location_id = $3::int)`,
        params
      );

      // 2. Ventas por día
      const qByDay = pool.query(
        `SELECT
           TO_CHAR(DATE(order_date), 'YYYY-MM-DD') AS date,
           COALESCE(SUM(total_price), 0)            AS total,
           COUNT(*)::int                            AS count
         FROM orders
         WHERE order_date::date BETWEEN $1::date AND $2::date
           AND order_state != 'cancelado'
           AND ($3::int IS NULL OR location_id = $3::int)
         GROUP BY DATE(order_date)
         ORDER BY DATE(order_date) ASC`,
        params
      );

      // 3. Ventas por categoría
      // LEFT JOIN para no perder ventas de productos huérfanos o sin categoría
      const qByCategory = pool.query(
        `SELECT
           c.category_id,
           COALESCE(c.category_name, 'Sin categoría') AS category_name,
           COALESCE(SUM(od.sub_total_price), 0)       AS total,
           COUNT(DISTINCT o.order_id)::int            AS count
         FROM order_detail od
         JOIN orders     o ON od.order_id   = o.order_id
         LEFT JOIN product  p ON od.product_id = p.product_id
         LEFT JOIN category c ON p.category_id = c.category_id
         WHERE o.order_date::date BETWEEN $1::date AND $2::date
           AND o.order_state != 'cancelado'
           AND ($3::int IS NULL OR o.location_id = $3::int)
         GROUP BY c.category_id, c.category_name
         ORDER BY total DESC`,
        params
      );

      // 4. Ventas por método de pago (incluye orders sin payment como 'sin_pago')
      const qByPayment = pool.query(
        `SELECT
           COALESCE(pay.payment_method, 'sin_pago') AS payment_method,
           COALESCE(SUM(o.total_price), 0)          AS total,
           COUNT(o.order_id)::int                   AS count
         FROM orders o
         LEFT JOIN payment pay ON pay.order_id = o.order_id
         WHERE o.order_date::date BETWEEN $1::date AND $2::date
           AND o.order_state != 'cancelado'
           AND ($3::int IS NULL OR o.location_id = $3::int)
         GROUP BY COALESCE(pay.payment_method, 'sin_pago')
         ORDER BY total DESC`,
        params
      );

      // 5. Top 10 productos por cantidad vendida
      // LEFT JOIN product para preservar líneas de productos eliminados
      const qTopProducts = pool.query(
        `SELECT
           COALESCE(p.product_id, od.product_id)        AS product_id,
           COALESCE(p.product_name, '(producto eliminado)') AS product_name,
           COALESCE(SUM(od.amount), 0)::int             AS quantity_sold,
           COALESCE(SUM(od.sub_total_price), 0)         AS total
         FROM order_detail od
         JOIN orders  o ON od.order_id   = o.order_id
         LEFT JOIN product p ON od.product_id = p.product_id
         WHERE o.order_date::date BETWEEN $1::date AND $2::date
           AND o.order_state != 'cancelado'
           AND ($3::int IS NULL OR o.location_id = $3::int)
         GROUP BY COALESCE(p.product_id, od.product_id),
                  COALESCE(p.product_name, '(producto eliminado)')
         ORDER BY quantity_sold DESC
         LIMIT 10`,
        params
      );

      const [rTot, rByDay, rByCat, rByPay, rTop] = await Promise.all([
        qTotales, qByDay, qByCategory, qByPayment, qTopProducts
      ]);

      const totRow = rTot.rows[0] || {};
      const totalSales = toFloat(totRow.total_sales);
      const totalOrders = toInt(totRow.total_orders);
      const averageTicket = toFloat(totRow.average_ticket);

      const byPaymentMethod = rByPay.rows.map(r => {
        const total = toFloat(r.total);
        const percentage = totalSales > 0
          ? Math.round((total / totalSales) * 100)
          : 0;
        return {
          payment_method: r.payment_method,
          total,
          count: toInt(r.count),
          percentage
        };
      });

      return res.json({
        totalSales,
        totalOrders,
        averageTicket,
        byDay: rByDay.rows.map(r => ({
          date: r.date,
          total: toFloat(r.total),
          count: toInt(r.count)
        })),
        byCategory: rByCat.rows.map(r => ({
          category_id: r.category_id,
          category_name: r.category_name,
          total: toFloat(r.total),
          count: toInt(r.count)
        })),
        byPaymentMethod,
        topProducts: rTop.rows.map(r => ({
          product_id: r.product_id,
          product_name: r.product_name,
          quantity_sold: toInt(r.quantity_sold),
          total: toFloat(r.total)
        }))
      });
    } catch (err) {
      console.error('[reports/sales]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = reportController;
