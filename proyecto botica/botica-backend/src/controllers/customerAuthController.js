const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const CustomerModel = require('../models/customerModel');
const PasswordResetModel = require('../models/passwordResetModel');
const { sendPasswordResetEmail } = require('../utils/mailer');

const sanitize = (customer) => {
  if (!customer) return null;
  const { customer_password, ...rest } = customer;
  return rest;
};

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const isDev = () => (process.env.NODE_ENV || 'development') !== 'production';
const frontendUrl = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

// remember = true → sesión larga (30 días, "recordarme en este dispositivo")
// remember = false → sesión corta (8h)
const signCustomerToken = (customer, remember = false) => {
  return jwt.sign(
    {
      customer_id: customer.customer_id,
      role: 'cust',
      full_name: customer.full_name,
      email: customer.email
    },
    process.env.JWT_SECRET,
    { expiresIn: remember ? '30d' : '8h' }
  );
};

const customerAuthController = {

  login: async (req, res) => {
    try {
      const { email, customer_password, remember } = req.body || {};

      if (!email || !customer_password) {
        return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
      }

      const customer = await CustomerModel.findByEmail(email);
      if (!customer || !customer.customer_password) {
        return res.status(401).json({ message: 'Cliente no encontrado o inactivo.' });
      }

      const validPassword = await bcrypt.compare(customer_password, customer.customer_password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Contraseña incorrecta.' });
      }

      const token = signCustomerToken(customer, remember === true);
      return res.json({ token, customer: sanitize(customer) });
    } catch (err) {
      console.error('Error en customer login:', err);
      return res.status(500).json({ message: 'Error del servidor.' });
    }
  },

  register: async (req, res) => {
    try {
      const { full_name, dni, address, phone, email, customer_password } = req.body || {};

      if (!full_name || !email || !customer_password) {
        return res.status(400).json({
          message: 'full_name, email y customer_password son obligatorios.'
        });
      }
      if (typeof customer_password !== 'string' || customer_password.length < 6) {
        return res.status(400).json({
          message: 'La contraseña debe tener al menos 6 caracteres.'
        });
      }
      if (dni !== undefined && dni !== null && dni !== '' && !/^\d{8}$/.test(String(dni))) {
        return res.status(400).json({ message: 'El DNI debe tener 8 dígitos.' });
      }
      if (phone !== undefined && phone !== null && phone !== '' && !/^\d{9}$/.test(String(phone))) {
        return res.status(400).json({ message: 'El teléfono debe tener 9 dígitos.' });
      }

      const hashed = await bcrypt.hash(customer_password, 10);
      const remember = req.body?.remember === true;

      // ── Enlace por DNI ──────────────────────────────────────────────
      // Si el usuario provee DNI y ya existe un customer con ese DNI creado
      // por el staff en una venta presencial (sin cuenta web), enlazamos esa
      // misma cuenta en vez de duplicar, para que herede sus pedidos.
      if (dni) {
        const byDni = await CustomerModel.findByDni(dni);
        if (byDni) {
          // Caso (c): ya tiene cuenta web → no permitir tomarla.
          if (byDni.customer_password) {
            return res.status(409).json({
              message: 'Ya existe una cuenta con ese DNI. Inicia sesión.'
            });
          }
          // Caso (b): existe pero SIN cuenta (creado por staff) → enlazar.
          // El email no puede pertenecer a OTRO customer distinto.
          const byEmail = await CustomerModel.findByEmailIncludingInactive(email);
          if (byEmail && byEmail.customer_id !== byDni.customer_id) {
            return res.status(409).json({ message: 'Email ya registrado.' });
          }
          const linked = await CustomerModel.linkWebAccount(byDni.customer_id, {
            email,
            customer_password: hashed,
            full_name,
            phone,
            address
          });
          const token = signCustomerToken(linked, remember);
          return res.status(200).json({ token, customer: sanitize(linked), linked: true });
        }
      }

      // Caso (a): no hay DNI o no existe ese DNI → alta normal.
      const existing = await CustomerModel.findByEmailIncludingInactive(email);
      if (existing) {
        return res.status(409).json({ message: 'Email ya registrado.' });
      }

      const customer = await CustomerModel.createWithPassword({
        full_name,
        dni: dni || null,
        address: address || null,
        phone: phone || null,
        email,
        customer_password: hashed
      });

      const token = signCustomerToken(customer, remember);
      return res.status(201).json({ token, customer: sanitize(customer) });
    } catch (err) {
      if (err && err.code === '23505') {
        return res.status(409).json({ message: 'Email o DNI ya registrado.' });
      }
      console.error('Error en customer register:', err);
      return res.status(500).json({ message: 'Error del servidor.' });
    }
  },

  // ============================================================
  // POST /api/auth/google — login / alta con cuenta de Google
  // ============================================================
  // El front envía el access_token que devuelve Google Identity
  // Services. NO confiamos en el front: validamos el token contra
  // Google (que pertenezca a NUESTRA app vía aud === GOOGLE_CLIENT_ID)
  // y leemos el perfil. Si el email ya es customer → inicia sesión;
  // si no → crea el customer (sin password) y lo inicia.
  // ============================================================
  googleAuth: async (req, res) => {
    try {
      const { access_token, remember } = req.body || {};
      if (!access_token) {
        return res.status(400).json({ message: 'Falta el token de Google.' });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error('GOOGLE_CLIENT_ID no está configurado en el backend.');
        return res.status(500).json({ message: 'Inicio con Google no está disponible.' });
      }

      // 1) Verificar que el token es válido y emitido para NUESTRA app.
      let tokenInfo;
      try {
        const tokenInfoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(access_token)}`
        );
        if (!tokenInfoRes.ok) {
          return res.status(401).json({ message: 'Token de Google inválido o expirado.' });
        }
        tokenInfo = await tokenInfoRes.json();
      } catch (e) {
        return res.status(502).json({ message: 'No se pudo verificar con Google. Intenta de nuevo.' });
      }

      if (tokenInfo.aud !== clientId) {
        return res.status(401).json({ message: 'Token de Google no válido para esta aplicación.' });
      }

      // 2) Leer el perfil (nombre + email).
      let profile;
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        if (!profileRes.ok) {
          return res.status(401).json({ message: 'No se pudo obtener tu perfil de Google.' });
        }
        profile = await profileRes.json();
      } catch (e) {
        return res.status(502).json({ message: 'No se pudo obtener tu perfil de Google.' });
      }

      const email = (profile.email || '').trim().toLowerCase();
      if (!email || profile.email_verified === false || profile.email_verified === 'false') {
        return res.status(401).json({ message: 'Tu cuenta de Google no tiene un email verificado.' });
      }
      const full_name = (profile.name || profile.given_name || email.split('@')[0]).trim();

      // 3) Buscar o crear el customer.
      let customer = await CustomerModel.findByEmailIncludingInactive(email);
      if (customer && customer.is_active === false) {
        return res.status(403).json({ message: 'Tu cuenta está desactivada. Contáctanos para reactivarla.' });
      }
      if (!customer) {
        customer = await CustomerModel.create({
          full_name,
          dni: null,
          address: null,
          phone: null,
          email
        });
      }

      const token = signCustomerToken(customer, remember !== false);
      return res.json({ token, customer: sanitize(customer) });
    } catch (err) {
      if (err && err.code === '23505') {
        return res.status(409).json({ message: 'Ese email ya está registrado.' });
      }
      console.error('Error en google auth:', err);
      return res.status(500).json({ message: 'Error al iniciar con Google.' });
    }
  },

  // ============================================================
  // POST /api/auth/forgot-password — solicitar enlace de reseteo
  // ============================================================
  // Respuesta SIEMPRE genérica (no revelamos si el email existe).
  // Genera un token aleatorio, guarda su HASH + expiración (1h) y
  // envía el correo. Si no hay SMTP configurado, el mailer loguea
  // el enlace y aquí lo devolvemos SOLO en modo dev (dev_link).
  // ============================================================
  forgotPassword: async (req, res) => {
    const GENERIC = {
      message: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.'
    };
    try {
      const { email } = req.body || {};
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'El email es obligatorio.' });
      }

      const customer = await CustomerModel.findByEmail(email);
      // No revelar existencia: si no hay customer, respondemos genérico igual.
      if (!customer || !customer.email) {
        return res.json(GENERIC);
      }

      // Un token vigente a la vez: invalidar anteriores.
      await PasswordResetModel.invalidateForCustomer(customer.customer_id);

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = sha256(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await PasswordResetModel.create({
        customer_id: customer.customer_id,
        token_hash: tokenHash,
        expires_at: expiresAt
      });

      const link = `${frontendUrl()}/reset-password?token=${rawToken}`;
      const { sent } = await sendPasswordResetEmail(customer.email, link);

      const payload = { ...GENERIC };
      // Solo en dev y solo si NO se envió por SMTP, exponemos el enlace
      // para poder probar local sin configurar email.
      if (!sent && isDev()) {
        payload.dev_link = link;
      }
      return res.json(payload);
    } catch (err) {
      console.error('Error en forgot-password:', err);
      // Aún ante error, respondemos genérico para no filtrar información.
      return res.json(GENERIC);
    }
  },

  // ============================================================
  // POST /api/auth/reset-password/validate — validar token (pantalla B)
  // ============================================================
  validateResetToken: async (req, res) => {
    try {
      const { token } = req.body || {};
      if (!token) {
        return res.status(400).json({ valid: false, message: 'Token requerido.' });
      }
      const record = await PasswordResetModel.findValidByHash(sha256(token));
      if (!record) {
        return res.status(400).json({ valid: false, message: 'El enlace no es válido o ha expirado.' });
      }
      return res.json({ valid: true });
    } catch (err) {
      console.error('Error en validate reset token:', err);
      return res.status(500).json({ valid: false, message: 'Error del servidor.' });
    }
  },

  // ============================================================
  // POST /api/auth/reset-password — fijar nueva contraseña
  // ============================================================
  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body || {};
      if (!token || !password) {
        return res.status(400).json({ message: 'Token y contraseña son obligatorios.' });
      }
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
      }

      const record = await PasswordResetModel.findValidByHash(sha256(token));
      if (!record) {
        return res.status(400).json({ message: 'El enlace no es válido o ha expirado.' });
      }

      const hashed = await bcrypt.hash(password, 10);
      await CustomerModel.updatePassword(record.customer_id, hashed);
      await PasswordResetModel.markUsed(record.reset_id);
      // Invalida cualquier otro token pendiente del mismo customer.
      await PasswordResetModel.invalidateForCustomer(record.customer_id);

      return res.json({ message: 'Contraseña actualizada correctamente.' });
    } catch (err) {
      console.error('Error en reset-password:', err);
      return res.status(500).json({ message: 'Error del servidor.' });
    }
  }
};

module.exports = customerAuthController;
