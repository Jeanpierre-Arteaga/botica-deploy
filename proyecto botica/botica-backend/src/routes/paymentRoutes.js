const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, verifyRole('admin', 'emp'), paymentController.getAll);
router.get('/order/:order_id', verifyToken, paymentController.getByOrder);
router.get('/:id', verifyToken, verifyRole('admin', 'emp'), paymentController.getById);
router.post('/', verifyToken, paymentController.create);
router.put('/:id', verifyToken, verifyRole('admin'), paymentController.update);
router.patch('/:id', verifyToken, verifyRole('admin'), paymentController.update);
router.delete('/:id', verifyToken, verifyRole('admin'), paymentController.delete);

module.exports = router;