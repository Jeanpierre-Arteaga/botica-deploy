// ============================================================
// billing — Validación de datos fiscales para comprobante "Factura"
// ============================================================
// Sin servicios externos: solo reglas locales. La razón social la escribe el
// usuario (a prueba de fallos). El RUC se valida por longitud, prefijo y
// dígito verificador (algoritmo módulo 11 de SUNAT). Esta lógica se espeja en
// el backend (utils/billing.js); el front NO es la única barrera.
// ============================================================

export const RUC_VALID_PREFIXES = ['10', '15', '16', '17', '20'];

export const BILLING_NAME_MIN = 3;
export const BILLING_NAME_MAX = 200;

/** Deja solo dígitos y recorta a 11 (longitud máxima del RUC). */
export function sanitizeRuc(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

/** Algoritmo oficial módulo 11 del RUC (SUNAT). */
export function hasValidRucCheckDigit(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(ruc[i]) * weights[i];
  const rest = 11 - (sum % 11);
  const check = rest === 10 ? 0 : rest === 11 ? 1 : rest;
  return check === Number(ruc[10]);
}

/**
 * Valida un RUC peruano (11 dígitos, prefijo válido, dígito verificador).
 * Devuelve un mensaje de error específico, o null si es válido.
 */
export function rucError(raw: string): string | null {
  const ruc = sanitizeRuc(raw);
  if (ruc.length === 0) return 'Ingresa el RUC de la empresa.';
  if (ruc.length < 11) return `El RUC debe tener 11 dígitos (llevas ${ruc.length}).`;
  if (!RUC_VALID_PREFIXES.includes(ruc.slice(0, 2))) {
    return 'El RUC debe empezar en 10, 15, 16, 17 o 20.';
  }
  if (!hasValidRucCheckDigit(ruc)) {
    return 'El RUC no es válido (dígito verificador incorrecto).';
  }
  return null;
}

/** Valida la razón social (texto libre). null si es válida. */
export function billingNameError(raw: string): string | null {
  const name = raw.trim();
  if (name.length === 0) return 'Ingresa la razón social de la empresa.';
  if (name.length < BILLING_NAME_MIN) return `Mínimo ${BILLING_NAME_MIN} caracteres.`;
  if (name.length > BILLING_NAME_MAX) return `Máximo ${BILLING_NAME_MAX} caracteres.`;
  return null;
}

/** true si los datos fiscales para Factura están completos y son válidos. */
export function isBillingValid(ruc: string, name: string): boolean {
  return rucError(ruc) === null && billingNameError(name) === null;
}
