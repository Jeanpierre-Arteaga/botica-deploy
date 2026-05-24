// ============================================================
// MercadoPago — servicio de pagos (cargo con tarjeta + consulta)
// ============================================================
// Singleton de cliente MercadoPago configurado con el access token
// del .env. Expone:
//   - processCardPayment({ token, amount, ... }) -> {success, mp_payment_id, status, status_detail}
//   - getPaymentStatus(mp_payment_id)             -> {success, status, status_detail}
// ============================================================

const { MercadoPagoConfig, Payment } = require('mercadopago');

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

const paymentClient = new Payment(mpClient);

async function processCardPayment({
  token,
  amount,
  payment_method_id,
  installments,
  email,
  description,
  payer = {},
}) {
  try {
    const body = {
      transaction_amount: Number(amount),
      token,
      description,
      installments: Number(installments) || 1,
      payment_method_id,
      payer: {
        email,
        identification: payer.identification || undefined,
      },
    };

    const response = await paymentClient.create({ body });

    return {
      success: response.status === 'approved',
      mp_payment_id: response.id != null ? response.id.toString() : null,
      status: response.status,
      status_detail: response.status_detail,
      raw: response,
    };
  } catch (err) {
    console.error('[MP] Error processing card payment:', err.message);
    const detail =
      (err.cause && Array.isArray(err.cause) && err.cause[0] && err.cause[0].description) ||
      err.message;
    return {
      success: false,
      error: err.message,
      mp_payment_id: null,
      status: 'error',
      status_detail: detail,
    };
  }
}

async function getPaymentStatus(mp_payment_id) {
  try {
    const response = await paymentClient.get({ id: mp_payment_id });
    return {
      success: true,
      status: response.status,
      status_detail: response.status_detail,
      raw: response,
    };
  } catch (err) {
    console.error('[MP] Error fetching payment:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  processCardPayment,
  getPaymentStatus,
};
