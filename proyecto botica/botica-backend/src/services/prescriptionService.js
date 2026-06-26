// ============================================================
// BOTICA CENTRAL — Servicio de lectura de recetas médicas
// ============================================================
// Flujo desacoplado del proveedor de visión:
//   1) readPrescription(buffer, mimetype) → pide a la IA el JSON estructurado
//      de medicamentos detectados.
//   2) matchProductsToCatalog(items)      → empareja cada medicamento con el
//      catálogo (tabla product) por principio activo / nombre.
//
// PRINCIPIO RECTOR (seguridad clínica): la IA solo PROPONE. La confirmación
// humana ocurre en el frontend antes de añadir nada al carrito.
//
// PRIVACIDAD: la imagen se procesa en memoria; este servicio nunca la guarda
// en disco, BD ni S3.
//
// CAMBIO DE PROVEEDOR: toda la dependencia de Google Gemini vive en este
// archivo (sección "INTEGRACIÓN CON LA IA"). Cambiar a otro proveedor de
// visión solo debe tocar readPrescription/parsePrescriptionJson.
// ============================================================

const { GoogleGenAI } = require('@google/genai');
const ProductModel = require('../models/productModel');

// Modelo de visión con salida JSON. Constante fácil de cambiar.
// NOTA: el nombre del modelo puede actualizarse. Si "gemini-2.5-flash"
// dejara de estar disponible, reemplázalo por el modelo "flash" vigente
// equivalente de la familia Gemini (o ajusta GEMINI_MODEL en el .env).
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// ============================================================
// INTEGRACIÓN CON LA IA (Google Gemini)
// ============================================================

const PROMPT = `Eres un asistente de farmacia. Te entrego la foto de una receta médica.
Extrae ÚNICAMENTE los medicamentos indicados en la receta.

Reglas:
- No inventes medicamentos, dosis ni cantidades que no estén en la imagen.
- Si un dato es ilegible o dudoso, igual inclúyelo pero marca "confidence": "baja".
- "name": el texto del medicamento tal como aparece escrito en la receta.
- "active_ingredient": el principio activo (DCI) si lo reconoces; si no, repite el nombre.
- "strength": la dosis o concentración (ej. "500mg", "10mg/ml"); null si no aparece.
- "quantity": cantidad de cajas/unidades como número entero; null si no se indica.
- "confidence": "alta" | "media" | "baja" según qué tan legible y seguro estés.

Responde EXCLUSIVAMENTE un JSON válido con esta forma exacta, sin texto adicional,
sin explicaciones y sin markdown:
{"items":[{"name":"","active_ingredient":"","strength":"","quantity":null,"confidence":"alta"}],"notes":""}

En "notes" anota brevemente si la receta está parcialmente ilegible u otras observaciones.`;

/**
 * Lee una receta médica desde el buffer de imagen usando la IA de visión.
 * @param {Buffer} imageBuffer  Bytes de la imagen (en memoria).
 * @param {string} mimetype     'image/jpeg' | 'image/png' | 'image/webp'.
 * @returns {Promise<{items: Array, notes: string}>}
 */
async function readPrescription(imageBuffer, mimetype) {
  // Leemos la key EN TIEMPO DE EJECUCIÓN (no a nivel de módulo) para no depender
  // del orden de carga de dotenv. La única razón válida para 503 es que la key
  // esté ausente/vacía; cualquier otro fallo es un error real de la API (502).
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    const err = new Error('El servicio de lectura de recetas no está configurado (falta GEMINI_API_KEY).');
    err.code = 'GEMINI_NOT_CONFIGURED';
    throw err;
  }

  let rawText;
  try {
    // El constructor va DENTRO del try: si construir el cliente o llamar a la API
    // falla, se mapea a un error real de Gemini (502), no a "no configurado" (503)
    // ni a un 500 opaco.
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: mimetype, data: imageBuffer.toString('base64') } },
          ],
        },
      ],
      // Pedimos salida JSON directa cuando el modelo lo soporta.
      config: { responseMimeType: 'application/json' },
    });
    // SDK nuevo (@google/genai): el texto se obtiene de result.text (getter),
    // no de result.response.text() como en el SDK viejo.
    rawText = result.text;
  } catch (err) {
    // Log con código y stack para poder diagnosticar errores reales de Gemini
    // (auth, cuota, modelo inexistente, red) sin confundirlos con "no configurado".
    console.error('[prescription] Error llamando a la IA:', {
      name: err && err.name,
      code: err && err.code,
      status: err && (err.status || err.statusText),
      message: err && err.message,
    });
    const e = new Error('No se pudo analizar la receta con la IA.');
    e.code = 'GEMINI_REQUEST_FAILED';
    throw e;
  }

  return parsePrescriptionJson(rawText);
}

/**
 * Parsea de forma segura el JSON devuelto por la IA: quita posibles fences
 * de markdown, recorta texto alrededor del objeto y sanea cada item.
 */
function parsePrescriptionJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw buildParseError();
  }

  // Quita fences ```json ... ``` si el modelo los añadió pese a las instrucciones.
  let cleaned = rawText
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  // Si hay texto alrededor, recorta al primer "{" y último "}".
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('[prescription] JSON inválido de la IA:', String(rawText).slice(0, 500));
    throw buildParseError();
  }

  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  const notes = typeof parsed.notes === 'string' ? parsed.notes : '';

  const items = rawItems
    .map((it) => ({
      name: typeof (it && it.name) === 'string' ? it.name.trim() : '',
      active_ingredient:
        typeof (it && it.active_ingredient) === 'string' ? it.active_ingredient.trim() : '',
      strength: it && it.strength != null ? String(it.strength).trim() : null,
      quantity:
        it && Number.isFinite(Number(it.quantity)) && Number(it.quantity) > 0
          ? Math.trunc(Number(it.quantity))
          : null,
      confidence: ['alta', 'media', 'baja'].includes(it && it.confidence) ? it.confidence : 'media',
    }))
    .filter((it) => it.name || it.active_ingredient);

  return { items, notes };
}

function buildParseError() {
  const e = new Error('La IA devolvió una respuesta que no se pudo interpretar.');
  e.code = 'GEMINI_PARSE_FAILED';
  return e;
}

// ============================================================
// EMPAREJADO CON EL CATÁLOGO (independiente del proveedor de IA)
// ============================================================

const STOP_WORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'con', 'por', 'para', 'y', 'en', 'a',
  'mg', 'mcg', 'ml', 'gr', 'g', 'ui', 'und', 'uds', 'unidad', 'unidades',
  'caja', 'cajas', 'blister', 'tab', 'tabs', 'comp', 'cap', 'caps', 'x',
]);

/** minúsculas, sin tildes, sin signos, espacios colapsados. */
function normalize(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita marcas diacríticas (tildes)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str) {
  return normalize(str)
    .split(' ')
    .filter((t) => t && !STOP_WORDS.has(t) && (t.length >= 3 || /^\d+$/.test(t)));
}

/** Primer número entero contenido en el texto (ej. "500mg" → 500). */
function extractNumber(str) {
  if (!str) return null;
  const m = String(str).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

/**
 * Puntúa qué tan bien un producto del catálogo corresponde a un medicamento
 * detectado. 0 = sin relación. Cuanto mayor, mejor match.
 */
function scoreProduct(item, product) {
  const itemAI = normalize(item.active_ingredient);
  const itemName = normalize(item.name);
  const prodAI = normalize(product.active_ingredient);
  const prodName = normalize(product.product_name);
  const prodText = `${prodName} ${prodAI}`.trim();
  if (!prodText) return 0;

  // Tokens del medicamento detectado: prioriza el principio activo.
  const primary = itemAI || itemName;
  const tokens = tokenize(primary);
  if (tokens.length === 0) return 0;

  let matchedTokens = 0;
  for (const t of tokens) {
    if (prodText.includes(t)) matchedTokens++;
  }
  if (matchedTokens === 0) return 0;

  // Fracción de tokens del medicamento presentes en el producto (0..1).
  let score = matchedTokens / tokens.length;

  // Boost fuerte si el principio activo coincide directamente.
  if (prodAI && itemAI && (prodAI.includes(itemAI) || itemAI.includes(prodAI))) {
    score += 1;
  }

  // Desempate por dosis: ayuda a elegir la presentación correcta
  // (ej. Paracetamol 500 vs 1g) cuando la receta indica la concentración.
  const strengthNum = extractNumber(item.strength) || extractNumber(item.name);
  if (strengthNum && prodText.includes(String(strengthNum))) {
    score += 0.5;
  }

  return score;
}

// Umbral mínimo para considerar que un medicamento está en el catálogo.
// 0.5 = al menos la mitad de los tokens del principio activo coinciden, o hay
// coincidencia directa de principio activo (que suma +1).
const MATCH_THRESHOLD = 0.5;

/**
 * Empareja la lista de medicamentos detectados con el catálogo activo.
 * Reutiliza ProductModel.findAll (solo productos activos, ya con image_url).
 * @returns {Promise<{matched: Array, unmatched: Array}>}
 */
async function matchProductsToCatalog(items) {
  const productos = await ProductModel.findAll({}); // solo activos + image_url
  const matched = [];
  const unmatched = [];
  const usedProductIds = new Set();

  for (const item of items) {
    let best = null;
    let bestScore = 0;
    for (const p of productos) {
      const s = scoreProduct(item, p);
      if (s > bestScore) {
        bestScore = s;
        best = p;
      }
    }

    if (best && bestScore >= MATCH_THRESHOLD) {
      // Evita duplicar el mismo producto si dos líneas mapean a él.
      if (usedProductIds.has(best.product_id)) continue;
      usedProductIds.add(best.product_id);
      matched.push({
        product_id: best.product_id,
        product_name: best.product_name,
        active_ingredient: best.active_ingredient,
        product_price: best.product_price,
        old_price: best.old_price,
        is_offer: best.is_offer,
        image_url: best.image_url,
        quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
        detected_name: item.name || item.active_ingredient,
        strength: item.strength || null,
        confidence: item.confidence || 'media',
      });
    } else {
      unmatched.push({
        detected_name: item.name || item.active_ingredient,
        active_ingredient: item.active_ingredient || null,
        reason: 'no está en catálogo',
      });
    }
  }

  return { matched, unmatched };
}

module.exports = {
  readPrescription,
  matchProductsToCatalog,
  GEMINI_MODEL,
  // Exportados para pruebas unitarias futuras:
  _internal: { normalize, tokenize, scoreProduct, parsePrescriptionJson },
};
