const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // ajusta la ruta si es diferente

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

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(user_password, user.user_password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

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
        is_active: user.is_active
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = { login };