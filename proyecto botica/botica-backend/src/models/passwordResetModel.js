const pool = require('../config/db');

// ============================================================
// PasswordResetModel — tokens de recuperación de contraseña
// ============================================================
// Solo guardamos el HASH del token (sha256), nunca el token en
// claro. El token en claro viaja únicamente en el enlace del
// correo. Cada token tiene expiración y se marca como usado.
// ============================================================

const PasswordResetModel = {

  create: async ({ customer_id, token_hash, expires_at }) => {
    const result = await pool.query(
      `INSERT INTO password_reset (customer_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING reset_id, customer_id, expires_at, created_at`,
      [customer_id, token_hash, expires_at]
    );
    return result.rows[0];
  },

  // Devuelve el token vigente (no usado, no expirado) que matchee el hash.
  findValidByHash: async (token_hash) => {
    const result = await pool.query(
      `SELECT * FROM password_reset
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       ORDER BY reset_id DESC
       LIMIT 1`,
      [token_hash]
    );
    return result.rows[0];
  },

  markUsed: async (reset_id) => {
    await pool.query(
      `UPDATE password_reset SET used_at = NOW() WHERE reset_id = $1`,
      [reset_id]
    );
  },

  // Invalida cualquier token pendiente del customer (al pedir uno nuevo
  // o tras un reseteo exitoso).
  invalidateForCustomer: async (customer_id) => {
    await pool.query(
      `UPDATE password_reset
       SET used_at = NOW()
       WHERE customer_id = $1 AND used_at IS NULL`,
      [customer_id]
    );
  },
};

module.exports = PasswordResetModel;
