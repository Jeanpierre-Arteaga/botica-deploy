const pool = require('../config/db');

const UserModel = {

  findByCode: async (user_code) => {
    const result = await pool.query(
      `SELECT * FROM users WHERE user_code = $1 AND is_active = true`,
      [user_code]
    );
    return result.rows[0];
  },

  // Busca un usuario ACTIVO por correo (case-insensitive). Fila completa +
  // nombre de sede. Se usa en la recuperación de contraseña del personal
  // (el usuario provee su correo). Devuelve el de menor user_id si hubiera
  // colisión de correo (no debería).
  findByEmail: async (email) => {
    const result = await pool.query(
      `SELECT u.*, l.location_name
       FROM users u
       LEFT JOIN location l ON u.location_id = l.location_id
       WHERE lower(u.email) = lower($1) AND u.is_active = true
       ORDER BY u.user_id
       LIMIT 1`,
      [email]
    );
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT u.user_id, u.user_code, u.full_name, u.role, u.is_active,
              u.location_id, u.last_login, u.photo_url, u.email,
              l.location_name
       FROM users u
       LEFT JOIN location l ON u.location_id = l.location_id
       WHERE u.user_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Fila completa (incluye columnas twofa_* y user_password) + nombre de sede.
  // Solo para flujos internos de autenticación (login / verificación 2FA);
  // NO se expone tal cual en respuestas HTTP.
  findAuthById: async (id) => {
    const result = await pool.query(
      `SELECT u.*, l.location_name
       FROM users u
       LEFT JOIN location l ON u.location_id = l.location_id
       WHERE u.user_id = $1 AND u.is_active = true`,
      [id]
    );
    return result.rows[0];
  },

  findAll: async () => {
    const result = await pool.query(
      `SELECT u.user_id, u.user_code, u.full_name, u.role, u.is_active,
              u.location_id, u.last_login, u.photo_url, u.email,
              l.location_name
       FROM users u
       LEFT JOIN location l ON u.location_id = l.location_id
       ORDER BY u.user_id`
    );
    return result.rows;
  },

  create: async ({ user_code, user_password, full_name, role, location_id, email = null }) => {
    const result = await pool.query(
      `INSERT INTO users (user_code, user_password, full_name, role, location_id, email, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING user_id, user_code, full_name, role, location_id, email`,
      [user_code, user_password, full_name, role, location_id, email]
    );
    return result.rows[0];
  },

  // Allowlist defensiva: role y user_password NO son actualizables vía update.
  // role solo se cambia por PATCH /:id/role (admin); password requiere endpoint dedicado.
  // photo_url SÍ es actualizable (perfil propio o admin).
  update: async (id, data) => {
    const ALLOWED_UPDATE_FIELDS = ['user_code', 'full_name', 'location_id', 'is_active', 'photo_url', 'email'];
    const fields = Object.keys(data || {}).filter(k => ALLOWED_UPDATE_FIELDS.includes(k));

    if (fields.length === 0) {
      const current = await pool.query(
        `SELECT user_id, user_code, full_name, role, location_id, is_active, photo_url, email
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
       RETURNING user_id, user_code, full_name, role, location_id, is_active, photo_url, email`,
      [...values, id]
    );
    return result.rows[0];
  },

  // Devuelve el hash bcrypt de la contraseña (para verificar identidad en el
  // auto-cambio de contraseña del perfil). NO se expone en findById/findAll.
  getPasswordHashById: async (id) => {
    const result = await pool.query(
      `SELECT user_password FROM users WHERE user_id = $1`,
      [id]
    );
    return result.rows[0] ? result.rows[0].user_password : null;
  },

  // Devuelve la URL de foto actual (para limpiar la anterior de S3 al reemplazar).
  getPhotoUrl: async (id) => {
    const result = await pool.query(`SELECT photo_url FROM users WHERE user_id = $1`, [id]);
    return result.rows[0] ? result.rows[0].photo_url : null;
  },

  updateRole: async (id, role) => {
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE user_id = $2
       RETURNING user_id, full_name, role`,
      [role, id]
    );
    return result.rows[0];
  },

  // Restablece la contraseña (ya hasheada por el controller). Limpia el bloqueo
  // y los intentos fallidos: si el admin regenera la clave, el usuario recupera
  // el acceso de inmediato.
  updatePassword: async (id, hashedPassword) => {
    const result = await pool.query(
      `UPDATE users
         SET user_password = $1, failed_attempts = 0, locked_until = NULL
       WHERE user_id = $2
       RETURNING user_id`,
      [hashedPassword, id]
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
  },

  // ── 2FA: estado del código OTP de verificación en dos pasos ──────────────

  // Guarda (o reemplaza) el OTP vigente del usuario y reinicia los intentos.
  setTwofaCode: async (id, { code_hash, expires_at, sent_at }) => {
    await pool.query(
      `UPDATE users
          SET twofa_code_hash = $1,
              twofa_expires_at = $2,
              twofa_sent_at = $3,
              twofa_attempts = 0
        WHERE user_id = $4`,
      [code_hash, expires_at, sent_at, id]
    );
  },

  // Suma 1 a los intentos del código vigente y devuelve el total resultante.
  incrementTwofaAttempts: async (id) => {
    const result = await pool.query(
      `UPDATE users SET twofa_attempts = twofa_attempts + 1
        WHERE user_id = $1
        RETURNING twofa_attempts`,
      [id]
    );
    return result.rows[0] ? result.rows[0].twofa_attempts : null;
  },

  // Limpia el OTP (tras usarlo, agotar intentos o cancelar el flujo).
  clearTwofa: async (id) => {
    await pool.query(
      `UPDATE users
          SET twofa_code_hash = NULL,
              twofa_expires_at = NULL,
              twofa_sent_at = NULL,
              twofa_attempts = 0
        WHERE user_id = $1`,
      [id]
    );
  },

  // Limpia el bloqueo por intentos de contraseña SIN tocar last_login. Se usa
  // cuando la contraseña fue correcta pero el login aún no se completa (queda
  // pendiente el 2FA): no debe penalizarse al usuario por intentos previos.
  clearPasswordLock: async (id) => {
    await pool.query(
      `UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE user_id = $1`,
      [id]
    );
  },

  // Sella el último acceso (NOW() = hora de Lima por la sesión de BD) y limpia
  // el bloqueo por intentos de contraseña. Se llama al completar el login.
  markLogin: async (id) => {
    await pool.query(
      `UPDATE users
          SET last_login = NOW(), failed_attempts = 0, locked_until = NULL
        WHERE user_id = $1`,
      [id]
    );
  }
};

module.exports = UserModel;