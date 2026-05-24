const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.post('/', verifyToken, verifyRole('admin'), userController.create);

router.get('/', verifyToken, verifyRole('admin'), userController.getAll);
router.get('/me', verifyToken, userController.getMe);
router.get('/:id', verifyToken, userController.getById);
router.put('/:id', verifyToken, verifyRole('admin'), userController.update);
router.patch('/:id/role', verifyToken, verifyRole('admin'), userController.updateRole);
router.delete('/:id', verifyToken, verifyRole('admin'), userController.delete);

module.exports = router;