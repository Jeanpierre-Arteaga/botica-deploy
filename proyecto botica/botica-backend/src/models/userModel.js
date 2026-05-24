const pool = require('../config/db');

const UserModel = {

  findByCode: async (user_code) => {
    const result = await pool.query(
      `SELECT * FROM users WHERE user_code = $1 AND is_active = true`,
      [user_code]
    );
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT u.user_id, u.user_code, u.full_name, u.role, u.is_active,
              l.location_name
       FROM users u
       LEFT JOIN location l ON u.location_id = l.location_id
       WHERE u.user_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  findAll: async () => {
    const result = await pool.query(
      `SELECT u.user_id, u.user_code, u.full_name, u.role, u.is_active,
              l.location_name
       FROM users u
       LEFT JOIN location l ON u.location_id = l.location_id
       ORDER BY u.user_id`
    );
    return result.rows;
  },

  create: async ({ user_code, user_password, full_name, role, location_id }) => {
    const result = await pool.query(
      `INSERT INTO users (user_code, user_password, full_name, role, location_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING user_id, user_code, full_name, role, location_id`,
      [user_code, user_password, full_name, role, location_id]
    );
    return result.rows[0];
  },

  // Allowlist defensiva: role y user_password NO son actualizables vía update.
  // role solo se cambia por PATCH /:id/role (admin); password requiere endpoint dedicado.
  update: async (id, data) => {
    const ALLOWED_UPDATE_FIELDS = ['user_code', 'full_name', 'location_id', 'is_active'];
    const fields = Object.keys(data || {}).filter(k => ALLOWED_UPDATE_FIELDS.includes(k));

    if (fields.length === 0) {
      const current = await pool.query(
        `SELECT user_id, user_code, full_name, role, location_id, is_active
         FROM users WHERE user_id = $1`,
        [id]
      );
      return current.rows[0];
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map(f => data[f]);

    const result = await pool.query(
      `UPDATE users SET ${setClause}
       WHERE user_id = $${fields.length + 1}
       RETURNING user_id, user_code, full_name, role, location_id, is_active`,
      [...values, id]
    );
    return result.rows[0];
  },

  updateRole: async (id, role) => {
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE user_id = $2
       RETURNING user_id, full_name, role`,
      [role, id]
    );
    return result.rows[0];
  },

  softDelete: async (id) => {
    const result = await pool.query(
      `UPDATE users SET is_active = false WHERE user_id = $1
       RETURNING user_id, full_name, is_active`,
      [id]
    );
    return result.rows[0];
  }
};

module.exports = UserModel;