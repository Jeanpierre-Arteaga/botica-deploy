const pool = require('../config/db');

// ============================================================
// TrustedDeviceModel — dispositivos recordados para 2FA
// ============================================================
// "Recordar este dispositivo por 30 días": guardamos SOLO el hash (sha256) del
// token; el token en claro vive en el navegador. En logins posteriores, si el
// dispositivo presenta un token vigente, se omite el paso del código.
// ============================================================

const TrustedDeviceModel = {

  /** Registra un dispositivo de confianza para un usuario. */
  create: async ({ user_id, token_hash, expires_at, label = null }) => {
    const result = await pool.query(
      `INSERT INTO trusted_device (user_id, token_hash, expires_at, label)
       VALUES ($1, $2, $3, $4)
       RETURNING device_id, user_id, expires_at, created_at`,
      [user_id, token_hash, expires_at, label]
    );
    return result.rows[0];
  },

  /**
   * Busca un dispositivo VIGENTE (no expirado) que pertenezca a ese usuario y
   * matchee el hash del token. Devuelve la fila o undefined.
   */
  findValid: async (user_id, token_hash) => {
    const result = await pool.query(
      `SELECT * FROM trusted_device
        WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()
        LIMIT 1`,
      [user_id, token_hash]
    );
    return result.rows[0];
  },

  /** Sella el último uso (al validar un dispositivo recordado). */
  touch: async (device_id) => {
    await pool.query(
      `UPDATE trusted_device SET last_used_at = NOW() WHERE device_id = $1`,
      [device_id]
    );
  },

  /** Limpieza: elimina los dispositivos ya expirados (mantenimiento). */
  deleteExpired: async () => {
    const result = await pool.query(
      `DELETE FROM trusted_device WHERE expires_at <= NOW()`
    );
    return result.rowCount;
  },

  /** Olvida todos los dispositivos de un usuario (p. ej. tras cambio de clave). */
  deleteForUser: async (user_id) => {
    await pool.query(`DELETE FROM trusted_device WHERE user_id = $1`, [user_id]);
  },
};

module.exports = TrustedDeviceModel;
