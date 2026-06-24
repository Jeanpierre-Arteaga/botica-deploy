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

  await t.sendMail({
    from,
    to,
    subject: 'Restablece tu contraseña — Boticas Central',
    text:
      `Recibimos una solicitud para restablecer tu contraseña.\n\n` +
      `Abre este enlace (válido 1 hora):\n${resetLink}\n\n` +
      `Si no fuiste tú, ignora este correo.`,
    html,
  });

  return { sent: true };
}

module.exports = { sendPasswordResetEmail, hasSmtp };
