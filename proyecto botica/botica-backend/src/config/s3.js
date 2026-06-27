// ============================================================
// BOTICA CENTRAL — Servicio de almacenamiento en AWS S3 + CloudFront
// ============================================================
// El bucket es PRIVADO; CloudFront lo expone vía OAC. Por eso las
// imágenes se sirven SIEMPRE por el dominio CloudFront, nunca por
// la URL directa de S3.
//
//   URL pública = https://${CLOUDFRONT_DOMAIN}/${key}
//   ej. https://d2gt6w64qg7rtz.cloudfront.net/products/uuid.jpg
//
// Las credenciales viven solo en el .env del backend (nunca en el
// frontend ni en commits).
// ============================================================

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

// Cliente S3 reutilizable. Si faltan credenciales el SDK las buscará
// en la cadena por defecto, pero aquí las tomamos explícitas del .env.
const s3 = new S3Client({
  region: REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

// Extensión de archivo a partir del mimetype admitido.
const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/** URL pública (CloudFront) de un key del bucket. */
function publicUrl(key) {
  return `https://${CLOUDFRONT_DOMAIN}/${key}`;
}

/**
 * Sube un buffer a S3 y devuelve { key, url }.
 * @param {Buffer} buffer    contenido binario de la imagen
 * @param {string} mimetype  ej. 'image/png'
 * @param {string} keyPrefix carpeta lógica dentro del bucket (default 'products')
 */
async function uploadBuffer(buffer, mimetype, keyPrefix = 'products') {
  const ext = EXT_BY_MIME[mimetype] || 'bin';
  const key = `${keyPrefix}/${uuidv4()}.${ext}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      })
    );
    return { key, url: publicUrl(key) };
  } catch (err) {
    console.error('[s3] uploadBuffer', err);
    throw err;
  }
}

/**
 * Borra de S3 el objeto referenciado por una URL de NUESTRO CloudFront.
 * Si la URL no pertenece a nuestro dominio (URL externa pegada por el
 * admin, placeholder viejo, etc.) no hace nada: no es nuestro objeto.
 * @param {string|null|undefined} url
 */
async function deleteByUrl(url) {
  if (!url || typeof url !== 'string') return;

  const prefix = `https://${CLOUDFRONT_DOMAIN}/`;
  if (!url.startsWith(prefix)) return; // no es nuestro → no tocar

  const key = url.slice(prefix.length);
  if (!key) return;

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
  } catch (err) {
    // Limpieza best-effort: registramos pero no propagamos.
    console.error('[s3] deleteByUrl', err);
  }
}

module.exports = { s3, uploadBuffer, deleteByUrl, publicUrl };
