const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db'); // ajusta la ruta si es diferente

const UserModel = require('../models/userModel');
const TrustedDeviceModel = require('../models/trustedDeviceModel');
const PasswordResetModel = require('../models/passwordResetModel');
const twofa = require('../utils/twofa');
const { sendTwofaCodeEmail, sendPasswordResetEmail, hasSmtp } = require('../utils/mailer');

// Bloqueo por intentos fallidos de CONTRASEÑA: a los 3 fallos, 5 minutos (staff).
const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 5;
// Mensaje NEUTRO: no revela si el usuario existe o si la contraseña es la que falla.
const NEUTRAL = 'Usuario o contraseña incorrectos.';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isDev = () => (process.env.NODE_ENV || 'development') !== 'production';
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const frontendUrl = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

// Destino del código OTP: la columna users.email, o el user_code si éste ya es
// un correo (los accesos nuevos usan el correo corporativo como user_code).
function resolveTwofaEmail(user) {
  if (user.email && EMAIL_RE.test(String(user.email))) return String(user.email);
  if (user.user_code && EMAIL_RE.test(String(user.user_code))) return String(user.user_code);
  return null;
}

// Firma el JWT de sesión (payload unificado de staff/admin).
function signSessionToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
      full_name: user.full_name,
      location_id: user.location_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// Respuesta de login exitoso (misma forma de siempre) + sella last_login.
// `extra` permite añadir flags (twofa, trusted_device, device_token).
function issueSession(res, user, extra = {}) {
  // Fire-and-forget: sella el acceso y limpia el bloqueo de contraseña.
  UserModel.markLogin(user.user_id).catch((e) =>
    console.error('[auth] markLogin', e.message)
  );

  const token = signSessionToken(user);
  return res.json({
    token,
    user: {
      user_id: user.user_id,
      user_code: user.user_code,
      full_name: user.full_name,
      role: user.role,
      location_id: user.location_id,
      location_name: user.location_name || null,
      is_active: user.is_active,
      photo_url: user.photo_url || null,
    },
    ...extra,
  });
}

// Genera y GUARDA un OTP nuevo (hash + expiración) y dispara el correo en
// SEGUNDO PLANO. Devolver no espera al SMTP: el envío del correo NUNCA debe
// bloquear ni colgar la respuesta HTTP (en Render el SMTP saliente puede estar
// bloqueado/lentísimo). Si el correo falla o tarda, se registra y se ignora —
// el código ya quedó guardado y el usuario puede reenviarlo. En desarrollo sin
// SMTP, el mailer loguea el código en consola (igual que el reset del cliente).
async function issueOtp(user, email) {
  const code = twofa.generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + twofa.CODE_TTL_MINUTES * 60 * 1000);

  // Lo único que esperamos es la escritura en BD (rápida): así el código ya
  // existe cuando respondemos, listo para verificarse o reenviarse.
  await UserModel.setTwofaCode(user.user_id, {
    code_hash: twofa.hashCode(code),
    expires_at: expiresAt,
    sent_at: now,
  });

  // Fire-and-forget: el correo viaja por fuera del ciclo request/response.
  sendTwofaCodeEmail(email, code, { minutes: twofa.CODE_TTL_MINUTES }).catch((e) =>
    console.error('[auth] envío de OTP (2º plano) falló:', e.message)
  );
}

// ============================================================
// POST /api/auth/login — paso 1: credenciales
// ============================================================
const login = async (req, res) => {
  const { user_code, user_password, device_token } = req.body;

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

    // El bloqueo por intentos aplica SOLO a staff ('emp'). El administrador ES
    // quien restablece contraseñas: nunca se le cuenta ni se le bloquea.
    const enforceLockout = user.role === 'emp';

    // ¿Cuenta bloqueada todavía? → 423 con el tiempo restante. (Solo staff.)
    if (enforceLockout && user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
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
      // Admin: no se cuenta ni se bloquea. Mensaje simple, sin contador.
      if (!enforceLockout) {
        return res.status(401).json({ message: NEUTRAL });
      }
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

    // ── Contraseña correcta ───────────────────────────────────────────────
    // La clave fue correcta: limpiamos el bloqueo de contraseña ya (aunque el
    // 2FA quede pendiente, no debe penalizarse por intentos previos).
    if (enforceLockout) {
      UserModel.clearPasswordLock(user.user_id).catch((e) =>
        console.error('[auth] clearPasswordLock', e.message)
      );
    }

    const twofaEmail = resolveTwofaEmail(user);

    // 2FA desactivado por entorno, o el usuario no tiene correo de destino →
    // login directo (no se puede/ no se debe pedir el código). NUNCA bloqueamos.
    if (!twofa.isTwofaEnabled() || !twofaEmail) {
      if (twofa.isTwofaEnabled() && !twofaEmail) {
        console.warn(
          `[auth] 2FA omitido: el usuario #${user.user_id} (${user.user_code}) no tiene correo configurado.`
        );
      }
      return issueSession(res, user, { twofa: false });
    }

    // ── Dispositivo recordado: si presenta un token vigente, se omite el OTP ──
    if (device_token) {
      const td = await TrustedDeviceModel.findValid(
        user.user_id,
        twofa.hashDeviceToken(device_token)
      );
      if (td) {
        TrustedDeviceModel.touch(td.device_id).catch(() => {});
        return issueSession(res, user, { twofa: false, trusted_device: true });
      }
    }

    // ── Hace falta el código: generar/guardar el OTP y enviarlo en 2º plano ──
    // No esperamos al SMTP: respondemos de inmediato pidiendo verificación.
    await issueOtp(user, twofaEmail);

    const payload = {
      twofa_required: true,
      challenge: twofa.signChallenge(user),
      email_masked: twofa.maskEmail(twofaEmail),
      resend_available_in: twofa.RESEND_COOLDOWN_SECONDS,
      expires_in: twofa.CODE_TTL_MINUTES * 60,
    };
    // En desarrollo sin SMTP, avisamos que el código se logueó en consola.
    if (!hasSmtp() && isDev()) payload.dev_delivery = 'console';
    return res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// ============================================================
// POST /api/auth/verify-2fa — paso 2: validar el código
// ============================================================
const verifyTwofa = async (req, res) => {
  try {
    const { challenge, code, remember_device } = req.body || {};
    if (!challenge || !code) {
      return res.status(400).json({ message: 'Falta el código de verificación.' });
    }

    const c = twofa.verifyChallenge(challenge);
    if (!c) {
      return res.status(401).json({
        message: 'La verificación expiró. Vuelve a iniciar sesión.',
        expired: true,
      });
    }

    const user = await UserModel.findAuthById(c.user_id);
    if (!user) {
      return res.status(401).json({
        message: 'La verificación no es válida. Vuelve a iniciar sesión.',
        expired: true,
      });
    }

    const cleanCode = String(code).trim();
    const isDevCode = twofa.devCode() && cleanCode === twofa.devCode();

    if (!isDevCode) {
      const hasOtp = user.twofa_code_hash && user.twofa_expires_at;
      const notExpired = hasOtp && new Date(user.twofa_expires_at).getTime() > Date.now();

      if (!hasOtp || !notExpired) {
        await UserModel.clearTwofa(user.user_id);
        return res.status(400).json({
          message: 'El código expiró. Reenvíalo para continuar.',
          expired: true,
        });
      }
      if (user.twofa_attempts >= twofa.MAX_ATTEMPTS) {
        await UserModel.clearTwofa(user.user_id);
        return res.status(429).json({
          message: 'Demasiados intentos. Reenvía el código para continuar.',
          expired: true,
        });
      }

      const ok = twofa.hashCode(cleanCode) === user.twofa_code_hash;
      if (!ok) {
        const attempts = await UserModel.incrementTwofaAttempts(user.user_id);
        const left = Math.max(0, twofa.MAX_ATTEMPTS - (attempts || twofa.MAX_ATTEMPTS));
        if (left <= 0) {
          await UserModel.clearTwofa(user.user_id);
          return res.status(429).json({
            message: 'Demasiados intentos. Reenvía el código para continuar.',
            expired: true,
          });
        }
        return res.status(401).json({ message: 'Código incorrecto.', attempts_left: left });
      }
    }

    // ── Código válido (o código de demo): un solo uso → se invalida ──
    await UserModel.clearTwofa(user.user_id);

    const extra = {};
    if (remember_device === true) {
      const rawToken = twofa.generateDeviceToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
      const label = String(req.headers['user-agent'] || '').slice(0, 255) || null;
      await TrustedDeviceModel.create({
        user_id: user.user_id,
        token_hash: twofa.hashDeviceToken(rawToken),
        expires_at: expiresAt,
        label,
      });
      extra.device_token = rawToken;
      extra.trusted_device = true;
    }

    return issueSession(res, user, extra);
  } catch (error) {
    console.error('[auth] verify-2fa', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

// ============================================================
// POST /api/auth/resend-2fa — reenviar el código (con cooldown)
// ============================================================
const resendTwofa = async (req, res) => {
  try {
    const { challenge } = req.body || {};
    const c = challenge && twofa.verifyChallenge(challenge);
    if (!c) {
      return res.status(401).json({
        message: 'La verificación expiró. Vuelve a iniciar sesión.',
        expired: true,
      });
    }

    const user = await UserModel.findAuthById(c.user_id);
    if (!user) {
      return res.status(401).json({
        message: 'La verificación no es válida. Vuelve a iniciar sesión.',
        expired: true,
      });
    }

    const email = resolveTwofaEmail(user);
    if (!email) {
      return res.status(400).json({ message: 'No hay un correo configurado para enviar el código.' });
    }

    // Cooldown de reenvío.
    if (user.twofa_sent_at) {
      const elapsed = (Date.now() - new Date(user.twofa_sent_at).getTime()) / 1000;
      if (elapsed < twofa.RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(twofa.RESEND_COOLDOWN_SECONDS - elapsed);
        return res.status(429).json({
          message: `Espera ${wait} s para reenviar el código.`,
          resend_available_in: wait,
        });
      }
    }

    // Genera/guarda el nuevo OTP y lo envía en 2º plano (no bloquea la respuesta).
    await issueOtp(user, email);

    // Re-emitimos el challenge para que su expiración quede alineada con el
    // nuevo código (10 min desde ahora).
    const payload = {
      message: 'Te enviamos un nuevo código a tu correo.',
      challenge: twofa.signChallenge(user),
      email_masked: twofa.maskEmail(email),
      resend_available_in: twofa.RESEND_COOLDOWN_SECONDS,
      expires_in: twofa.CODE_TTL_MINUTES * 60,
    };
    if (!hasSmtp() && isDev()) payload.dev_delivery = 'console';
    return res.json(payload);
  } catch (error) {
    console.error('[auth] resend-2fa', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

// ============================================================
// POST /api/auth/staff/forgot-password — recuperación de contraseña (personal)
// ============================================================
// Replica el flujo del cliente (forgot → enlace por correo → reset) para los
// usuarios de la tabla `users`. El personal puede identificarse con su CÓDIGO de
// usuario (TRAB01) o con su CORREO. Respuesta SIEMPRE genérica (no revela si la
// cuenta existe). El correo se envía en SEGUNDO PLANO para no colgar la
// respuesta (mismo criterio que el 2FA). El token y su reseteo reutilizan
// password_reset y los endpoints compartidos /auth/reset-password(/validate).
// ============================================================
const forgotPassword = async (req, res) => {
  const GENERIC = {
    message: 'Si la cuenta existe, te enviamos un enlace para restablecer tu contraseña.',
  };
  try {
    const { user_code, email } = req.body || {};
    const identifier = String(user_code || email || '').trim();
    if (!identifier) {
      return res.status(400).json({ message: 'Ingresa tu código de usuario o tu correo.' });
    }

    // Resolver el usuario: por correo si parece email; si no, por código.
    const user = EMAIL_RE.test(identifier)
      ? await UserModel.findByEmail(identifier)
      : await UserModel.findByCode(identifier.toUpperCase());

    // No revelar existencia: respuesta genérica si no hay usuario activo o no
    // tiene un correo de destino.
    const dest = user ? resolveTwofaEmail(user) : null;
    if (!user || !user.is_active || !dest) {
      return res.json(GENERIC);
    }

    // Un token vigente a la vez: invalidar anteriores del mismo usuario.
    await PasswordResetModel.invalidateForUser(user.user_id);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await PasswordResetModel.createForUser({
      user_id: user.user_id,
      token_hash: sha256(rawToken),
      expires_at: expiresAt,
    });

    const link = `${frontendUrl()}/reset-password?token=${rawToken}`;

    // Fire-and-forget: el correo NUNCA bloquea la respuesta (igual que el 2FA).
    sendPasswordResetEmail(dest, link).catch((e) =>
      console.error('[auth] envío de reset staff (2º plano) falló:', e.message)
    );

    const payload = { ...GENERIC, email_masked: twofa.maskEmail(dest) };
    // En desarrollo sin SMTP, devolvemos el enlace para poder probar local.
    if (!hasSmtp() && isDev()) payload.dev_link = link;
    return res.json(payload);
  } catch (error) {
    console.error('[auth] forgot-password (staff)', error);
    // Aún ante error, respondemos genérico para no filtrar información.
    return res.json(GENERIC);
  }
};

module.exports = { login, verifyTwofa, resendTwofa, forgotPassword };
