// ============================================================
// dates — Helpers de fecha/hora en zona horaria de negocio (Perú)
// ============================================================
// Espejo en el FRONTEND del helper de backend `utils/dates.js`. El
// criterio único del panel es America/Lima (UTC-5, sin horario de
// verano): NUNCA se calcula el "hoy" en UTC ni en la zona del
// navegador, porque después de las 19:00 de Perú UTC ya cambió de día
// y los KPIs "de hoy" caerían en la fecha equivocada.
// ============================================================

export const BUSINESS_TZ = 'America/Lima';

// Formateadores construidos una sola vez (instanciar Intl es costoso).

// 'YYYY-MM-DD' en hora de Perú — mismo formato que aceptan las consultas.
const _ymdLima = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Fecha legible: "sábado, 28 jun 2026".
const _displayLima = new Intl.DateTimeFormat('es-PE', {
  timeZone: BUSINESS_TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// Hora: "16:45".
const _timeLima = new Intl.DateTimeFormat('es-PE', {
  timeZone: BUSINESS_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Fecha actual ('YYYY-MM-DD') en la zona horaria de Perú. */
export function todayInLima(): string {
  return _ymdLima.format(new Date());
}

/** Fecha legible en hora de Perú, con la primera letra en mayúscula. */
export function formatLimaDate(date: Date = new Date()): string {
  const s = _displayLima.format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Hora ('HH:mm') en la zona horaria de Perú. */
export function formatLimaTime(date: Date = new Date()): string {
  return _timeLima.format(date);
}
