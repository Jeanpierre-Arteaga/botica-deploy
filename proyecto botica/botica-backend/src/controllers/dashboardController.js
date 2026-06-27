const pool = require('../config/db');
const { toFloat, toInt } = require('../utils/casting');
const { todayInLima } = require('../utils/dates');

const pctChange = (actual, anterior) => {
  const a = parseFloat(actual);
  const b = parseFloat(anterior);
  if (!Number.isFinite(b) || b === 0) return Number.isFinite(a) && a > 0 ? 100 : 0;
  return Math.round(((a - b) / b) * 100);
};

const dashboardController = {

  // GET /api/dashboard/summary?location_id=&date=YYYY-MM-DD
  summary: async (req, res) => {
    try {
      // "Hoy" SIEMPRE en zona de Perú (America/Lima), no en UTC. Ver utils/dates.
      const date = req.query.date || todayInLima();
      const locId = req.query.location_id ? parseInt(req.query.location_id, 10) : null;

      // Cada query recibe [date, location_id_or_null]
      const params = [date, locId];

      // 1. KPIs del día de referencia
      const qHoy = pool.query(
        `SELECT
           COALESCE(SUM(total_price), 0) AS ventas,
           COUNT(*)::int                  AS pedidos,
           COUNT(*) FILTER (WHERE order_state = 'pendiente')::int AS pendientes,
           COALESCE(AVG(total_price), 0)  AS ticket_promedio
         FROM orders
         WHERE DATE(order_date) = $1::date
           AND order_state != 'cancelado'
           AND ($2::int IS NULL OR location_id = $2::int)`,
        params
      );

      // 2. KPIs del día anterior
      const qAyer = pool.query(
        `SELECT
           COALESCE(SUM(total_price), 0) AS ventas,
           COUNT(*)::int                  AS pedidos
         FROM orders
         WHERE DATE(order_date) = ($1::date - INTERVAL '1 day')
           AND order_state != 'cancelado'
           AND ($2::int IS NULL OR location_id = $2::int)`,
        params
      );

      // 3. KPIs del mes actual
      const qMes = pool.query(
        `SELECT
           COALESCE(SUM(total_price), 0) AS ventas,
           COUNT(*)::int                  AS pedidos
         FROM orders
         WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', $1::date)
           AND order_state != 'cancelado'
           AND ($2::int IS NULL OR location_id = $2::int)`,
        params
      );

      // 4. KPIs del mes anterior
      const qMesAnt = pool.query(
        `SELECT
           COALESCE(SUM(total_price), 0) AS ventas,
           COUNT(*)::int                  AS pedidos
         FROM orders
         WHERE DATE_TRUNC('month', order_date)
               = DATE_TRUNC('month', $1::date - INTERVAL '1 month')
           AND order_state != 'cancelado'
           AND ($2::int IS NULL OR location_id = $2::int)`,
        params
      );

      // 5. Serie de últimos 7 días (incluye días sin ventas)
      const qSerie = pool.query(
        `SELECT
           TO_CHAR(d::date, 'YYYY-MM-DD')       AS date,
           COALESCE(SUM(o.total_price), 0)      AS total,
           COUNT(o.order_id)::int               AS count
         FROM generate_series(
                $1::date - INTERVAL '6 day',
                $1::date,
                INTERVAL '1 day'
              ) d
         LEFT JOIN orders o
           ON DATE(o.order_date) = d::date
          AND o.order_state != 'cancelado'
          AND ($2::int IS NULL OR o.location_id = $2::int)
         GROUP BY d
         ORDER BY d ASC`,
        params
      );

      // 6. Pedidos por estado del mes actual
      const qEstados = pool.query(
        `SELECT order_state, COUNT(*)::int AS count
         FROM orders
         WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', $1::date)
           AND ($2::int IS NULL OR location_id = $2::int)
         GROUP BY order_state`,
        params
      );

      // 7. Top 5 productos en últimos 7 días
      // LEFT JOIN product para preservar líneas de productos eliminados
      const qTop = pool.query(
        `SELECT
           COALESCE(p.product_id, od.product_id)            AS product_id,
           COALESCE(p.product_name, '(producto eliminado)') AS product_name,
           COALESCE(SUM(od.amount), 0)::int                 AS total_vendido,
           COALESCE(SUM(od.sub_total_price), 0)             AS total_ingresos
         FROM order_detail od
         JOIN orders o      ON od.order_id   = o.order_id
         LEFT JOIN product p ON od.product_id = p.product_id
         WHERE o.order_date >= $1::date - INTERVAL '6 day'
           AND o.order_date <  $1::date + INTERVAL '1 day'
           AND o.order_state != 'cancelado'
           AND ($2::int IS NULL OR o.location_id = $2::int)
         GROUP BY COALESCE(p.product_id, od.product_id),
                  COALESCE(p.product_name, '(producto eliminado)')
         ORDER BY total_vendido DESC
         LIMIT 5`,
        params
      );

      // 8. Productos bajo stock
      const qBajoStock = pool.query(
        `SELECT COUNT(*)::int AS bajo_stock_count
         FROM inventory
         WHERE current_stock <= min_stock
           AND ($1::int IS NULL OR location_id = $1::int)`,
        [locId]
      );

      const [
        rHoy,
        rAyer,
        rMes,
        rMesAnt,
        rSerie,
        rEstados,
        rTop,
        rBajoStock
      ] = await Promise.all([
        qHoy, qAyer, qMes, qMesAnt, qSerie, qEstados, qTop, qBajoStock
      ]);

      const hoyRow = rHoy.rows[0] || {};
      const ayerRow = rAyer.rows[0] || {};
      const mesRow = rMes.rows[0] || {};
      const mesAntRow = rMesAnt.rows[0] || {};

      // Asegurar todas las keys en pedidos_por_estado
      const pedidos_por_estado = {
        'pendiente': 0,
        'en proceso': 0,
        'entregado': 0,
        'cancelado': 0
      };
      for (const row of rEstados.rows) {
        if (row.order_state in pedidos_por_estado) {
          pedidos_por_estado[row.order_state] = toInt(row.count);
        }
      }

      return res.json({
        hoy: {
          ventas: toFloat(hoyRow.ventas),
          pedidos: toInt(hoyRow.pedidos),
          pendientes: toInt(hoyRow.pendientes),
          ticket_promedio: toFloat(hoyRow.ticket_promedio),
          ventas_vs_ayer_pct: pctChange(hoyRow.ventas, ayerRow.ventas),
          pedidos_vs_ayer_pct: pctChange(hoyRow.pedidos, ayerRow.pedidos)
        },
        mes: {
          ventas: toFloat(mesRow.ventas),
          pedidos: toInt(mesRow.pedidos),
          ventas_vs_mes_anterior_pct: pctChange(mesRow.ventas, mesAntRow.ventas)
        },
        stock: {
          bajo_stock_count: toInt(rBajoStock.rows[0] && rBajoStock.rows[0].bajo_stock_count)
        },
        ventas_ultimos_7_dias: rSerie.rows.map(r => ({
          date: r.date,
          total: toFloat(r.total),
          count: toInt(r.count)
        })),
        pedidos_por_estado,
        top_productos_7_dias: rTop.rows.map(r => ({
          product_id: r.product_id,
          product_name: r.product_name,
          total_vendido: toInt(r.total_vendido),
          total_ingresos: toFloat(r.total_ingresos)
        }))
      });
    } catch (err) {
      console.error('[dashboard/summary]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = dashboardController;
