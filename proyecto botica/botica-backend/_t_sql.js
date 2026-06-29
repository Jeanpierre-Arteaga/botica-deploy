require('dotenv').config();
const pool = require('./src/config/db');
(async () => {
  // rango real de ventas
  const rng = await pool.query("SELECT MIN(order_date)::date AS lo, MAX(order_date)::date AS hi FROM orders WHERE order_state<>'cancelado'");
  console.log('order_date range:', rng.rows[0].lo, '→', rng.rows[0].hi);
  const params = ['2026-01-01', '2026-12-31', 2];
  const q = await pool.query(
    `SELECT TO_CHAR(DATE(o.order_date),'YYYY-MM-DD') AS date,
            c.category_id,
            COALESCE(c.category_name,'Sin categoría') AS category_name,
            COALESCE(SUM(od.sub_total_price),0) AS total
       FROM order_detail od
       JOIN orders o ON od.order_id=o.order_id
       LEFT JOIN product p ON od.product_id=p.product_id
       LEFT JOIN category c ON p.category_id=c.category_id
      WHERE o.order_date::date BETWEEN $1::date AND $2::date
        AND o.order_state <> 'cancelado'
        AND ($3::int IS NULL OR o.location_id=$3::int)
      GROUP BY DATE(o.order_date), c.category_id, c.category_name
      ORDER BY DATE(o.order_date) ASC`, params);
  console.log('byDayCategory rows (sede 2):', q.rows.length);
  console.log('distinct dates:', new Set(q.rows.map(r=>r.date)).size, '| distinct cats:', new Set(q.rows.map(r=>r.category_name)).size);
  console.log('first 6 rows:'); q.rows.slice(0,6).forEach(r=>console.log('  ', r.date, '|', r.category_name, '| S/', Number(r.total).toFixed(2)));
  // suma total vs byDay total para sanity
  const sum = q.rows.reduce((s,r)=>s+Number(r.total),0);
  console.log('sum of byDayCategory total: S/', sum.toFixed(2));
  await pool.end();
})().catch(e=>{console.log('ERR',e.message);process.exit(1);});
