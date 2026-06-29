const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/sales', verifyToken, verifyRole('admin'), reportController.sales);
router.get('/export', verifyToken, verifyRole('admin'), reportController.exportExcel);

module.exports = router;
