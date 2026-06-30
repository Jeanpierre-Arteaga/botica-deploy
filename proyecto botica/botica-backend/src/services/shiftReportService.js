// ============================================================
// shiftReportService — PDF del cierre de turno (descarga directa)
// ============================================================
// Reusa pdfkit (misma librería que los comprobantes). Genera un A4 vertical,
// MAQUETADO y CENTRADO: membrete con logo + datos del operador, dos KPIs
// (ventas totales y pedidos atendidos), "Ventas por método de pago" con dona
// vectorial + desglose, y "Top productos". El logo se incrusta sobre fondo
// blanco (sin recuadro/halo). Zona horaria de Lima en fecha/hora.
// ============================================================

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(__dirname, '..', '..', 'assets', 'hola.png');
const LOGO_RATIO = 512 / 1024; // alto/ancho real del PNG (no estirar)

// Paleta (hex, coherente con los tokens del panel).
const BRAND = '#F15A29';
const INK = '#1A1F2E';
const MUTED = '#6B7280';
const FAINT = '#9CA3AF';
const LINE = '#E5E7EB';
const SOFT = '#F9FAFB';
const BRAND_SOFT = '#FFF4EE';
const WHITE = '#FFFFFF';

const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  sin_pago: 'Sin pago',
};
const PAYMENT_COLORS = {
  efectivo: '#16A34A',
  yape: '#7C3AED',
  plin: '#1E4D8C',
  tarjeta: BRAND,
  transferencia: '#2563EB',
  sin_pago: FAINT,
};

const money = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

// Logo cacheado (una sola lectura por proceso). null si no existe el archivo.
let _logoBuf;
function getLogo() {
  if (_logoBuf === undefined) {
    try {
      _logoBuf = fs.existsSync(LOGO_PATH) ? fs.readFileSync(LOGO_PATH) : null;
    } catch {
      _logoBuf = null;
    }
  }
  return _logoBuf;
}

// Fecha del turno en formato largo (es-PE, zona Lima): "viernes 27 de junio de 2026".
function formatLongDate(ymd) {
  try {
    const d = new Date(`${ymd}T12:00:00-05:00`);
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(d);
  } catch {
    return ymd;
  }
}

// Fecha+hora de generación (zona Lima).
function formatNowLima() {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date());
}

// Dibuja una dona vectorial centrada en (cx, cy). slices = [{ value, color }].
function drawDonut(doc, cx, cy, rOuter, rInner, slices) {
  const total = slices.reduce((s, x) => s + x.value, 0);

  if (total <= 0) {
    // Anillo vacío (sin ventas): aro gris claro.
    doc.circle(cx, cy, rOuter).fill(LINE);
    doc.circle(cx, cy, rInner).fill(WHITE);
    return;
  }

  let a0 = -Math.PI / 2; // arranca arriba (12 en punto)
  for (const s of slices) {
    if (s.value <= 0) continue;
    const frac = s.value / total;
    // Una sola porción al 100%: círculo completo (el arco SVG sería degenerado).
    if (frac >= 0.9999) {
      doc.circle(cx, cy, rOuter).fill(s.color);
      break;
    }
    const a1 = a0 + frac * Math.PI * 2;
    const x0 = cx + rOuter * Math.cos(a0);
    const y0 = cy + rOuter * Math.sin(a0);
    const x1 = cx + rOuter * Math.cos(a1);
    const y1 = cy + rOuter * Math.sin(a1);
    const largeArc = a1 - a0 > Math.PI ? 1 : 0;
    doc
      .path(`M ${cx} ${cy} L ${x0} ${y0} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1} ${y1} Z`)
      .fill(s.color);
    a0 = a1;
  }

  // Agujero central (fondo blanco del documento) → dona.
  doc.circle(cx, cy, rInner).fill(WHITE);
}

/**
 * Construye el PDF del cierre de turno y resuelve con un Buffer.
 * @param {object} p
 *   p.operator  string  nombre del operador
 *   p.role      string  'Administrador' | 'Empleado'
 *   p.sede      string|null
 *   p.date      'YYYY-MM-DD'
 *   p.summary   { total_sales, total_transactions, by_payment_method[], top_products[] }
 */
function buildShiftReportPdf(p) {
  return new Promise((resolve, reject) => {
    try {
      const MARGIN = 48;
      const doc = new PDFDocument({ size: 'A4', margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width;
      const x = MARGIN;
      const w = pageW - MARGIN * 2;
      const cx = pageW / 2;
      const summary = p.summary || {};

      // ---------- Membrete: logo + título + datos ----------
      const logo = getLogo();
      let y = MARGIN;
      if (logo) {
        const logoW = 168;
        const logoH = logoW * LOGO_RATIO;
        doc.image(logo, cx - logoW / 2, y, { width: logoW });
        y += logoH + 8;
      }

      doc.fillColor(INK).font('Helvetica-Bold').fontSize(18)
        .text('Reporte de cierre de turno', x, y, { width: w, align: 'center' });
      y = doc.y + 5;

      // Datos del operador / sede / fechas (centrados).
      doc.font('Helvetica').fontSize(10.5).fillColor(MUTED);
      doc.text(`Operador: ${p.operator || '—'}  ·  ${p.role || ''}`.trim(), x, y, { width: w, align: 'center' });
      if (p.sede) doc.text(`Sede: ${p.sede}`, x, doc.y + 1, { width: w, align: 'center' });
      doc.text(`Turno del ${formatLongDate(p.date)}`, x, doc.y + 1, { width: w, align: 'center' });
      doc.fillColor(FAINT).fontSize(9)
        .text(`Generado: ${formatNowLima()} (hora de Lima)`, x, doc.y + 1, { width: w, align: 'center' });

      y = doc.y + 14;

      // Separador.
      doc.moveTo(x, y).lineTo(x + w, y).lineWidth(1).strokeColor(LINE).stroke();
      y += 16;

      // ---------- KPIs: dos tarjetas ----------
      const gap = 16;
      const cardW = (w - gap) / 2;
      const cardH = 72;
      drawKpiCard(doc, x, y, cardW, cardH, 'Ventas totales', money(summary.total_sales), BRAND);
      drawKpiCard(doc, x + cardW + gap, y, cardW, cardH, 'Pedidos atendidos', String(summary.total_transactions ?? 0), INK);
      y += cardH + 18;

      // ---------- Ventas por método de pago: dona + desglose ----------
      y = sectionTitle(doc, x, y, w, 'Ventas por método de pago');

      const methods = Array.isArray(summary.by_payment_method) ? summary.by_payment_method : [];
      const totalPay = methods.reduce((s, m) => s + Number(m.total || 0), 0);

      const cardPad = 16;
      // Alto del bloque: dona o lo que ocupe el desglose, lo que sea mayor.
      const legendRowH = 24;
      const legendH = Math.max(methods.length, 1) * legendRowH;
      const donutH = 140;
      const blockH = Math.max(donutH, legendH) + cardPad * 2;

      doc.roundedRect(x, y, w, blockH, 14).lineWidth(1).fillAndStroke(SOFT, LINE);

      // Dona en la mitad izquierda, desglose en la derecha.
      const leftCx = x + w * 0.26;
      const donutCy = y + blockH / 2;
      const slices = methods.map((m) => ({
        value: Number(m.total || 0),
        color: PAYMENT_COLORS[m.payment_method] || FAINT,
      }));
      drawDonut(doc, leftCx, donutCy, 64, 40, slices);

      // Total al centro de la dona.
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
        .text('Total', leftCx - 50, donutCy - 13, { width: 100, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(12).fillColor(INK)
        .text(money(totalPay), leftCx - 60, donutCy + 0, { width: 120, align: 'center' });

      // Desglose (derecha).
      const legX = x + w * 0.50;
      const legW = x + w - legX - cardPad;
      let ly = y + cardPad + (blockH - cardPad * 2 - legendH) / 2; // centrado vertical
      if (methods.length === 0) {
        doc.font('Helvetica').fontSize(10).fillColor(MUTED)
          .text('Sin ventas registradas en el turno.', legX, donutCy - 6, { width: legW });
      } else {
        for (const m of methods) {
          const label = PAYMENT_LABELS[m.payment_method] || m.payment_method;
          const color = PAYMENT_COLORS[m.payment_method] || FAINT;
          const pct = totalPay > 0 ? Math.round((Number(m.total) / totalPay) * 100) : 0;

          // Punto de color + etiqueta + %
          doc.circle(legX + 4, ly + 7, 4).fill(color);
          doc.font('Helvetica-Bold').fontSize(10).fillColor(INK)
            .text(label, legX + 16, ly, { width: legW - 16, lineBreak: false });
          doc.font('Helvetica').fontSize(9).fillColor(MUTED)
            .text(`${m.count} pedido${m.count !== 1 ? 's' : ''} · ${pct}%`, legX + 16, ly + 12, { width: legW - 16, lineBreak: false });
          // Importe a la derecha.
          doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK)
            .text(money(m.total), legX, ly + 4, { width: legW, align: 'right' });

          ly += legendRowH;
        }
      }

      y += blockH + 18;

      // ---------- Top productos ----------
      y = sectionTitle(doc, x, y, w, 'Top productos');
      const top = Array.isArray(summary.top_products) ? summary.top_products : [];

      if (top.length === 0) {
        doc.roundedRect(x, y, w, 50, 14).lineWidth(1).fillAndStroke(SOFT, LINE);
        doc.font('Helvetica').fontSize(10).fillColor(MUTED)
          .text('Sin productos vendidos en el turno.', x, y + 19, { width: w, align: 'center' });
        y += 50;
      } else {
        const rowH = 40;
        top.forEach((prod, idx) => {
          const ry = y + idx * (rowH + 8);
          doc.roundedRect(x, ry, w, rowH, 12).lineWidth(1).fillAndStroke(WHITE, LINE);

          // Rank badge.
          const badge = idx === 0 ? BRAND : BRAND_SOFT;
          const badgeTxt = idx === 0 ? WHITE : BRAND;
          doc.roundedRect(x + 12, ry + 9, 24, 24, 7).fill(badge);
          doc.font('Helvetica-Bold').fontSize(12).fillColor(badgeTxt)
            .text(String(idx + 1), x + 12, ry + 15, { width: 24, align: 'center' });

          // Nombre + unidades.
          doc.font('Helvetica-Bold').fontSize(11).fillColor(INK)
            .text(prod.product_name || `Producto #${prod.product_id}`, x + 48, ry + 9, { width: w - 48 - 120, lineBreak: false });
          doc.font('Helvetica').fontSize(9).fillColor(MUTED)
            .text(`${prod.total_sold} unidad${prod.total_sold !== 1 ? 'es' : ''} vendida${prod.total_sold !== 1 ? 's' : ''}`, x + 48, ry + 24, { width: w - 48 - 120, lineBreak: false });

          // Ingreso a la derecha.
          doc.font('Helvetica-Bold').fontSize(12).fillColor(INK)
            .text(money(prod.revenue), x + w - 120, ry + 14, { width: 108, align: 'right' });
        });
        y += top.length * (rowH + 8);
      }

      // ---------- Pie ----------
      const footY = doc.page.height - MARGIN - 14;
      doc.font('Helvetica').fontSize(8).fillColor(FAINT)
        .text('Documento interno de Boticas Central · No válido como comprobante electrónico SUNAT.', x, footY, { width: w, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Tarjeta KPI: etiqueta arriba, valor grande abajo, barra de acento a la izquierda.
function drawKpiCard(doc, x, y, w, h, label, value, accent) {
  doc.roundedRect(x, y, w, h, 14).lineWidth(1).fillAndStroke(WHITE, LINE);
  doc.roundedRect(x, y, 5, h, 2.5).fill(accent); // barra de acento
  doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED)
    .text(label.toUpperCase(), x + 18, y + 16, { width: w - 28, characterSpacing: 0.5 });
  doc.font('Helvetica-Bold').fontSize(22).fillColor(accent)
    .text(value, x + 18, y + 34, { width: w - 28 });
}

// Título de sección con barra de acento naranja. Devuelve la nueva y.
function sectionTitle(doc, x, y, w, text) {
  doc.roundedRect(x, y + 1, 4, 16, 2).fill(BRAND);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK)
    .text(text, x + 12, y, { width: w - 12 });
  return doc.y + 8;
}

module.exports = { buildShiftReportPdf };
