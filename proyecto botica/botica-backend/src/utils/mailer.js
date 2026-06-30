// ============================================================
// mailer — Envío de correos transaccionales (Resend HTTP API)
// ============================================================
// Render BLOQUEA el SMTP saliente, así que nodemailer/Gmail nunca entregaba
// (timeout). Este módulo envía por la API HTTP de Resend (https://resend.com),
// que Render sí permite, con un simple fetch a https://api.resend.com/emails.
//
// La INTERFAZ PÚBLICA no cambió (los controladores siguen llamando igual):
//   · sendTwofaCodeEmail(to, code, { minutes })
//   · sendPasswordResetEmail(to, resetLink)
//   · hasSmtp()  → ahora significa "¿hay correo configurado?" (RESEND_API_KEY).
// Tampoco cambian las plantillas/diseño de los correos.
//
// Patrón NO BLOQUEANTE: los controladores llaman estas funciones en 2º plano
// (fire-and-forget). Aquí el fetch lleva un timeout corto (AbortController) para
// que un fallo/lentitud de Resend NUNCA cuelgue la respuesta HTTP.
//
// Variables de entorno (ver .env.example):
//   RESEND_API_KEY   → API key de Resend. Sin ella: modo dev (loguea en consola).
//   MAIL_FROM        → remitente. Default 'onboarding@resend.dev' (prueba).
//   MAIL_TIMEOUT_MS  → timeout del envío (ms). Default 8000 (cae a SMTP_TIMEOUT_MS).
//
// NOTA PRODUCCIÓN: con el remitente de prueba 'onboarding@resend.dev', Resend
// SOLO entrega al correo de la cuenta Resend. Para enviar a cualquier destinatario
// hay que verificar un dominio propio en Resend y poner MAIL_FROM con ese dominio
// (p. ej. 'Boticas Central <no-reply@tudominio.com>'). Solo cambia MAIL_FROM.
// ============================================================

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** ¿Hay correo configurado (Resend)? Sin API key → modo dev (consola). */
const mailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/** Remitente. Default al remitente de prueba de Resend (sin verificar dominio). */
const mailFrom = () => process.env.MAIL_FROM || 'onboarding@resend.dev';

// Timeout del envío. Reusa SMTP_TIMEOUT_MS si existe (compatibilidad), o
// MAIL_TIMEOUT_MS; 8s por defecto.
const mailTimeout = () =>
  Number(process.env.MAIL_TIMEOUT_MS || process.env.SMTP_TIMEOUT_MS) || 8000;

/**
 * Envía un correo por la API de Resend con timeout (AbortController).
 * Resuelve con la respuesta de Resend ({ id }) en éxito; LANZA error si Resend
 * responde no-2xx, si la red falla o si se agota el timeout. NUNCA queda colgado.
 */
async function resendSend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const ms = mailTimeout();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: mailFrom(), to, subject, html, text }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = (data && (data.message || data.name)) || `HTTP ${res.status}`;
      throw new Error(`Resend ${res.status}: ${reason}`);
    }
    return data; // { id: '...' }
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error(`Resend: tiempo de espera agotado (${ms}ms)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Envía el correo de restablecimiento de contraseña.
 * Devuelve { sent: true } si salió por Resend, o { sent: false } si se usó el
 * fallback de desarrollo (sin RESEND_API_KEY: el enlace se loguea en consola).
 */
async function sendPasswordResetEmail(to, resetLink) {
  if (!mailConfigured()) {
    // Fallback de desarrollo: sin RESEND_API_KEY, mostramos el enlace en consola.
    console.log('\n──────────────────────────────────────────────────────────');
    console.log('[DEV] RESEND_API_KEY no configurada — enlace de recuperación de contraseña:');
    console.log(`  → ${resetLink}`);
    console.log('  (válido 1 hora). Configura RESEND_API_KEY en .env para enviar correo real.');
    console.log('──────────────────────────────────────────────────────────\n');
    return { sent: false };
  }

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

  const data = await resendSend({
    to,
    subject: 'Restablece tu contraseña — Boticas Central',
    text:
      `Recibimos una solicitud para restablecer tu contraseña.\n\n` +
      `Abre este enlace (válido 1 hora):\n${resetLink}\n\n` +
      `Si no fuiste tú, ignora este correo.`,
    html,
  });

  console.log(`[mailer] enlace de recuperación enviado a ${to} (resend id ${data.id || '?'})`);
  return { sent: true };
}

/**
 * Envía el código de verificación en dos pasos (2FA) al iniciar sesión.
 * `code` es el OTP de 6 dígitos. Devuelve { sent: true } si salió por Resend, o
 * { sent: false } si NO hay correo configurado (dev: el código se loguea).
 */
async function sendTwofaCodeEmail(to, code, { minutes = 10 } = {}) {
  if (!mailConfigured()) {
    // Fallback de desarrollo: sin RESEND_API_KEY, mostramos el código en consola.
    console.log('\n──────────────────────────────────────────────────────────');
    console.log('[DEV] RESEND_API_KEY no configurada — código de verificación (2FA):');
    console.log(`  → ${code}`);
    console.log(`  (válido ${minutes} min). Configura RESEND_API_KEY en .env para enviar correo real.`);
    console.log('──────────────────────────────────────────────────────────\n');
    return { sent: false };
  }

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

  const data = await resendSend({
    to,
    subject: `Tu código de acceso es ${code} — Boticas Central`,
    text:
      `Tu código de verificación de Boticas Central es: ${code}\n\n` +
      `Caduca en ${minutes} minutos y es de un solo uso.\n` +
      `Si no intentaste iniciar sesión, ignora este correo.`,
    html,
  });

  console.log(`[mailer] código 2FA enviado a ${to} (resend id ${data.id || '?'})`);
  return { sent: true };
}

// `hasSmtp` se conserva como nombre público (lo usan los controladores para
// decidir el fallback dev). Ahora refleja si hay correo configurado vía Resend.
module.exports = {
  sendPasswordResetEmail,
  sendTwofaCodeEmail,
  hasSmtp: mailConfigured,
  // alias con nombre actual, por si se quiere usar en código nuevo:
  isMailConfigured: mailConfigured,
};
