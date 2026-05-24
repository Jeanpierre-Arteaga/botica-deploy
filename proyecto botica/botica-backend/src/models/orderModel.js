const pool = require('../config/db');

const OrderModel = {

  findAll: async (filtros = {}) => {
    let query = `
      SELECT o.*, 
             c.full_name AS customer_name, c.dni,
             l.location_name,
             u.full_name AS employee_name
      FROM orders o
      LEFT JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN location l ON o.location_id = l.location_id
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE 1=1
    `;
    const values = [];
    let i = 1;

    if (filtros.order_state) {
      query += ` AND o.order_state = $${i++}`;
      values.push(filtros.order_state);
    }
    if (filtros.location_id) {
      query += ` AND o.location_id = $${i++}`;
      values.push(filtros.location_id);
    }
    if (filtros.fecha_inicio) {
      query += ` AND o.order_date >= $${i++}`;
      values.push(filtros.fecha_inicio);
    }
    if (filtros.fecha_fin) {
      query += ` AND o.order_date <= $${i++}`;
      values.push(filtros.fecha_fin);
    }

    query += ' ORDER BY o.order_date DESC';
    const result = await pool.query(query, values);
    return result.rows;
  },

  findById: async (id) => {
    // Datos del pedido
    const orderResult = await pool.query(
      `SELECT o.*, 
              c.full_name AS customer_name, c.dni, c.phone, c.email,
              l.location_name,
              u.full_name AS employee_name
       FROM orders o
       LEFT JOIN customer c ON o.customer_id = c.customer_id
       LEFT JOIN location l ON o.location_id = l.location_id
       LEFT JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = $1`,
      [id]
    );

    if (!orderResult.rows[0]) return null;

    // Detalle del pedido
    const detailResult = await pool.query(
      `SELECT od.*, p.product_name, p.active_ingredient
       FROM order_detail od
       LEFT JOIN product p ON od.product_id = p.product_id
       WHERE od.order_id = $1`,
      [id]
    );

    return {
      ...orderResult.rows[0],
      details: detailResult.rows
    };
  },

  findByCustomer: async (customer_id) => {
    const result = await pool.query(
      `SELECT o.*, l.location_name
       FROM orders o
       LEFT JOIN location l ON o.location_id = l.location_id
       WHERE o.customer_id = $1
       ORDER BY o.order_date DESC`,
      [customer_id]
    );
    return result.rows;
  },

  create: async (orderData, details) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { order_state = 'pendiente', delivery_type,
              customer_id, user_id, location_id } = orderData;

      // Calcular total
      let total_price = 0;
      for (const detail of details) {
        total_price += detail.unit_price * detail.amount;
      }

      // Crear pedido
      const orderResult = await client.query(
        `INSERT INTO orders 
          (order_state, delivery_type, order_date, total_price, customer_id, user_id, location_id)
         VALUES ($1, $2, NOW(), $3, $4, $5, $6)
         RETURNING *`,
        [order_state, delivery_type, total_price, customer_id, user_id, location_id]
      );
      const order = orderResult.rows[0];

      // Insertar detalles y descontar stock
      for (const detail of details) {
        const sub_total = detail.unit_price * detail.amount;

        await client.query(
          `INSERT INTO order_detail (amount, unit_price, sub_total_price, product_id, order_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [detail.amount, detail.unit_price, sub_total, detail.product_id, order.order_id]
        );

        // Descontar del inventario
        await client.query(
          `UPDATE inventory 
           SET current_stock = current_stock - $1
           WHERE product_id = $2 AND location_id = $3`,
          [detail.amount, detail.product_id, location_id]
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Solo actualiza order_state — el user_id original del pedido NO se toca.
  // Para auditoría de quién cambió cada estado, crear tabla order_state_history.
  updateStatus: async (id, order_state) => {
    const result = await pool.query(
      `UPDATE orders
       SET order_state = $1
       WHERE order_id = $2
       RETURNING *`,
      [order_state, id]
    );
    return result.rows[0];
  }
};

module.exports = OrderModel;