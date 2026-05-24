const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, verifyRole('admin', 'emp'), inventoryController.getAll);
router.get('/low-stock', verifyToken, verifyRole('admin', 'emp'), inventoryController.getLowStock);
router.get('/:id', verifyToken, verifyRole('admin', 'emp'), inventoryController.getById);
router.post('/', verifyToken, verifyRole('admin'), inventoryController.create);
router.put('/:id', verifyToken, verifyRole('admin'), inventoryController.update);
router.post('/transfer', verifyToken, verifyRole('admin'), inventoryController.transfer);

module.exports = router;