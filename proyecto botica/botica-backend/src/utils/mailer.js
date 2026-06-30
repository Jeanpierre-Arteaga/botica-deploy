// ============================================================
// mailer — Envío de correos transaccionales (nodemailer)
// ============================================================
// Solo se usa para el flujo de recuperación de contraseña del
// CLIENTE. Si las variables SMTP_* NO están configuradas, NO se
// envía nada: se usa un fallback de desarrollo (loguea el enlace
// en consola) para poder probar el flujo sin email real.
//
// Para activar el correo real, define en backend/.env:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
//   (opcional) SMTP_SECURE=true, SMTP_FROM="Boticas Central <no-reply@...>"
// ============================================================

const nodemailer = require('nodemailer');

// Timeout corto del transporte SMTP. CLAVE para no colgar la respuesta HTTP:
// en Render (y otras PaaS) el SMTP saliente puede estar bloqueado o lentísimo;
// sin estos límites, sendMail se queda esperando minutos. 8s por defecto;
// ajustable con SMTP_TIMEOUT_MS.
const SMTP_TIMEOUT_MS = Number(process.env.SMTP_TIMEOUT_MS) || 8000;

/**
 * Carrera entre una promesa y un timeout. Garantiza que el envío de correo
 * SIEMPRE se resuelve (o rechaza) en un tiempo acotado, aunque el transporte
 * se quede colgado por debajo de los timeouts de nodemailer (p. ej. DNS).
 */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label}: tiempo de espera agotado (${ms}ms)`)),
      ms
    );
    // No mantener vivo el proceso solo por este temporizador.
    if (typeof timer.unref === 'function') timer.unref();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** ¿Hay credenciales SMTP suficientes para enviar de verdad? */
const hasSmtp = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
function getTransporter() {
  if (!hasSmtp()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: String(process.env.SMTP_SECURE) === 'true' || port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Timeouts del socket SMTP: conectar, saludo del servidor e inactividad.
      // Si cualquiera se excede, sendMail rechaza en vez de quedarse colgado.
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });
  }
  return transporter;
}

/**
 * Envía el correo de restablecimiento de contraseña.
 * Devuelve { sent: true } si salió por SMTP, o { sent: false } si se
 * usó el fallback de desarrollo (enlace logueado en consola).
 */
async function sendPasswordResetEmail(to, resetLink) {
  const t = getTransporter();

  if (!t) {
    // Fallback de desarrollo: sin SMTP configurado, mostramos el enlace.
    console.log('\n──────────────────────────────────────────────────────────');
    console.log('[DEV] SMTP no configurado — enlace de recuperación de contraseña:');
    console.log(`  → ${resetLink}`);
    console.log('  (válido 1 hora). Configura SMTP_* en .env para enviar correo real.');
    console.log('──────────────────────────────────────────────────────────\n');
    return { sent: false };
  }

  const from =
    process.env.SMTP_FROM ||
    `Boticas Central <${process.env.SMTP_USER}>`;

  const html = `
  <div style="margin:0;padding:24px;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#F26430;padding:20px 28px;">
        <span style="color:#ffffff;font-size:18px;font-weight:700;">Boticas Central</span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#1A1F2E;">Restablece tu contraseña</h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4A5260;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta.
          Haz clic en el botón para crear una nueva. Este enlace caduca en 1 hora.
        </p>
        <a href="${resetLink}"
           style="display:inline-block;background:#F26430;color:#ffffff;text-decoration:none;
                  font-weight:600;font-size:14px;padding:12px 22px;border-radius:12px;">
          Restablecer contraseña
        </a>
        <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#9CA3AF;">
          Si no solicitaste este cambio, puedes ignorar este correo; tu contraseña seguirá igual.
        </p>
        <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;word-break:break-all;">
          ¿No funciona el botón? Copia y pega este enlace:<br>${resetLink}
        </p>
      </div>
    </div>
  </div>`;

  await withTimeout(
    t.sendMail({
      from,
      to,
      subject: 'Restablece tu contraseña — Boticas Central',
      text:
        `Recibimos una solicitud para restablecer tu contraseña.\n\n` +
        `Abre este enlace (válido 1 hora):\n${resetLink}\n\n` +
        `Si no fuiste tú, ignora este correo.`,
      html,
    }),
    SMTP_TIMEOUT_MS,
    'sendPasswordResetEmail'
  );

  return { sent: true };
}

/**
 * Envía el código de verificación en dos pasos (2FA) al iniciar sesión un
 * usuario de personal/administrador. `code` es el OTP de 6 dígitos.
 * Devuelve { sent: true } si salió por SMTP, o { sent: false } si NO hay SMTP
 * configurado (modo desarrollo: el código se loguea en consola).
 */
async function sendTwofaCodeEmail(to, code, { minutes = 10 } = {}) {
  const t = getTransporter();

  if (!t) {
    // Fallback de desarrollo: sin SMTP, mostramos el código en consola.
    console.log('\n──────────────────────────────────────────────────────────');
    console.log('[DEV] SMTP no configurado — código de verificación (2FA):');
    console.log(`  → ${code}`);
    console.log(`  (válido ${minutes} min). Configura SMTP_* en .env para enviar correo real.`);
    console.log('──────────────────────────────────────────────────────────\n');
    return { sent: false };
  }

  const from =
    process.env.SMTP_FROM ||
    `Boticas Central <${process.env.SMTP_USER}>`;

  // Separa los dígitos para que se lean cómodos en el correo.
  const spaced = String(code).split('').join('&nbsp;&nbsp;');

  const html = `
  <div style="margin:0;padding:24px;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#F26430;padding:20px 28px;">
        <span style="color:#ffffff;font-size:18px;font-weight:700;">Boticas Central</span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#1A1F2E;">Verificación en dos pasos</h1>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#4A5260;">
          Usa este código para completar tu inicio de sesión. Caduca en
          ${minutes} minutos y es de un solo uso.
        </p>
        <div style="margin:0 0 18px;text-align:center;">
          <div style="display:inline-block;background:#FFF4EE;border:1px solid #F26430;
                      border-radius:12px;padding:16px 26px;font-size:30px;font-weight:700;
                      letter-spacing:4px;color:#D94E1F;">
            ${spaced}
          </div>
        </div>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#9CA3AF;">
          Si no intentaste iniciar sesión, ignora este correo y considera cambiar tu contraseña.
          Nunca compartas este código con nadie.
        </p>
      </div>
    </div>
  </div>`;

  await withTimeout(
    t.sendMail({
      from,
      to,
      subject: `Tu código de acceso es ${code} — Boticas Central`,
      text:
        `Tu código de verificación de Boticas Central es: ${code}\n\n` +
        `Caduca en ${minutes} minutos y es de un solo uso.\n` +
        `Si no intentaste iniciar sesión, ignora este correo.`,
      html,
    }),
    SMTP_TIMEOUT_MS,
    'sendTwofaCodeEmail'
  );

  return { sent: true };
}

module.exports = { sendPasswordResetEmail, sendTwofaCodeEmail, hasSmtp };
