const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/sales', verifyToken, verifyRole('admin'), reportController.sales);

module.exports = router;
