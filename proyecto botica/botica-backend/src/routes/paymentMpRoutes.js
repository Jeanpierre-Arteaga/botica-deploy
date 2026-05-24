// ============================================================
// Rutas MercadoPago — separadas del CRUD de payment-methods para
// no duplicar URLs. Se montan en /api/payments.
// ============================================================

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// POST /api/payments/process — utilidad de prueba (cargo independiente)
router.post(
  '/process',
  verifyToken,
  verifyRole('cust'),
  paymentController.processCardCharge
);

// GET /api/payments/mp/:id — consultar estado en MercadoPago
router.get(
  '/mp/:id',
  verifyToken,
  verifyRole('admin', 'emp', 'cust'),
  paymentController.mpStatus
);

module.exports = router;
