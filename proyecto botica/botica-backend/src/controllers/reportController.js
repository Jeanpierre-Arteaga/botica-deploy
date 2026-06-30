const pool = require('../config/db');
const { toFloat, toInt } = require('../utils/casting');
const { buildSalesReportWorkbook } = require('../services/reportExcelService');

// ============================================================
// Cálculo del reporte de ventas (compartido por /sales y /export)
// ============================================================
// date_from / date_to: 'YYYY-MM-DD'. locId: number | null (null = todas las sedes).
// Regla de VENTA REALIZADA: solo cuentan los pedidos en estado 'en proceso' o
// 'entregado' (misma definición que el Dashboard y orderController.getStats). Los
// 'pendiente' (pago manual sin validar) y los 'cancelado' NO suman a ninguna
// métrica ni gráfica.
async function computeSalesReport(date_from, date_to, locId) {
  const params = [date_from, date_to, locId];

  const qTotales = pool.query(
    `SELECT
       COALESCE(SUM(total_price), 0)  AS total_sales,
       COUNT(*)::int                  AS total_orders,
       COALESCE(AVG(total_price), 0)  AS average_ticket
     FROM orders
     WHERE order_date::date BETWEEN $1::date AND $2::date
       AND order_state IN ('en proceso','entregado')
       AND ($3::int IS NULL OR location_id = $3::int)`,
    params
  );

  // Unidades totales vendidas (suma de cantidades de cada línea).
  const qUnits = pool.query(
    `SELECT COALESCE(SUM(od.amount), 0)::int AS total_units
       FROM order_detail od
       JOIN orders o ON od.order_id = o.order_id
      WHERE o.order_date::date BETWEEN $1::date AND $2::date
        AND o.order_state IN ('en proceso','entregado')
        AND ($3::int IS NULL OR o.location_id = $3::int)`,
    params
  );

  const qByDay = pool.query(
    `SELECT
       TO_CHAR(DATE(order_date), 'YYYY-MM-DD') AS date,
       COALESCE(SUM(total_price), 0)            AS total,
       COUNT(*)::int                            AS count
     FROM orders
     WHERE order_date::date BETWEEN $1::date AND $2::date
       AND order_state IN ('en proceso','entregado')
       AND ($3::int IS NULL OR location_id = $3::int)
     GROUP BY DATE(order_date)
     ORDER BY DATE(order_date) ASC`,
    params
  );

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
       AND o.order_state IN ('en proceso','entregado')
       AND ($3::int IS NULL OR o.location_id = $3::int)
     GROUP BY c.category_id, c.category_name
     ORDER BY total DESC`,
    params
  );

  // Ventas diarias por categoría (para la gráfica de evolución multi-serie).
  const qByDayCategory = pool.query(
    `SELECT
       TO_CHAR(DATE(o.order_date), 'YYYY-MM-DD')   AS date,
       c.category_id,
       COALESCE(c.category_name, 'Sin categoría')  AS category_name,
       COALESCE(SUM(od.sub_total_price), 0)        AS total
     FROM order_detail od
     JOIN orders     o ON od.order_id   = o.order_id
     LEFT JOIN product  p ON od.product_id = p.product_id
     LEFT JOIN category c ON p.category_id = c.category_id
     WHERE o.order_date::date BETWEEN $1::date AND $2::date
       AND o.order_state IN ('en proceso','entregado')
       AND ($3::int IS NULL OR o.location_id = $3::int)
     GROUP BY DATE(o.order_date), c.category_id, c.category_name
     ORDER BY DATE(o.order_date) ASC`,
    params
  );

  const qByPayment = pool.query(
    `SELECT
       COALESCE(pay.payment_method, 'sin_pago') AS payment_method,
       COALESCE(SUM(o.total_price), 0)          AS total,
       COUNT(o.order_id)::int                   AS count
     FROM orders o
     LEFT JOIN payment pay ON pay.order_id = o.order_id
     WHERE o.order_date::date BETWEEN $1::date AND $2::date
       AND o.order_state IN ('en proceso','entregado')
       AND ($3::int IS NULL OR o.location_id = $3::int)
     GROUP BY COALESCE(pay.payment_method, 'sin_pago')
     ORDER BY total DESC`,
    params
  );

  // Top 15 productos por cantidad vendida (con su categoría e imagen principal).
  const qTopProducts = pool.query(
    `SELECT
       COALESCE(p.product_id, od.product_id)            AS product_id,
       COALESCE(p.product_name, '(producto eliminado)') AS product_name,
       COALESCE(c.category_name, 'Sin categoría')       AS category_name,
       MAX(img.url)                                     AS image_url,
       COALESCE(SUM(od.amount), 0)::int                 AS quantity_sold,
       COALESCE(SUM(od.sub_total_price), 0)             AS total
     FROM order_detail od
     JOIN orders  o ON od.order_id   = o.order_id
     LEFT JOIN product  p ON od.product_id = p.product_id
     LEFT JOIN category c ON p.category_id = c.category_id
     LEFT JOIN image   img ON img.product_id = p.product_id AND img.type = 'main'
     WHERE o.order_date::date BETWEEN $1::date AND $2::date
       AND o.order_state IN ('en proceso','entregado')
       AND ($3::int IS NULL OR o.location_id = $3::int)
     GROUP BY COALESCE(p.product_id, od.product_id),
              COALESCE(p.product_name, '(producto eliminado)'),
              COALESCE(c.category_name, 'Sin categoría')
     ORDER BY quantity_sold DESC
     LIMIT 15`,
    params
  );

  const [rTot, rUnits, rByDay, rByDayCat, rByCat, rByPay, rTop] = await Promise.all([
    qTotales, qUnits, qByDay, qByDayCategory, qByCategory, qByPayment, qTopProducts
  ]);

  const totRow = rTot.rows[0] || {};
  const totalSales = toFloat(totRow.total_sales);
  const totalOrders = toInt(totRow.total_orders);
  const averageTicket = toFloat(totRow.average_ticket);
  const totalUnits = toInt(rUnits.rows[0] && rUnits.rows[0].total_units);

  const byPaymentMethod = rByPay.rows.map((r) => {
    const total = toFloat(r.total);
    return {
      payment_method: r.payment_method,
      total,
      count: toInt(r.count),
      percentage: totalSales > 0 ? Math.round((total / totalSales) * 100) : 0
    };
  });

  return {
    totalSales,
    totalOrders,
    averageTicket,
    totalUnits,
    byDay: rByDay.rows.map((r) => ({ date: r.date, total: toFloat(r.total), count: toInt(r.count) })),
    byDayCategory: rByDayCat.rows.map((r) => ({
      date: r.date,
      category_id: r.category_id,
      category_name: r.category_name,
      total: toFloat(r.total)
    })),
    byCategory: rByCat.rows.map((r) => ({
      category_id: r.category_id,
      category_name: r.category_name,
      total: toFloat(r.total),
      count: toInt(r.count)
    })),
    byPaymentMethod,
    topProducts: rTop.rows.map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name,
      category_name: r.category_name,
      image_url: r.image_url || null,
      quantity_sold: toInt(r.quantity_sold),
      total: toFloat(r.total)
    }))
  };
}

// Detalle de pedidos del período (nivel transacción) — solo para el Excel.
// Aplica la MISMA regla de venta realizada ('en proceso'/'entregado') que los
// agregados, para que la suma de las filas del detalle cuadre con los KPIs.
async function getOrdersDetail(date_from, date_to, locId) {
  const result = await pool.query(
    `SELECT o.order_id,
            TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') AS order_date,
            COALESCE(l.location_name, '—')             AS location_name,
            COALESCE(c.full_name, 'Venta web')         AS customer_name,
            (SELECT COUNT(*)::int FROM order_detail od WHERE od.order_id = o.order_id) AS items,
            COALESCE(pay.payment_method, '—')          AS payment_method,
            o.order_state,
            o.total_price
       FROM orders o
       LEFT JOIN location l ON o.location_id = l.location_id
       LEFT JOIN customer c ON o.customer_id = c.customer_id
       LEFT JOIN payment  pay ON pay.order_id = o.order_id
      WHERE o.order_date::date BETWEEN $1::date AND $2::date
        AND o.order_state IN ('en proceso','entregado')
        AND ($3::int IS NULL OR o.location_id = $3::int)
      ORDER BY o.order_date DESC`,
    [date_from, date_to, locId]
  );
  return result.rows.map((r) => ({
    order_id: r.order_id,
    order_date: r.order_date,
    location_name: r.location_name,
    customer_name: r.customer_name,
    items: toInt(r.items),
    payment_method: r.payment_method,
    order_state: r.order_state,
    total_price: toFloat(r.total_price)
  }));
}

async function resolveSedeName(locId) {
  if (!locId) return 'Todas las sedes';
  const r = await pool.query(`SELECT location_name FROM location WHERE location_id = $1`, [locId]);
  return (r.rows[0] && r.rows[0].location_name) || `Sede ${locId}`;
}

const reportController = {

  // GET /api/reports/sales?date_from=&date_to=&location_id=
  sales: async (req, res) => {
    try {
      const { date_from, date_to } = req.query;
      const locId = req.query.location_id ? parseInt(req.query.location_id, 10) : null;
      if (!date_from || !date_to) {
        return res.status(400).json({ message: 'Se requieren date_from y date_to (YYYY-MM-DD).' });
      }
      const report = await computeSalesReport(date_from, date_to, locId);
      return res.json(report);
    } catch (err) {
      console.error('[reports/sales]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // GET /api/reports/export?date_from=&date_to=&location_id=  → descarga .xlsx
  exportExcel: async (req, res) => {
    try {
      const { date_from, date_to } = req.query;
      const locId = req.query.location_id ? parseInt(req.query.location_id, 10) : null;
      if (!date_from || !date_to) {
        return res.status(400).json({ message: 'Se requieren date_from y date_to (YYYY-MM-DD).' });
      }

      const [report, orders, sedeName] = await Promise.all([
        computeSalesReport(date_from, date_to, locId),
        getOrdersDetail(date_from, date_to, locId),
        resolveSedeName(locId)
      ]);

      const buffer = await buildSalesReportWorkbook({
        report, orders, sedeName, date_from, date_to
      });

      const slug = sedeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const filename = `reporte_ventas_${slug}_${date_from}_a_${date_to}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err) {
      console.error('[reports/export]', err);
      return res.status(500).json({ message: 'No se pudo generar el reporte Excel.' });
    }
  }
};

module.exports = reportController;
