/**
 * ============================================================
 * BOTICA CENTRAL — Carga masiva de imágenes a S3 + BD  (v2)
 * ============================================================
 * Parser CSV robusto: detecta delimitador (',' o ';'), respeta comillas
 * (URLs con comas), quita BOM de Excel. Key con hash de contenido.
 * Filas con source vacío -> se omiten (conservan placeholder del seed).
 *
 * UBICACIÓN:  botica-backend/scripts/upload_images.js
 *             botica-backend/scripts/images.csv
 * USAR (desde botica-backend):  node scripts/upload_images.js
 * ============================================================
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const pool = require('../src/config/db');

let sharp = null;
try { sharp = require('sharp'); } catch { /* opcional */ }

const REGION   = process.env.AWS_REGION;
const BUCKET   = process.env.S3_BUCKET;
const CDN      = process.env.CLOUDFRONT_DOMAIN;
const csvArg = process.argv.indexOf('--csv');
const CSV_PATH = (csvArg !== -1 && process.argv[csvArg + 1])
  ? path.resolve(__dirname, process.argv[csvArg + 1])
  : path.join(__dirname, 'images.csv');

for (const [k, v] of Object.entries({ AWS_REGION: REGION, S3_BUCKET: BUCKET, CLOUDFRONT_DOMAIN: CDN })) {
  if (!v) { console.error(`Falta ${k} en el .env del backend.`); process.exit(1); }
}

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ---- Parser CSV robusto (comillas + delimitador + BOM) ----
function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const delim = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
  const records = [];
  let field = '', row = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delim) { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); records.push(row); row = []; field = ''; }
      else if (c === '\r') { /* ignora */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); records.push(row); }
  records.shift();
  return records
    .filter(r => r.length && (r[0] || '').trim() !== '')
    .map(r => ({ name: (r[0] || '').trim(), category: (r[1] || '').trim(), source: (r[2] || '').trim() }));
}

async function getBuffer(source) {
  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} al descargar`);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const looksImgUrl = /\.(jpe?g|png|webp|gif|bmp|avif)(\?|$)/i.test(source);
    const okType = ct.startsWith('image/') || ct.includes('octet-stream') || ct === '' || looksImgUrl;
    if (!okType) throw new Error(`la URL no devolvió una imagen (content-type: ${ct || 'desconocido'})`);
    const buf = Buffer.from(await res.arrayBuffer());
    // Respaldo: confirmar firma de imagen real (magic bytes) para no guardar HTML/errores
    const isImg = buf.length > 12 && (
      (buf[0]===0xFF && buf[1]===0xD8) ||                                  // JPEG
      (buf[0]===0x89 && buf[1]===0x50 && buf[2]===0x4E && buf[3]===0x47) || // PNG
      (buf[0]===0x47 && buf[1]===0x49 && buf[2]===0x46) ||                  // GIF
      (buf.slice(0,4).toString()==='RIFF' && buf.slice(8,12).toString()==='WEBP') || // WEBP
      (buf[0]===0x42 && buf[1]===0x4D)                                      // BMP
    );
    if (!isImg) throw new Error(`el contenido descargado no parece una imagen real (¿página de error?)`);
    return buf;
  }
  const local = path.isAbsolute(source) ? source : path.join(__dirname, source);
  if (!fs.existsSync(local)) throw new Error(`no existe el archivo local: ${local}`);
  return fs.readFileSync(local);
}

async function normalize(buffer) {
  if (!sharp) return { body: buffer, contentType: 'image/jpeg', ext: 'jpg' };
  const out = await sharp(buffer)
    .resize(600, 600, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .webp({ quality: 82 })
    .toBuffer();
  return { body: out, contentType: 'image/webp', ext: 'webp' };
}

async function uploadToS3(key, body, contentType) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
  return `https://${CDN}/${key}`;
}

async function upsertMain(productId, url) {
  await pool.query(
    `INSERT INTO image (url, type, product_id)
     VALUES ($1, 'main', $2)
     ON CONFLICT (product_id) WHERE type = 'main'
     DO UPDATE SET url = EXCLUDED.url`,
    [url, productId]
  );
}

async function findProductIdByName(name) {
  const r = await pool.query(`SELECT product_id FROM product WHERE product_name = $1 LIMIT 1`, [name]);
  return r.rows[0] ? r.rows[0].product_id : null;
}

(async () => {
  if (!fs.existsSync(CSV_PATH)) { console.error(`No se encontró ${CSV_PATH}`); process.exit(1); }
  const onlyArg = process.argv.indexOf('--only');
  const onlyName = onlyArg !== -1 ? process.argv[onlyArg + 1] : null;

  const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf-8'));
  let ok = 0, skip = 0, fail = 0;
  const errors = [];

  console.log(`\nProcesando ${rows.length} filas del CSV...`);
  if (!sharp) console.log('(sharp no instalado: las imágenes se suben sin redimensionar)');

  for (const row of rows) {
    if (onlyName && row.name !== onlyName) continue;
    if (!row.source) { skip++; continue; }
    try {
      const productId = await findProductIdByName(row.name);
      if (!productId) throw new Error('producto no encontrado en BD (¿corriste el seed?)');
      const raw = await getBuffer(row.source);
      const { body, contentType, ext } = await normalize(raw);
      const hash = crypto.createHash('sha256').update(body).digest('hex').slice(0, 8);
      const key = `products/${productId}-${hash}.${ext}`;
      const url = await uploadToS3(key, body, contentType);
      await upsertMain(productId, url);
      ok++;
      console.log(`  OK [${productId}] ${row.name}  ->  ${url}`);
    } catch (e) {
      fail++;
      errors.push({ name: row.name, error: e.message });
      console.log(`  XX ${row.name}  ->  ${e.message}`);
    }
  }

  console.log('\n-------- RESUMEN --------');
  console.log(`  Subidas OK:          ${ok}`);
  console.log(`  Omitidas (sin URL):  ${skip}`);
  console.log(`  Fallidas:            ${fail}`);
  if (errors.length) {
    console.log('\n  Detalle de fallos (revisa estas fuentes):');
    errors.forEach(e => console.log(`   - ${e.name}: ${e.error}`));
  }
  await pool.end();
  process.exit(0);
})();