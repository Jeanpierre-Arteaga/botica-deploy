const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifica que el token JWT sea válido
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token requerido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Payload unificado tras fix:
    // - staff/admin: { user_id, role: 'admin'|'emp', full_name, location_id }
    // - customer:    { customer_id, role: 'cust', full_name, email }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};

// Verifica que el usuario tenga el rol requerido
// Genérica: acepta cualquier rol pasado en allowedRoles ('admin', 'emp', 'cust', ...).
const verifyRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: 'No autenticado.' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Acceso denegado. Rol requerido: ${allowedRoles.join(' o ')}.`
    });
  }
  next();
};

module.exports = { verifyToken, verifyRole };