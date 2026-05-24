// Helpers de conversión de tipos para responses.
// PostgreSQL devuelve DECIMAL/NUMERIC como string. Esto los normaliza a número.

const toFloat = (v) => {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const toInt = (v) => {
  if (v === null || v === undefined) return 0;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

module.exports = { toFloat, toInt };
