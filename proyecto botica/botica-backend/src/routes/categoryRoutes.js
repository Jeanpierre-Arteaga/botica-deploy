const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', verifyToken, verifyRole('admin'), categoryController.create);
router.put('/:id', verifyToken, verifyRole('admin'), categoryController.update);
router.patch('/:id', verifyToken, verifyRole('admin'), categoryController.update);
router.delete('/:id', verifyToken, verifyRole('admin'), categoryController.delete);

module.exports = router;