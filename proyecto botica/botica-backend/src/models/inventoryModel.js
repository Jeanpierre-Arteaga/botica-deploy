const pool = require('../config/db');

const InventoryModel = {

  findAll: async (filtros = {}) => {
    let query = `
      SELECT i.*, 
             p.product_name, p.active_ingredient,
             l.location_name
      FROM inventory i
      LEFT JOIN product p ON i.product_id = p.product_id
      LEFT JOIN location l ON i.location_id = l.location_id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (filtros.location_id) {
      query += ` AND i.location_id = $${idx++}`;
      values.push(filtros.location_id);
    }
    if (filtros.product_id) {
      query += ` AND i.product_id = $${idx++}`;
      values.push(filtros.product_id);
    }

    query += ' ORDER BY p.product_name';
    const result = await pool.query(query, values);
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT i.*, p.product_name, l.location_name
       FROM inventory i
       LEFT JOIN product p ON i.product_id = p.product_id
       LEFT JOIN location l ON i.location_id = l.location_id
       WHERE i.inventory_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  findLowStock: async () => {
    const result = await pool.query(
      `SELECT i.*, p.product_name, l.location_name
       FROM inventory i
       LEFT JOIN product p ON i.product_id = p.product_id
       LEFT JOIN location l ON i.location_id = l.location_id
       WHERE i.current_stock <= i.min_stock
       ORDER BY i.current_stock ASC`
    );
    return result.rows;
  },

  create: async ({ current_stock, min_stock, product_id, location_id }) => {
    const result = await pool.query(
      `INSERT INTO inventory (current_stock, min_stock, product_id, location_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [current_stock, min_stock, product_id, location_id]
    );
    return result.rows[0];
  },

  update: async (id, { current_stock, min_stock }) => {
    const result = await pool.query(
      `UPDATE inventory
       SET current_stock = $1, min_stock = $2
       WHERE inventory_id = $3
       RETURNING *`,
      [current_stock, min_stock, id]
    );
    return result.rows[0];
  },

  // Inserta o actualiza el stock de un producto en una sede concreta.
  // Usa el UNIQUE(product_id, location_id) para decidir insert vs update.
  // Ideal para el flujo de alta/edición de producto desde el admin.
  upsert: async ({ product_id, location_id, current_stock = 0, min_stock = 0 }) => {
    const result = await pool.query(
      `INSERT INTO inventory (current_stock, min_stock, product_id, location_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, location_id)
       DO UPDATE SET current_stock = EXCLUDED.current_stock,
                     min_stock     = EXCLUDED.min_stock
       RETURNING *`,
      [current_stock, min_stock, product_id, location_id]
    );
    return result.rows[0];
  },

  // Transferir stock entre sedes
  transfer: async ({ product_id, from_location, to_location, amount }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar stock origen
      const stockResult = await client.query(
        `SELECT current_stock FROM inventory
         WHERE product_id = $1 AND location_id = $2`,
        [product_id, from_location]
      );
      const stock = stockResult.rows[0];
      if (!stock || stock.current_stock < amount) {
        throw new Error('Stock insuficiente en sede origen.');
      }

      // Descontar de origen
      await client.query(
        `UPDATE inventory SET current_stock = current_stock - $1
         WHERE product_id = $2 AND location_id = $3`,
        [amount, product_id, from_location]
      );

      // Sumar a destino
      await client.query(
        `UPDATE inventory SET current_stock = current_stock + $1
         WHERE product_id = $2 AND location_id = $3`,
        [amount, product_id, to_location]
      );

      await client.query('COMMIT');
      return { message: 'Transferencia realizada.', product_id, amount };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = InventoryModel;