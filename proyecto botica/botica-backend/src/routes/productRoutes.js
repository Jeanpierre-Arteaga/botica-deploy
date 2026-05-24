const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', productController.getAll);
router.get('/stock', productController.checkStock);
router.get('/:id', productController.getById);
router.post('/', verifyToken, verifyRole('admin'), productController.create);
router.post('/offers/:id', verifyToken, verifyRole('admin'), productController.addOffer);
router.put('/:id', verifyToken, verifyRole('admin'), productController.update);
router.patch('/:id', verifyToken, verifyRole('admin'), productController.patch);
router.delete('/:id', verifyToken, verifyRole('admin'), productController.delete);

module.exports = router;