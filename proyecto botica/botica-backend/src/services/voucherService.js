// ============================================================
// voucherService — Comprobante interno en PDF (boleta/factura/ticket)
// ============================================================
// IMPORTANTE (legal): este PDF NO es un comprobante electrónico oficial
// de SUNAT. Es un comprobante INTERNO / representación impresa para el
// cliente y registro del pedido. Incluye una leyenda explícita para no
// inducir a error. No simula numeración fiscal, firma ni QR de SUNAT.
//
// FORMATO: ticket de farmacia real (rollo térmico ~80mm), en BLANCO Y
// NEGRO, tipografía monoespaciada (Courier) y separadores punteados. El
// alto de página se calcula a la medida del contenido (angosto y largo)
// con una pasada de medición, para que el visor embebido no muestre
// franjas en blanco. El logo se incrusta en ESCALA DE GRISES (sharp)
// para combinar con el ticket monocromo.
// ============================================================

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const LOGO_PATH = path.join(__dirname, '..', '..', 'assets', 'logo-botica.png');
const LOGO_RATIO = 506 / 1024; // alto/ancho real del PNG, para no estirarlo

const COMPANY = 'BOTICAS CENTRAL MOREL S.A.C.';
const RUC = '20614687259';

const VOUCHER_TITLES = {
  boleta: 'BOLETA DE VENTA',
  factura: 'FACTURA',
  ticket: 'TICKET DE VENTA',
};

// Geometría del ticket (1mm = 2.834645pt). Ancho FIJO de 80mm (estándar de
// caja registradora). El ancho NUNCA cambia: para acomodar muchos productos el
// ticket SOLO crece en alto.
const MM = 2.834645;
const PAGE_W = Math.round(80 * MM); // ≈ 227pt (80mm exactos)
// Márgenes internos generosos para que el contenido "respire" (aire a izquierda
// y derecha, y más blanco alrededor). MARGIN sirve de margen superior y lateral.
const MARGIN = 16;
// Alto mínimo del ticket: garantiza un TAMAÑO BASE UNIFORME. Boletas con 1 ó 2
// productos comparten esta altura (no se ven comprimidas ni de tamaños
// distintos); solo cuando el contenido la supera, el ticket se ALARGA.
const MIN_PAGE_H = 470;
const INK = '#000000';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const money = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function truncate(str, max) {
  const s = String(str || '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// Logo en escala de grises, cacheado (una sola conversión por proceso). Si
// sharp falla, cae al PNG original; si no existe el archivo, devuelve null.
let _grayLogoPromise = null;
function getGrayLogo() {
  if (!fs.existsSync(LOGO_PATH)) return Promise.resolve(null);
  if (!_grayLogoPromise) {
    _grayLogoPromise = sharp(LOGO_PATH)
      .grayscale()
      .png()
      .toBuffer()
      .catch((err) => {
        console.error('[voucher] no se pudo convertir el logo a gris, uso original', err);
        try { return fs.readFileSync(LOGO_PATH); } catch { return null; }
      });
  }
  return _grayLogoPromise;
}

// ---------- Primitivas de dibujo (todas en negro) ----------

function dashed(doc, geom, padTop = 5, padBottom = 6) {
  const { x, right } = geom;
  doc.y += padTop;
  const y = doc.y;
  doc.dash(2, { space: 1.8 })
    .moveTo(x, y).lineTo(right, y)
    .lineWidth(0.6).strokeColor(INK).stroke()
    .undash();
  doc.y = y + padBottom;
}

function centered(doc, str, { font = 'Courier', size = 8, gap = 1 } = {}, geom) {
  doc.font(font).fontSize(size).fillColor(INK)
    .text(str, geom.x, doc.y, { width: geom.w, align: 'center' });
  if (gap) doc.y += gap;
}

// Fila a dos columnas: etiqueta/descr. a la izquierda, importe a la derecha,
// ambos en la MISMA línea base (alineación de ticket).
function row(doc, leftStr, rightStr, geom, { font = 'Courier', size = 8, gap = 2 } = {}) {
  const { x, w } = geom;
  const y = doc.y;
  doc.font(font).fontSize(size).fillColor(INK);
  doc.text(String(leftStr), x, y, { width: w, lineBreak: false });
  doc.text(String(rightStr), x, y, { width: w, align: 'right' });
  doc.y = y + size + gap;
}

// Dibuja TODO el ticket avanzando doc.y. Es determinista (no depende del alto
// de página) para poder ejecutarse igual en la pasada de medición y en la real.
function renderTicket(doc, data, geom, logoBuf) {
  const { x, w, right } = geom;
  doc.y = MARGIN;

  // ---------- Encabezado: logo (gris) + empresa + sede ----------
  if (logoBuf) {
    const logoW = Math.min(116, w);
    const logoH = logoW * LOGO_RATIO;
    doc.image(logoBuf, x + (w - logoW) / 2, doc.y, { width: logoW });
    doc.y += logoH + 9;
  }

  centered(doc, COMPANY, { font: 'Courier-Bold', size: 9.5, gap: 2 }, geom);
  centered(doc, `RUC ${RUC}`, { size: 7.5, gap: 2 }, geom);

  const loc = data.location || {};
  const sede = [loc.location_name, loc.location_address, loc.district]
    .filter(Boolean).join(' · ');
  if (sede) centered(doc, sede, { size: 7.5, gap: 1 }, geom);
  if (loc.location_phone) centered(doc, `Tel. ${loc.location_phone}`, { size: 7.5, gap: 0 }, geom);

  dashed(doc, geom);

  // ---------- Tipo de documento + N° pedido + fecha ----------
  const voucherType = data.payment?.voucher_type || 'boleta';
  const title = VOUCHER_TITLES[voucherType] || 'COMPROBANTE INTERNO';
  centered(doc, title, { font: 'Courier-Bold', size: 11, gap: 3 }, geom);

  const correlativo = String(data.order.order_id).padStart(6, '0');
  const fecha = new Date(data.order.order_date).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  centered(doc, `Pedido N° ${correlativo}`, { font: 'Courier-Bold', size: 8, gap: 1 }, geom);
  centered(doc, `Fecha: ${fecha}`, { size: 7.5, gap: 0 }, geom);

  dashed(doc, geom);

  // ---------- Cliente ----------
  doc.font('Courier').fontSize(7.5).fillColor(INK);
  doc.text(`Cliente: ${data.customer?.full_name || '—'}`, x, doc.y, { width: w });
  doc.text(`DNI: ${data.customer?.dni || '—'}`, x, doc.y, { width: w });
  const deliveryLabel =
    data.order.delivery_type === 'delivery' ? 'Delivery'
    : data.order.delivery_type === 'pickup' ? 'Recojo en sede'
    : null;
  if (deliveryLabel) doc.text(`Entrega: ${deliveryLabel}`, x, doc.y, { width: w });

  dashed(doc, geom);

  // ---------- Ítems ----------
  // Cabecera de columnas (descripción a la izquierda, importe a la derecha).
  row(doc, 'DESCRIPCIÓN', 'IMPORTE', geom, { font: 'Courier-Bold', size: 7.5, gap: 3 });

  const items = Array.isArray(data.items) ? data.items : [];
  for (const it of items) {
    // Línea 1: nombre del producto (puede ajustarse a varias líneas).
    doc.font('Courier-Bold').fontSize(8).fillColor(INK);
    doc.text(truncate(it.product_name || `Producto #${it.product_id}`, 60), x, doc.y, { width: w });
    doc.y += 1;
    // Línea 2: cant x P.unit (izq) ··· importe (der).
    row(
      doc,
      `${it.amount} x ${money(it.unit_price)}`,
      money(it.sub_total_price),
      geom,
      { size: 8, gap: 4 }
    );
  }

  dashed(doc, geom);

  // ---------- Totales (el TOTAL ya incluye IGV) ----------
  const total = round2(data.order.total_price);
  const base = round2(total / 1.18);
  const igv = round2(total - base);

  row(doc, 'Op. Gravada', money(base), geom, { size: 8, gap: 2 });
  row(doc, 'IGV (18%)', money(igv), geom, { size: 8, gap: 3 });
  row(doc, 'TOTAL', money(total), geom, { font: 'Courier-Bold', size: 11, gap: 2 });

  dashed(doc, geom);

  // ---------- Pago + comprobante ----------
  doc.font('Courier').fontSize(7.5).fillColor(INK);
  const metodo = data.payment?.payment_method || '—';
  doc.text(`Forma de pago: ${cap(metodo)}`, x, doc.y, { width: w });
  doc.text(`Comprobante: ${cap(voucherType)}`, x, doc.y, { width: w });

  dashed(doc, geom);

  // ---------- Pie: leyenda interna + agradecimiento ----------
  centered(doc, 'Documento interno - no válido como', { size: 7, gap: 0 }, geom);
  centered(doc, 'comprobante electrónico SUNAT.', { size: 7, gap: 5 }, geom);
  centered(doc, '¡Gracias por su compra!', { font: 'Courier-Bold', size: 9, gap: 0 }, geom);

  return doc.y;
}

/**
 * Construye el PDF del comprobante (ticket térmico B/N) y resuelve con un Buffer.
 * @param {object} data
 *   data.order    { order_id, order_date, total_price, delivery_type }
 *   data.customer { full_name, dni }
 *   data.location { location_name, location_address, district, location_phone }
 *   data.items    [{ product_name, amount, unit_price, sub_total_price }]
 *   data.payment  { payment_method, voucher_type }
 */
function buildVoucherPdf(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const logoBuf = await getGrayLogo();
      const geom = { x: MARGIN, w: PAGE_W - MARGIN * 2, right: PAGE_W - MARGIN };

      // --- Pasada 1: medir el alto real del contenido (página muy alta para
      // que nada se corte; no se emite ningún byte de este documento). ---
      const measureDoc = new PDFDocument({
        size: [PAGE_W, 5000],
        margins: { top: MARGIN, bottom: 0, left: 0, right: 0 },
      });
      const contentBottom = renderTicket(measureDoc, data, geom, logoBuf);
      // Alto final = el mayor entre el alto BASE uniforme y el alto real del
      // contenido más un margen inferior. Así los tickets cortos comparten
      // tamaño y los largos crecen solo lo necesario (nunca se ensanchan).
      const pageH = Math.max(MIN_PAGE_H, Math.ceil(contentBottom) + MARGIN + 4);

      // --- Pasada 2: documento real a la medida exacta del ticket. ---
      const doc = new PDFDocument({
        size: [PAGE_W, pageH],
        margins: { top: MARGIN, bottom: 0, left: 0, right: 0 },
      });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      renderTicket(doc, data, geom, logoBuf);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { buildVoucherPdf };
