const express = require('express');
const router = express.Router();
const laboratoryController = require('../controllers/laboratoryController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', laboratoryController.getAll);
router.get('/:id', laboratoryController.getById);
router.post('/', verifyToken, verifyRole('admin'), laboratoryController.create);
router.put('/:id', verifyToken, verifyRole('admin'), laboratoryController.update);
router.patch('/:id', verifyToken, verifyRole('admin'), laboratoryController.update);

module.exports = router;