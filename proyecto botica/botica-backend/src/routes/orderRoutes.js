const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, verifyRole('admin', 'emp'), orderController.getAll);
router.get('/my-orders', verifyToken, orderController.getMyOrders);
router.get('/stats', verifyToken, verifyRole('admin', 'emp'), orderController.getStats);
router.get('/shift-summary', verifyToken, verifyRole('admin', 'emp'), orderController.getShiftSummary);
router.get('/:id', verifyToken, orderController.getById);
router.post('/', verifyToken, verifyRole('cust'), orderController.create);
router.post('/walk-in', verifyToken, verifyRole('emp', 'admin'), orderController.createWalkIn);
router.patch('/:id/status', verifyToken, orderController.updateStatus);
router.patch('/:id/cancel', verifyToken, verifyRole('cust'), orderController.cancel);
router.post('/:id/cancel-with-refund', verifyToken, verifyRole('emp', 'admin'), orderController.cancelWithRefund);

module.exports = router;
