const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/summary', verifyToken, verifyRole('admin', 'emp'), dashboardController.summary);

module.exports = router;
