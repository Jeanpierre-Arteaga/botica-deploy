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
       RETURNING customer_id, full_name, dni, address, phone, email, is_active, created_at, photo_url`,
      [full_name, dni, address, phone, email]
    );
    return result.rows[0];
  },

  createWithPassword: async ({ full_name, dni, address, phone, email, customer_password }) => {
    const result = await pool.query(
      `INSERT INTO customer
         (full_name, dni, address, phone, email, customer_password, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING customer_id, full_name, dni, address, phone, email, is_active, created_at, photo_url`,
      [full_name, dni, address, phone, email, customer_password]
    );
    return result.rows[0];
  },

  // Allowlist defensiva: customer_password e is_active NO se actualizan aquí.
  // Cambios de password requieren endpoint dedicado; is_active solo admin.
  // photo_url SÍ es actualizable (perfil propio: foto S3 o avatar predefinido).
  update: async (id, data) => {
    const ALLOWED_UPDATE_FIELDS = ['full_name', 'dni', 'address', 'phone', 'email', 'photo_url'];
    const fields = Object.keys(data || {}).filter(k => ALLOWED_UPDATE_FIELDS.includes(k));

    if (fields.length === 0) {
      const current = await pool.query(
        `SELECT customer_id, full_name, dni, address, phone, email, is_active, created_at, photo_url
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
       RETURNING customer_id, full_name, dni, address, phone, email, is_active, created_at, photo_url`,
      [...values, id]
    );
    return result.rows[0];
  },

  // Enlaza una cuenta web a un customer EXISTENTE creado presencialmente
  // por el staff (customer_password IS NULL). Fija email + contraseña y
  // SOBREESCRIBE los datos del registro web: el nombre que el propio cliente
  // ingresa al registrarse manda sobre el que puso el staff. Para
  // teléfono/dirección, el dato web pisa solo si se proporcionó (NULLIF del
  // parámetro); si el cliente lo dejó vacío, se conserva el existente.
  // Reactiva la cuenta por si estuviera inactiva. Los pedidos (customer_id)
  // no se tocan, así que el historial se preserva intacto.
  linkWebAccount: async (id, { email, customer_password, full_name, phone, address }) => {
    const result = await pool.query(
      `UPDATE customer
       SET email = $1,
           customer_password = $2,
           full_name = COALESCE(NULLIF($3, ''), full_name),
           phone    = COALESCE(NULLIF($4, ''), phone),
           address  = COALESCE(NULLIF($5, ''), address),
           is_active = true
       WHERE customer_id = $6
       RETURNING customer_id, full_name, dni, address, phone, email, is_active, created_at`,
      [email, customer_password, full_name || null, phone || null, address || null, id]
    );
    return result.rows[0];
  },

  // Actualiza solo el password (hash bcrypt). Usado por el flujo de
  // recuperación de contraseña Y por el cambio de contraseña del perfil propio
  // — fuera de la allowlist de update().
  updatePassword: async (id, customer_password) => {
    const result = await pool.query(
      `UPDATE customer SET customer_password = $1
       WHERE customer_id = $2
       RETURNING customer_id, full_name, email`,
      [customer_password, id]
    );
    return result.rows[0];
  },

  // Devuelve el hash bcrypt de la contraseña (para verificar identidad en el
  // auto-cambio de contraseña del perfil). NULL si la cuenta no tiene contraseña
  // (p. ej. registro con Google) → el front ofrece "crear contraseña".
  getPasswordHashById: async (id) => {
    const result = await pool.query(
      `SELECT customer_password FROM customer WHERE customer_id = $1`,
      [id]
    );
    return result.rows[0] ? result.rows[0].customer_password : null;
  },

  // URL de foto actual (para limpiar la anterior de S3 al reemplazar). Solo se
  // borra de S3 si era una URL de NUESTRO CloudFront (deleteByUrl lo valida);
  // los avatares predefinidos ("/avatars/...") no son objetos S3 y se ignoran.
  getPhotoUrl: async (id) => {
    const result = await pool.query(`SELECT photo_url FROM customer WHERE customer_id = $1`, [id]);
    return result.rows[0] ? result.rows[0].photo_url : null;
  },

  // Desactivación (soft-delete) coherente con el resto del sistema. La cuenta
  // deja de poder iniciar sesión (findByEmail filtra is_active=true).
  softDelete: async (id) => {
    const result = await pool.query(
      `UPDATE customer SET is_active = false WHERE customer_id = $1
       RETURNING customer_id, full_name, is_active`,
      [id]
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
