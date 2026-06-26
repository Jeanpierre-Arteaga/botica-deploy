// ============================================================
// BOTICA CENTRAL — Rutas de recetas médicas
// ============================================================
const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { uploadPrescriptionImage, PRESCRIPTION_MAX_FILE_SIZE } = require('../middleware/upload');

// ------------------------------------------------------------
// Rate-limit básico en memoria por IP. Protege la cuota (limitada/de pago)
// de la API de visión frente a abuso. No requiere infraestructura externa.
// ------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutos
const RATE_LIMIT_MAX = 15; // máx. análisis por IP en la ventana
const hits = new Map(); // ip -> timestamps[]

function rateLimit(req, res, next) {
  const ip =
    req.ip || req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    return res
      .status(429)
      .json({ message: 'Demasiados análisis seguidos. Espera un momento e inténtalo de nuevo.' });
  }
  recent.push(now);
  hits.set(ip, recent);
  next();
}

// Traduce errores de multer a respuestas 400 claras (igual que en productos).
function handleUpload(req, res, next) {
  uploadPrescriptionImage(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      const mb = Math.round(PRESCRIPTION_MAX_FILE_SIZE / (1024 * 1024));
      return res.status(400).json({ message: `La imagen supera el límite de ${mb} MB.` });
    }
    if (err.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: 'No se pudo procesar la imagen.' });
  });
}

// Público (lo usa el cliente, no requiere login). Campo del form-data: "image".
router.post('/scan', rateLimit, handleUpload, prescriptionController.scan);

module.exports = router;
