// ============================================================
// twofa — utilidades de verificación en dos pasos (2FA por correo)
// ============================================================
// Encapsula la configuración (variables de entorno) y las funciones puras del
// flujo de 2FA: generar/hashear el OTP, enmascarar el correo y firmar/verificar
// el "challenge" (token corto que liga el paso de verificación con el usuario,
// sin reenviar la contraseña).
//
// Variables de entorno (ver .env.example):
//   TWOFA_ENABLED   true|false  → si es false, el 2FA se omite por completo.
//   TWOFA_DEV_CODE  (opcional)  → código que SIEMPRE es válido (solo demo/local).
// ============================================================

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Parámetros fijos del OTP (no negociables a nivel producto).
const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;     // el código caduca en 10 min
const RESEND_COOLDOWN_SECONDS = 60; // reenvío disponible cada 60 s
const MAX_ATTEMPTS = 5;          // 5 intentos por código

/** ¿El 2FA está activo? Default true. Solo se desactiva con TWOFA_ENABLED=false. */
const isTwofaEnabled = () => String(process.env.TWOFA_ENABLED).toLowerCase() !== 'false';

/**
 * ¿El 2FA del CLIENTE está activo? Flag independiente TWOFA_CUSTOMER_ENABLED:
 *   - sin definir / vacío → sigue al global TWOFA_ENABLED (default).
 *   - 'false'            → desactiva SOLO el del cliente (staff intacto).
 *   - cualquier otro     → activo.
 * Así se puede apagar el del cliente sin tocar el de staff y viceversa.
 */
const isTwofaCustomerEnabled = () => {
  const v = process.env.TWOFA_CUSTOMER_ENABLED;
  if (v === undefined || String(v).trim() === '') return isTwofaEnabled();
  return String(v).toLowerCase() !== 'false';
};

/** Código de respaldo de demo (si está definido, siempre es válido). Solo local. */
const devCode = () => {
  const v = (process.env.TWOFA_DEV_CODE || '').trim();
  return v.length > 0 ? v : null;
};

/** Genera un OTP numérico de 6 dígitos criptográficamente aleatorio. */
function generateCode() {
  // randomInt evita sesgo de módulo. Rellena con ceros a la izquierda.
  const n = crypto.randomInt(0, 10 ** CODE_LENGTH);
  return String(n).padStart(CODE_LENGTH, '0');
}

/** sha256(hex) del código. Solo guardamos el hash, nunca el código en claro. */
const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

/** Token aleatorio opaco para "recordar dispositivo" (vive en el navegador). */
const generateDeviceToken = () => crypto.randomBytes(32).toString('hex');

/** sha256(hex) del token de dispositivo (lo que se guarda en BD). */
const hashDeviceToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

/**
 * Enmascara un correo para mostrarlo en la UI: "jeanarteaga@gmail.com"
 * → "je******@gmail.com". Conserva el dominio para dar confianza.
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '****@****';
  const [local, domain] = email.split('@');
  const head = local.slice(0, 2);
  const stars = '*'.repeat(Math.max(3, local.length - head.length));
  return `${head}${stars}@${domain}`;
}

// ── Challenge: token corto que liga el paso de verificación con el usuario ──
// Va firmado con JWT_SECRET y marcado con scope '2fa' para que NO pueda usarse
// como token de sesión ni viceversa. Caduca con el código (10 min).

function signChallenge(user) {
  return jwt.sign(
    { scope: '2fa', user_id: user.user_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: `${CODE_TTL_MINUTES}m` }
  );
}

/** Verifica el challenge. Devuelve { user_id, role } o null si es inválido/expiró. */
function verifyChallenge(challenge) {
  try {
    const decoded = jwt.verify(String(challenge || ''), process.env.JWT_SECRET);
    if (decoded.scope !== '2fa' || !decoded.user_id) return null;
    return { user_id: decoded.user_id, role: decoded.role };
  } catch {
    return null;
  }
}

// ── Challenge del CLIENTE ──────────────────────────────────────────────────
// Scope DISTINTO ('2fa_cust') para que un challenge de cliente NO pueda usarse
// en el verify de staff ni viceversa. Lleva customer_id y `remember` (duración
// de sesión elegida en el paso 1), firmado por nosotros: no es manipulable.

function signCustomerChallenge(customer, remember = false) {
  return jwt.sign(
    { scope: '2fa_cust', customer_id: customer.customer_id, role: 'cust', remember: !!remember },
    process.env.JWT_SECRET,
    { expiresIn: `${CODE_TTL_MINUTES}m` }
  );
}

/** Verifica el challenge de cliente. Devuelve { customer_id, remember } o null. */
function verifyCustomerChallenge(challenge) {
  try {
    const decoded = jwt.verify(String(challenge || ''), process.env.JWT_SECRET);
    if (decoded.scope !== '2fa_cust' || !decoded.customer_id) return null;
    return { customer_id: decoded.customer_id, remember: decoded.remember === true };
  } catch {
    return null;
  }
}

module.exports = {
  CODE_LENGTH,
  CODE_TTL_MINUTES,
  RESEND_COOLDOWN_SECONDS,
  MAX_ATTEMPTS,
  isTwofaEnabled,
  isTwofaCustomerEnabled,
  devCode,
  generateCode,
  hashCode,
  generateDeviceToken,
  hashDeviceToken,
  maskEmail,
  signChallenge,
  verifyChallenge,
  signCustomerChallenge,
  verifyCustomerChallenge,
};
