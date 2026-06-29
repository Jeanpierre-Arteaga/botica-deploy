const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // ajusta la ruta si es diferente

// Bloqueo por intentos fallidos: a los 3 fallos, se bloquea por 5 minutos.
const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 5;
// Mensaje NEUTRO: no revela si el usuario existe o si la contraseña es la que falla.
const NEUTRAL = 'Usuario o contraseña incorrectos.';

const login = async (req, res) => {
  const { user_code, user_password } = req.body;

  try {
    // Buscar usuario activo (con el nombre de su sede para mostrarlo al ingresar)
    const result = await pool.query(
      `SELECT u.*, l.location_name
       FROM users u
       LEFT JOIN location l ON u.location_id = l.location_id
       WHERE u.user_code = $1 AND u.is_active = true`,
      [user_code]
    );

    // Usuario inexistente/inactivo → mensaje neutro (no se revela existencia).
    if (result.rows.length === 0) {
      return res.status(401).json({ message: NEUTRAL });
    }

    const user = result.rows[0];

    // ¿Cuenta bloqueada todavía? → 423 con el tiempo restante.
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      const retry = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000);
      return res.status(423).json({
        message: 'Demasiados intentos fallidos. Tu acceso está bloqueado temporalmente.',
        locked: true,
        retry_after_seconds: retry,
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(user_password, user.user_password);
    if (!validPassword) {
      const failed = (user.failed_attempts || 0) + 1;
      if (failed >= MAX_ATTEMPTS) {
        // Tercer fallo → bloquear por LOCK_MINUTES.
        await pool.query(
          `UPDATE users
             SET failed_attempts = $1,
                 locked_until = NOW() + ($2 || ' minutes')::interval
           WHERE user_id = $3`,
          [failed, LOCK_MINUTES, user.user_id]
        );
        return res.status(423).json({
          message: `Demasiados intentos fallidos. Tu acceso quedó bloqueado por ${LOCK_MINUTES} minutos.`,
          locked: true,
          retry_after_seconds: LOCK_MINUTES * 60,
        });
      }
      await pool.query(`UPDATE users SET failed_attempts = $1 WHERE user_id = $2`, [failed, user.user_id]);
      return res.status(401).json({ message: NEUTRAL, attempts_left: MAX_ATTEMPTS - failed });
    }

    // Éxito → reinicia el contador y el bloqueo, y sella el último acceso
    // (NOW() = hora de Lima por la sesión de la BD).
    pool
      .query(
        `UPDATE users SET last_login = NOW(), failed_attempts = 0, locked_until = NULL WHERE user_id = $1`,
        [user.user_id]
      )
      .catch((e) => console.error('[auth/login] reset/last_login', e.message));

    // Generar token JWT
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        full_name: user.full_name,
        location_id: user.location_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        user_code: user.user_code,
        full_name: user.full_name,
        role: user.role,
        location_id: user.location_id,
        location_name: user.location_name || null,
        is_active: user.is_active,
        photo_url: user.photo_url || null
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = { login };