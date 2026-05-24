const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', locationController.getAll);
router.get('/:id', locationController.getById);
router.post('/', verifyToken, verifyRole('admin'), locationController.create);
router.put('/:id', verifyToken, verifyRole('admin'), locationController.update);
router.patch('/:id', verifyToken, verifyRole('admin'), locationController.update);
router.delete('/:id', verifyToken, verifyRole('admin'), locationController.delete);

module.exports = router;