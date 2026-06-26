// ============================================================
// BOTICA CENTRAL — Controlador de recetas médicas
// ============================================================
// POST /api/prescriptions/scan
// Recibe una foto de receta (multipart, campo "image"), la lee con la IA y
// devuelve los productos del catálogo que coinciden + los no encontrados.
//
// La IA solo PROPONE: el cliente confirma en el frontend antes de añadir
// nada al carrito. La imagen se procesa en memoria y NO se persiste.
// ============================================================

const { readPrescription, matchProductsToCatalog } = require('../services/prescriptionService');

const prescriptionController = {
  scan: async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: 'No se recibió ninguna imagen de la receta.' });
      }

      // 1) Leer la receta con la IA (en memoria; la imagen NO se persiste).
      const { items, notes } = await readPrescription(req.file.buffer, req.file.mimetype);

      // Sin medicamentos detectados → respuesta vacía coherente.
      if (!items.length) {
        return res.json({ matched: [], unmatched: [], notes: notes || '' });
      }

      // 2) Emparejar con el catálogo.
      const { matched, unmatched } = await matchProductsToCatalog(items);

      return res.json({ matched, unmatched, notes: notes || '' });
    } catch (err) {
      if (err && err.code === 'GEMINI_NOT_CONFIGURED') {
        // 503 SOLO cuando falta GEMINI_API_KEY en el entorno del proceso.
        console.error('[prescriptions/scan] 503 GEMINI_NOT_CONFIGURED — falta GEMINI_API_KEY en este proceso.');
        return res
          .status(503)
          .json({ message: 'La lectura de recetas no está disponible en este momento.' });
      }
      if (err && (err.code === 'GEMINI_PARSE_FAILED' || err.code === 'GEMINI_REQUEST_FAILED')) {
        // 502 = error real de Gemini (red/auth/cuota/modelo) o JSON ilegible.
        console.error('[prescriptions/scan] 502', err.code, '-', err.message);
        return res
          .status(502)
          .json({ message: 'No se pudo leer la receta. Intenta con una foto más clara.' });
      }
      console.error('[prescriptions/scan] 500 inesperado:', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    } finally {
      // Privacidad: descartamos explícitamente el buffer de la imagen.
      if (req.file) req.file.buffer = null;
    }
  },
};

module.exports = prescriptionController;
