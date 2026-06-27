// Zona horaria de negocio: Perú (America/Lima, UTC-5, sin horario de verano).
//
// CRITERIO ÚNICO DE FECHAS DEL PANEL
// ----------------------------------
// La columna orders.order_date es `timestamp without time zone` y se persiste
// con NOW()/CURRENT_TIMESTAMP bajo una sesión en UTC-5, por lo que el valor
// guardado es la HORA LOCAL DE PERÚ (wall-clock). En consecuencia, en SQL
// `order_date::date` y `CURRENT_DATE` ya representan la fecha calendario de Lima
// (por eso el gráfico sales-series, que agrupa por CURRENT_DATE/DATE(order_date),
// siempre cae en el día correcto).
//
// El error de los KPIs "de hoy" venía de calcular el día en Node con
// `new Date().toISOString()`, que es UTC: después de las 19:00 de Perú, UTC ya
// está en el día siguiente, así que la consulta `WHERE DATE(order_date) = $1`
// buscaba un día sin datos → todo en 0.
//
// Para mantener UN SOLO criterio, el "hoy" por defecto se calcula SIEMPRE en
// America/Lima (no en UTC ni en la zona del servidor Node).
const BUSINESS_TZ = 'America/Lima';

// Formateador en-CA → produce 'YYYY-MM-DD', el mismo formato que aceptan las
// consultas ($1::date). Se construye una sola vez (es costoso instanciarlo).
const _ymdLima = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Fecha actual ('YYYY-MM-DD') en la zona horaria de Perú.
function todayInLima() {
  return _ymdLima.format(new Date());
}

module.exports = { BUSINESS_TZ, todayInLima };
