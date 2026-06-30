const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // SSL: Supabase (y la mayoría de Postgres gestionados) EXIGE conexión cifrada.
  // Por defecto activamos SSL aceptando el certificado del proveedor. En local,
  // pon DB_SSL=false en el .env para desactivarlo (Postgres local sin SSL).
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  // Fija la zona horaria de la sesión a Perú (America/Lima, UTC-5) de forma
  // EXPLÍCITA, sin depender de la zona por defecto del host de la BD. Así
  // CURRENT_TIMESTAMP/NOW() (escritura de order_date) y CURRENT_DATE /
  // order_date::date (lectura) usan SIEMPRE el día calendario de Lima → un
  // único criterio de fechas para todo el panel. Es seguro para los datos
  // existentes: ya se guardaron en UTC-5 (sin horario de verano), idéntico
  // wall-clock que America/Lima, así que no se desplaza ninguna fecha.
  options: '-c timezone=America/Lima',
});

pool.connect()
  .then(() => console.log('Conectado a PostgreSQL'))
  .catch(err => console.error('Error conectando a PostgreSQL:', err));

module.exports = pool;