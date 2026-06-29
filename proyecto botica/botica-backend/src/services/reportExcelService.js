// ============================================================
// reportExcelService — Genera el .xlsx del reporte de Ventas y Rotación
// ============================================================
// Hojas: Resumen (KPIs + gráficas embebidas), Detalle de ventas, Productos
// más vendidos, Ventas por categoría. Las tablas llevan encabezado con color
// de marca, texto centrado, anchos cómodos, zebra, autofilter, panes
// congelados y formato de moneda S/. Las gráficas se construyen como SVG y se
// rasterizan a PNG con sharp (offline, sin canvas nativo ni servicios externos)
// y se embeben con worksheet.addImage.
// ============================================================

const ExcelJS = require('exceljs');
const sharp = require('sharp');

// Paleta (ARGB para ExcelJS / hex para SVG). Multicolor: el naranja de marca es
// uno de varios acentos, para un look profesional con buen contraste.
const BRAND = 'F15A29';   // naranja (marca)
const COOL = '2563EB';    // azul
const SUCCESS = '16A34A';  // verde
const VIOLET = '7C3AED';  // violeta
const WARNING = 'D97706';  // ámbar
const TEAL = '0D9488';    // teal
const PINK = 'DB2777';    // magenta
const INK = '1A1F2E';
const MUTED = '4A5260';
const FAINT = '9CA3AF';
const LINE = 'E2E8F0';
const ZEBRA = 'F7F8FA';
const SOFT = 'FFF4EE';

// Paleta cíclica para series/barras multicolor.
const PALETTE = [BRAND, COOL, SUCCESS, VIOLET, WARNING, TEAL, PINK, '0EA5E9'];

const argb = (hex) => 'FF' + hex;
const PEN = '"S/ "#,##0.00';

const thin = { style: 'thin', color: { argb: argb(LINE) } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

// ---------- helpers de texto / formato ----------
const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const truncate = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const fmtNum = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtMoney = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = (n) => { n = Number(n || 0); return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(Math.round(n)); };

// Lista de fechas 'YYYY-MM-DD' entre from y to (inclusive). Tope de 92 días.
function enumerateDates(from, to) {
  const out = [];
  const d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || Number.isNaN(end.getTime()) || d > end) return out;
  while (d <= end && out.length < 92) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// ============================================================
// Gráficas SVG
// ============================================================

function svgHorizontalBars({ title, items, color = BRAND, colors = null, unit = 'S/' }) {
  const W = 780;
  const padTop = 48, padLeft = 16, padRight = 24, padBottom = 14;
  const rowH = 30, barH = 18, labelW = 240;
  const n = Math.max(1, items.length);
  const H = padTop + n * rowH + padBottom;
  const max = Math.max(1, ...items.map((i) => i.value));
  const barX = padLeft + labelW + 8;
  const barW = W - barX - padRight - 96;
  let body = '';
  items.forEach((it, i) => {
    const y = padTop + i * rowH;
    const bw = Math.max(2, (it.value / max) * barW);
    const fill = colors ? colors[i % colors.length] : color;
    body += `<text x="${padLeft + labelW}" y="${y + barH / 2 + 4}" text-anchor="end" font-size="12" fill="#${MUTED}" font-family="Arial">${esc(truncate(it.label, 36))}</text>`;
    body += `<rect x="${barX}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="#${LINE}" fill-opacity="0.45"/>`;
    body += `<rect x="${barX}" y="${y}" width="${bw}" height="${barH}" rx="4" fill="#${fill}"/>`;
    body += `<text x="${barX + bw + 6}" y="${y + barH / 2 + 4}" font-size="11.5" font-weight="bold" fill="#${INK}" font-family="Arial">${unit} ${fmtMoney(it.value)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/><text x="${padLeft}" y="28" font-size="15" font-weight="bold" fill="#${INK}" font-family="Arial">${esc(title)}</text>${body}</svg>`;
}

function svgVerticalBars({ title, items, color = BRAND, unit = 'S/' }) {
  const W = 780, H = 300;
  const padTop = 48, padLeft = 54, padRight = 16, padBottom = 44;
  const n = Math.max(1, items.length);
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;
  const max = Math.max(1, ...items.map((i) => i.value));
  const slot = plotW / n;
  const bw = Math.min(48, slot * 0.62);
  let grid = '';
  for (let g = 0; g <= 4; g++) {
    const gy = padTop + plotH - (g / 4) * plotH;
    grid += `<line x1="${padLeft}" y1="${gy}" x2="${W - padRight}" y2="${gy}" stroke="#${LINE}" stroke-width="1"/>`;
    grid += `<text x="${padLeft - 6}" y="${gy + 4}" text-anchor="end" font-size="10" fill="#${FAINT}" font-family="Arial">${unit}${fmtK((max * g) / 4)}</text>`;
  }
  let bars = '';
  items.forEach((it, i) => {
    const x = padLeft + i * slot + (slot - bw) / 2;
    const bh = Math.max(1, (it.value / max) * plotH);
    const y = padTop + plotH - bh;
    bars += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="4" fill="#${color}"/>`;
    bars += `<text x="${x + bw / 2}" y="${H - padBottom + 16}" text-anchor="middle" font-size="10.5" fill="#${MUTED}" font-family="Arial">${esc(truncate(it.label, 10))}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/><text x="${padLeft - 38}" y="28" font-size="15" font-weight="bold" fill="#${INK}" font-family="Arial">${esc(title)}</text>${grid}${bars}</svg>`;
}

// Líneas multi-serie (evolución por categoría a lo largo del período).
// dates: ['06-20', ...] etiquetas de eje X. series: [{ name, color, values:[] }].
function svgMultiLine({ title, dates, series, unit = 'S/' }) {
  const W = 780, H = 340;
  const padTop = 70, padLeft = 56, padRight = 18, padBottom = 40;
  const n = Math.max(1, dates.length);
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const xAt = (i) => (n === 1 ? padLeft + plotW / 2 : padLeft + (i / (n - 1)) * plotW);
  const yAt = (v) => padTop + plotH - (v / max) * plotH;

  // Grid + etiquetas Y
  let grid = '';
  for (let g = 0; g <= 4; g++) {
    const gy = padTop + plotH - (g / 4) * plotH;
    grid += `<line x1="${padLeft}" y1="${gy}" x2="${W - padRight}" y2="${gy}" stroke="#${LINE}" stroke-width="1"/>`;
    grid += `<text x="${padLeft - 6}" y="${gy + 4}" text-anchor="end" font-size="10" fill="#${FAINT}" font-family="Arial">${unit}${fmtK((max * g) / 4)}</text>`;
  }
  // Etiquetas X (máximo ~10 para no saturar)
  const step = Math.max(1, Math.ceil(n / 10));
  let xlabels = '';
  dates.forEach((d, i) => {
    if (i % step !== 0 && i !== n - 1) return;
    xlabels += `<text x="${xAt(i)}" y="${H - padBottom + 16}" text-anchor="middle" font-size="10" fill="#${MUTED}" font-family="Arial">${esc(d)}</text>`;
  });
  // Líneas + puntos
  let lines = '';
  series.forEach((s) => {
    const pts = s.values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
    if (n === 1) {
      lines += `<circle cx="${xAt(0)}" cy="${yAt(s.values[0] || 0)}" r="4" fill="#${s.color}"/>`;
    } else {
      lines += `<polyline points="${pts}" fill="none" stroke="#${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
  });
  // Leyenda (chips arriba)
  let legend = '';
  let lx = padLeft;
  const ly = 50;
  series.forEach((s) => {
    const label = truncate(s.name, 22);
    legend += `<rect x="${lx}" y="${ly - 8}" width="14" height="4" rx="2" fill="#${s.color}"/>`;
    legend += `<text x="${lx + 19}" y="${ly}" font-size="11" fill="#${MUTED}" font-family="Arial">${esc(label)}</text>`;
    lx += 19 + label.length * 6.2 + 22;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/><text x="${padLeft - 38}" y="28" font-size="15" font-weight="bold" fill="#${INK}" font-family="Arial">${esc(title)}</text>${legend}${grid}${xlabels}${lines}</svg>`;
}

const toPng = (svg) => sharp(Buffer.from(svg)).png().toBuffer();

// ============================================================
// Helpers de tabla con estilo
// ============================================================

// Ancho auto-ajustado por contenido (evita texto cortado o columnas enormes).
function autoWidths(headers, rows, money) {
  return headers.map((h, ci) => {
    let maxLen = String(h == null ? '' : h).length;
    rows.forEach((r) => {
      const v = r[ci];
      const s = money.includes(ci) ? 'S/ ' + fmtMoney(v) : String(v == null ? '' : v);
      if (s.length > maxLen) maxLen = s.length;
    });
    return Math.min(48, Math.max(10, maxLen + 3)); // +3: aire para el filtro
  });
}

function styledTable(ws, {
  titleRow, title, startRow, headers, rows, widths, money = [], align = {},
  headerColor = BRAND, titleColor = INK, freeze = true, filter = true,
  applyWidths = true, autoFit = true,
}) {
  if (titleRow != null) {
    ws.mergeCells(titleRow, 1, titleRow, headers.length);
    const c = ws.getCell(titleRow, 1);
    c.value = title;
    c.font = { bold: true, size: 14, color: { argb: argb(titleColor) }, name: 'Arial' };
    c.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(titleRow).height = 22;
  }
  // Encabezados
  const hr = ws.getRow(startRow);
  headers.forEach((h, i) => {
    const cell = hr.getCell(i + 1);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(headerColor) } };
    cell.font = { bold: true, size: 11, color: { argb: argb('FFFFFF') }, name: 'Arial' };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = border;
  });
  hr.height = 24;
  // Filas
  rows.forEach((r, ri) => {
    const row = ws.getRow(startRow + 1 + ri);
    r.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      const isMoney = money.includes(ci);
      cell.alignment = { horizontal: align[ci] || (isMoney ? 'right' : 'center'), vertical: 'middle' };
      if (isMoney) cell.numFmt = PEN;
      cell.font = { size: 11, color: { argb: argb(INK) }, name: 'Arial' };
      cell.border = border;
      if (ri % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(ZEBRA) } };
    });
    row.height = 19;
  });
  if (applyWidths) {
    const finalWidths = autoFit ? autoWidths(headers, rows, money) : (widths || []);
    finalWidths.forEach((w, i) => { if (w) ws.getColumn(i + 1).width = w; });
  }
  // Autofilter + panes congelados en el encabezado (solo donde aplica)
  if (filter) ws.autoFilter = { from: { row: startRow, column: 1 }, to: { row: startRow, column: headers.length } };
  if (freeze) ws.views = [{ state: 'frozen', ySplit: startRow, showGridLines: false }];
}

function kpiBox(ws, row, col, label, value, numFmt, accent = BRAND) {
  ws.mergeCells(row, col, row, col + 1);
  const lc = ws.getCell(row, col);
  lc.value = label;
  lc.font = { bold: true, size: 9, color: { argb: argb('FFFFFF') }, name: 'Arial' };
  lc.alignment = { horizontal: 'center', vertical: 'middle' };
  lc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(accent) } };
  lc.border = border;

  ws.mergeCells(row + 1, col, row + 1, col + 1);
  const vc = ws.getCell(row + 1, col);
  vc.value = value;
  if (numFmt) vc.numFmt = numFmt;
  vc.font = { bold: true, size: 16, color: { argb: argb(accent) }, name: 'Arial' };
  vc.alignment = { horizontal: 'center', vertical: 'middle' };
  vc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb('FFFFFF') } };
  vc.border = border;
  ws.getRow(row + 1).height = 28;
}

const PAY_LABEL = { efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin', tarjeta: 'Tarjeta', transferencia: 'Transferencia', sin_pago: 'Sin pago' };

// ============================================================
// Construcción del libro
// ============================================================

async function buildSalesReportWorkbook({ report, orders, sedeName, date_from, date_to }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Botica Central';
  wb.created = new Date();

  const days = Math.max(1, report.byDay.length);
  const avgDaily = report.totalSales / days;

  // ---------------- Hoja: Resumen ----------------
  const ws = wb.addWorksheet('Resumen', { views: [{ showGridLines: false }] });
  for (let c = 1; c <= 8; c++) ws.getColumn(c).width = 14;

  ws.mergeCells('A1:H1');
  const t = ws.getCell('A1');
  t.value = 'Reporte de Ventas y Rotación';
  t.font = { bold: true, size: 18, color: { argb: argb('FFFFFF') }, name: 'Arial' };
  t.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND) } };
  ws.getRow(1).height = 34;

  ws.mergeCells('A2:H2');
  const sub = ws.getCell('A2');
  sub.value = `Sede: ${sedeName}   ·   Período: ${date_from} a ${date_to}   ·   Generado: ${new Date().toLocaleString('es-PE')}`;
  sub.font = { size: 10, color: { argb: argb(MUTED) }, name: 'Arial' };
  sub.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws.getRow(2).height = 18;

  // KPIs (fila 4 = etiquetas, fila 5 = valores) — un acento por tarjeta
  kpiBox(ws, 4, 1, 'VENTAS TOTALES', report.totalSales, PEN, BRAND);
  kpiBox(ws, 4, 3, 'PROMEDIO DIARIO', avgDaily, PEN, COOL);
  kpiBox(ws, 4, 5, 'PRODUCTOS VENDIDOS', report.totalUnits, null, SUCCESS);
  kpiBox(ws, 4, 7, 'TICKET PROMEDIO', report.averageTicket, PEN, WARNING);

  // Gráficas embebidas. Anclaje oneCell (la imagen se mueve con la celda y NO
  // bloquea el desplazamiento). La hoja Resumen NO se congela (scroll libre).
  let anchor = 7;
  const addChart = async (svg, heightPx) => {
    const png = await toPng(svg);
    const id = wb.addImage({ buffer: png, extension: 'png' });
    ws.addImage(id, { tl: { col: 0, row: anchor }, ext: { width: 780, height: heightPx }, editAs: 'oneCell' });
    anchor += Math.ceil(heightPx / 15) + 2;
  };

  const topByRevenue = [...report.topProducts].sort((a, b) => b.total - a.total).slice(0, 12);
  if (topByRevenue.length) {
    const h = 48 + topByRevenue.length * 30 + 14;
    await addChart(svgHorizontalBars({ title: 'Top productos por ingresos (S/)', items: topByRevenue.map((p) => ({ label: p.product_name, value: p.total })), color: BRAND }), h);
  }
  if (report.byCategory.length) {
    const cats = report.byCategory.slice(0, 8);
    const h = 48 + cats.length * 30 + 14;
    await addChart(svgHorizontalBars({ title: 'Ventas por categoría (S/)', items: cats.map((c) => ({ label: c.category_name, value: c.total })), colors: PALETTE }), h);
  }
  // Evolución POR CATEGORÍA (multi-serie): top 5 categorías a lo largo de los
  // días del período (misma gráfica que la web "Evolución por categoría").
  const evoDates = enumerateDates(date_from, date_to);
  if (evoDates.length && report.byCategory.length) {
    const topCats = [...report.byCategory].sort((a, b) => b.total - a.total).slice(0, 5);
    const byDate = {};
    (report.byDayCategory || []).forEach((r) => {
      (byDate[r.date] = byDate[r.date] || {})[r.category_name] = (byDate[r.date][r.category_name] || 0) + r.total;
    });
    const series = topCats.map((c, i) => ({
      name: c.category_name,
      color: PALETTE[i % PALETTE.length],
      values: evoDates.map((d) => (byDate[d] && byDate[d][c.category_name]) || 0),
    }));
    const labels = evoDates.map((d) => d.slice(5));
    await addChart(svgMultiLine({ title: 'Evolución por categoría (S/)', dates: labels, series }), 340);
  }

  // Mini-tabla: ventas por método de pago. SIN congelar ni autofilter y SIN
  // tocar los anchos (mantiene la cuadrícula uniforme de la hoja Resumen).
  const payStart = anchor + 1;
  styledTable(ws, {
    titleRow: payStart, title: 'Ventas por método de pago', startRow: payStart + 1,
    headers: ['Método', 'Pedidos', 'Total', '% del total'],
    rows: report.byPaymentMethod.map((p) => [PAY_LABEL[p.payment_method] || p.payment_method, p.count, p.total, `${p.percentage}%`]),
    money: [2], headerColor: TEAL, titleColor: TEAL,
    freeze: false, filter: false, applyWidths: false,
  });

  // ---------------- Hoja: Detalle de ventas ----------------
  const wsD = wb.addWorksheet('Detalle de ventas', { views: [{ showGridLines: false }] });
  styledTable(wsD, {
    titleRow: 1, title: `Detalle de ventas — ${sedeName}`, startRow: 3,
    headers: ['Pedido', 'Fecha', 'Sede', 'Cliente', 'Ítems', 'Método', 'Estado', 'Total'],
    rows: orders.map((o) => [`#${o.order_id}`, o.order_date, o.location_name, o.customer_name, o.items, PAY_LABEL[o.payment_method] || o.payment_method, o.order_state, o.total_price]),
    money: [7], align: { 3: 'left' }, headerColor: COOL, titleColor: COOL,
  });

  // ---------------- Hoja: Productos más vendidos ----------------
  const wsP = wb.addWorksheet('Productos más vendidos', { views: [{ showGridLines: false }] });
  styledTable(wsP, {
    titleRow: 1, title: 'Productos más vendidos (ranking)', startRow: 3,
    headers: ['#', 'Producto', 'Categoría', 'Unidades', 'Ingresos'],
    rows: report.topProducts.map((p, i) => [i + 1, p.product_name, p.category_name, p.quantity_sold, p.total]),
    money: [4], align: { 1: 'left' }, headerColor: VIOLET, titleColor: VIOLET,
  });

  // ---------------- Hoja: Ventas por categoría ----------------
  const wsC = wb.addWorksheet('Ventas por categoría', { views: [{ showGridLines: false }] });
  styledTable(wsC, {
    titleRow: 1, title: 'Ventas por categoría', startRow: 3,
    headers: ['Categoría', 'Pedidos', 'Ingresos', '% del total'],
    rows: report.byCategory.map((c) => [c.category_name, c.count, c.total, report.totalSales > 0 ? `${Math.round((c.total / report.totalSales) * 100)}%` : '0%']),
    money: [2], align: { 0: 'left' }, headerColor: SUCCESS, titleColor: SUCCESS,
  });

  return await wb.xlsx.writeBuffer();
}

module.exports = { buildSalesReportWorkbook };
