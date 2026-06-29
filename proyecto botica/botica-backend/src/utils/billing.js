// ============================================================
// billing — Validación de datos fiscales (Factura): RUC + Razón social
// ============================================================
// Espeja lib/billing.ts del frontend. NO se confía solo en el front: estas
// reglas se re-verifican antes de guardar el pago. Sin servicios externos.
// ============================================================

const RUC_VALID_PREFIXES = ['10', '15', '16', '17', '20'];
const BILLING_NAME_MIN = 3;
const BILLING_NAME_MAX = 200;

/** Deja solo dígitos y recorta a 11 (longitud máxima del RUC). */
function sanitizeRuc(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 11);
}

/** Algoritmo oficial módulo 11 del RUC (SUNAT). */
function hasValidRucCheckDigit(ruc) {
  if (!/^\d{11}$/.test(ruc)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(ruc[i]) * weights[i];
  const rest = 11 - (sum % 11);
  const check = rest === 10 ? 0 : rest === 11 ? 1 : rest;
  return check === Number(ruc[10]);
}

/** null si el RUC es válido; si no, mensaje de error específico. */
function rucError(raw) {
  const ruc = sanitizeRuc(raw);
  if (ruc.length !== 11) return 'El RUC debe tener 11 dígitos.';
  if (!RUC_VALID_PREFIXES.includes(ruc.slice(0, 2))) {
    return 'El RUC debe empezar en 10, 15, 16, 17 o 20.';
  }
  if (!hasValidRucCheckDigit(ruc)) {
    return 'El RUC no es válido (dígito verificador incorrecto).';
  }
  return null;
}

/** null si la razón social es válida; si no, mensaje de error. */
function billingNameError(raw) {
  const name = String(raw || '').trim();
  if (name.length < BILLING_NAME_MIN) return 'La razón social es requerida (mín. 3 caracteres).';
  if (name.length > BILLING_NAME_MAX) return 'La razón social es demasiado larga (máx. 200).';
  return null;
}

module.exports = {
  RUC_VALID_PREFIXES,
  sanitizeRuc,
  hasValidRucCheckDigit,
  rucError,
  billingNameError,
};
