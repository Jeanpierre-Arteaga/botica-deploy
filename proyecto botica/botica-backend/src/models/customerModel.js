const pool = require('../config/db');

const CustomerModel = {

  findAll: async () => {
    const result = await pool.query(
      `SELECT * FROM customer ORDER BY customer_id`
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT * FROM customer WHERE customer_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  findByDni: async (dni) => {
    const result = await pool.query(
      `SELECT * FROM customer WHERE dni = $1`,
      [dni]
    );
    return result.rows[0];
  },

  findByEmail: async (email) => {
    const result = await pool.query(
      `SELECT * FROM customer WHERE LOWER(email) = LOWER($1) AND is_active = true`,
      [email]
    );
    return result.rows[0];
  },

  findByEmailIncludingInactive: async (email) => {
    const result = await pool.query(
      `SELECT * FROM customer WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    return result.rows[0];
  },

  create: async ({ full_name, dni, address, phone, email }) => {
    const result = await pool.query(
      `INSERT INTO customer (full_name, dni, address, phone, email, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING customer_id, full_name, dni, address, phone, email, is_active, created_at`,
      [full_name, dni, address, phone, email]
    );
    return result.rows[0];
  },

  createWithPassword: async ({ full_name, dni, address, phone, email, customer_password }) => {
    const result = await pool.query(
      `INSERT INTO customer
         (full_name, dni, address, phone, email, customer_password, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING customer_id, full_name, dni, address, phone, email, is_active, created_at`,
      [full_name, dni, address, phone, email, customer_password]
    );
    return result.rows[0];
  },

  // Allowlist defensiva: customer_password e is_active NO se actualizan aquí.
  // Cambios de password requieren endpoint dedicado; is_active solo admin.
  update: async (id, data) => {
    const ALLOWED_UPDATE_FIELDS = ['full_name', 'dni', 'address', 'phone', 'email'];
    const fields = Object.keys(data || {}).filter(k => ALLOWED_UPDATE_FIELDS.includes(k));

    if (fields.length === 0) {
      const current = await pool.query(
        `SELECT customer_id, full_name, dni, address, phone, email, is_active, created_at
         FROM customer WHERE customer_id = $1`,
        [id]
      );
      return current.rows[0];
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map(f => data[f]);

    const result = await pool.query(
      `UPDATE customer SET ${setClause}
       WHERE customer_id = $${fields.length + 1}
       RETURNING customer_id, full_name, dni, address, phone, email, is_active, created_at`,
      [...values, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query(
      `DELETE FROM customer WHERE customer_id = $1 RETURNING customer_id`,
      [id]
    );
    return result.rows[0];
  }
};

module.exports = CustomerModel;
