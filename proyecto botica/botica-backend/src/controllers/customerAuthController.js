const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const CustomerModel = require('../models/customerModel');
const UserModel = require('../models/userModel');
const PasswordResetModel = require('../models/passwordResetModel');
const twofa = require('../utils/twofa');
const { sendPasswordResetEmail, sendTwofaCodeEmail, hasSmtp } = require('../utils/mailer');

// Quita del objeto cliente lo que NUNCA debe salir al frontend: el hash de la
// contraseña y el estado interno del OTP (hash/expiración/intentos del 2FA).
const sanitize = (customer) => {
  if (!customer) return null;
  const {
    customer_password,
    twofa_code_hash,
    twofa_expires_at,
    twofa_attempts,
    twofa_sent_at,
    ...rest
  } = customer;
  return rest;
};

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const isDev = () => (process.env.NODE_ENV || 'development') !== 'production';
const frontendUrl = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

// fetch con timeout (AbortController). Evita que una llamada lenta a Google
// (verificación del token) cuelgue la respuesta del login con Google.
const GOOGLE_TIMEOUT_MS = Number(process.env.GOOGLE_TIMEOUT_MS) || 8000;
async function fetchWithTimeout(url, options = {}, ms = GOOGLE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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

// Genera y GUARDA un OTP nuevo para el cliente y dispara el correo en SEGUNDO
// PLANO (mismo criterio que staff: el envío NUNCA bloquea la respuesta HTTP).
async function issueCustomerOtp(customer) {
  const code = twofa.generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + twofa.CODE_TTL_MINUTES * 60 * 1000);

  await CustomerModel.setTwofaCode(customer.customer_id, {
    code_hash: twofa.hashCode(code),
    expires_at: expiresAt,
    sent_at: now,
  });

  // Fire-and-forget: el correo viaja por fuera del ciclo request/response.
  sendTwofaCodeEmail(customer.email, code, { minutes: twofa.CODE_TTL_MINUTES }).catch((e) =>
    console.error('[customer-auth] envío de OTP (2º plano) falló:', e.message)
  );
}

const customerAuthController = {

  // ============================================================
  // POST /api/auth/customer-login — paso 1: credenciales
  // ============================================================
  // Tras validar correo+contraseña NO se entrega el JWT directo: se exige un
  // código de 6 dígitos enviado al correo (evita el acceso con un correo ajeno).
  // Si el 2FA de cliente está desactivado (TWOFA_CUSTOMER_ENABLED=false), entra
  // directo. El login con Google es aparte y NUNCA pasa por aquí.
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

      // 2FA desactivado para cliente, o sin correo de destino → login directo.
      if (!twofa.isTwofaCustomerEnabled() || !customer.email) {
        const token = signCustomerToken(customer, remember === true);
        return res.json({ token, customer: sanitize(customer) });
      }

      // ── Hace falta el código: generar/guardar el OTP y enviarlo en 2º plano ──
      await issueCustomerOtp(customer);

      const payload = {
        twofa_required: true,
        challenge: twofa.signCustomerChallenge(customer, remember === true),
        email_masked: twofa.maskEmail(customer.email),
        resend_available_in: twofa.RESEND_COOLDOWN_SECONDS,
        expires_in: twofa.CODE_TTL_MINUTES * 60,
      };
      if (!hasSmtp() && isDev()) payload.dev_delivery = 'console';
      return res.json(payload);
    } catch (err) {
      console.error('Error en customer login:', err);
      return res.status(500).json({ message: 'Error del servidor.' });
    }
  },

  // ============================================================
  // POST /api/auth/customer-verify-2fa — paso 2: validar el código
  // ============================================================
  verifyTwofa: async (req, res) => {
    try {
      const { challenge, code } = req.body || {};
      if (!challenge || !code) {
        return res.status(400).json({ message: 'Falta el código de verificación.' });
      }

      const c = twofa.verifyCustomerChallenge(challenge);
      if (!c) {
        return res.status(401).json({
          message: 'La verificación expiró. Vuelve a iniciar sesión.',
          expired: true,
        });
      }

      const customer = await CustomerModel.findById(c.customer_id);
      if (!customer || customer.is_active === false) {
        return res.status(401).json({
          message: 'La verificación no es válida. Vuelve a iniciar sesión.',
          expired: true,
        });
      }

      const cleanCode = String(code).trim();
      const isDevCode = twofa.devCode() && cleanCode === twofa.devCode();

      if (!isDevCode) {
        const hasOtp = customer.twofa_code_hash && customer.twofa_expires_at;
        const notExpired = hasOtp && new Date(customer.twofa_expires_at).getTime() > Date.now();

        if (!hasOtp || !notExpired) {
          await CustomerModel.clearTwofa(customer.customer_id);
          return res.status(400).json({
            message: 'El código expiró. Reenvíalo para continuar.',
            expired: true,
          });
        }
        if (customer.twofa_attempts >= twofa.MAX_ATTEMPTS) {
          await CustomerModel.clearTwofa(customer.customer_id);
          return res.status(429).json({
            message: 'Demasiados intentos. Reenvía el código para continuar.',
            expired: true,
          });
        }

        const ok = twofa.hashCode(cleanCode) === customer.twofa_code_hash;
        if (!ok) {
          const attempts = await CustomerModel.incrementTwofaAttempts(customer.customer_id);
          const left = Math.max(0, twofa.MAX_ATTEMPTS - (attempts || twofa.MAX_ATTEMPTS));
          if (left <= 0) {
            await CustomerModel.clearTwofa(customer.customer_id);
            return res.status(429).json({
              message: 'Demasiados intentos. Reenvía el código para continuar.',
              expired: true,
            });
          }
          return res.status(401).json({ message: 'Código incorrecto.', attempts_left: left });
        }
      }

      // ── Código válido (o código de demo): un solo uso → se invalida ──
      await CustomerModel.clearTwofa(customer.customer_id);

      const token = signCustomerToken(customer, c.remember === true);
      return res.json({ token, customer: sanitize(customer) });
    } catch (err) {
      console.error('[customer-auth] verify-2fa', err);
      return res.status(500).json({ message: 'Error del servidor.' });
    }
  },

  // ============================================================
  // POST /api/auth/customer-resend-2fa — reenviar el código (con cooldown)
  // ============================================================
  resendTwofa: async (req, res) => {
    try {
      const { challenge } = req.body || {};
      const c = challenge && twofa.verifyCustomerChallenge(challenge);
      if (!c) {
        return res.status(401).json({
          message: 'La verificación expiró. Vuelve a iniciar sesión.',
          expired: true,
        });
      }

      const customer = await CustomerModel.findById(c.customer_id);
      if (!customer || customer.is_active === false || !customer.email) {
        return res.status(401).json({
          message: 'La verificación no es válida. Vuelve a iniciar sesión.',
          expired: true,
        });
      }

      // Cooldown de reenvío.
      if (customer.twofa_sent_at) {
        const elapsed = (Date.now() - new Date(customer.twofa_sent_at).getTime()) / 1000;
        if (elapsed < twofa.RESEND_COOLDOWN_SECONDS) {
          const wait = Math.ceil(twofa.RESEND_COOLDOWN_SECONDS - elapsed);
          return res.status(429).json({
            message: `Espera ${wait} s para reenviar el código.`,
            resend_available_in: wait,
          });
        }
      }

      await issueCustomerOtp(customer);

      const payload = {
        message: 'Te enviamos un nuevo código a tu correo.',
        challenge: twofa.signCustomerChallenge(customer, c.remember === true),
        email_masked: twofa.maskEmail(customer.email),
        resend_available_in: twofa.RESEND_COOLDOWN_SECONDS,
        expires_in: twofa.CODE_TTL_MINUTES * 60,
      };
      if (!hasSmtp() && isDev()) payload.dev_delivery = 'console';
      return res.json(payload);
    } catch (err) {
      console.error('[customer-auth] resend-2fa', err);
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
        const tokenInfoRes = await fetchWithTimeout(
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
        const profileRes = await fetchWithTimeout('https://www.googleapis.com/oauth2/v3/userinfo', {
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

      // Fire-and-forget: el correo NUNCA bloquea la respuesta (igual que staff/2FA).
      // Antes hacía `await sendPasswordResetEmail(...)`, lo que con un SMTP lento/
      // caído dejaba la pantalla "cargando" hasta el timeout. Ahora responde ya.
      sendPasswordResetEmail(customer.email, link).catch((e) =>
        console.error('[customer-auth] envío de reset (2º plano) falló:', e.message)
      );

      const payload = { ...GENERIC };
      // Solo en dev y sin SMTP configurado, exponemos el enlace para probar local.
      if (!hasSmtp() && isDev()) {
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
  // COMPARTIDO cliente + personal: el token puede pertenecer a un customer o a
  // un user (personal/admin). Devolvemos `audience` para que el frontend ajuste
  // el "volver" y el redirect ('customer' | 'staff' | 'admin').
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
      let audience = 'customer';
      if (record.user_id) {
        const u = await UserModel.findById(record.user_id);
        audience = u && u.role === 'admin' ? 'admin' : 'staff';
      }
      return res.json({ valid: true, audience });
    } catch (err) {
      console.error('Error en validate reset token:', err);
      return res.status(500).json({ valid: false, message: 'Error del servidor.' });
    }
  },

  // ============================================================
  // POST /api/auth/reset-password — fijar nueva contraseña
  // ============================================================
  // COMPARTIDO cliente + personal: según el dueño del token (user_id o
  // customer_id) actualiza la tabla correspondiente. El reseteo de un usuario
  // limpia además su bloqueo por intentos (UserModel.updatePassword).
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

      if (record.user_id) {
        // Token de personal/admin → actualizar tabla users.
        await UserModel.updatePassword(record.user_id, hashed);
        await PasswordResetModel.markUsed(record.reset_id);
        await PasswordResetModel.invalidateForUser(record.user_id);
      } else {
        // Token de cliente → actualizar tabla customer.
        await CustomerModel.updatePassword(record.customer_id, hashed);
        await PasswordResetModel.markUsed(record.reset_id);
        await PasswordResetModel.invalidateForCustomer(record.customer_id);
      }

      return res.json({ message: 'Contraseña actualizada correctamente.' });
    } catch (err) {
      console.error('Error en reset-password:', err);
      return res.status(500).json({ message: 'Error del servidor.' });
    }
  }
};

module.exports = customerAuthController;
