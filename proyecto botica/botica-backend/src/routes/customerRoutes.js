const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, verifyRole('admin', 'emp'), customerController.getAll);
router.get('/me', verifyToken, verifyRole('cust'), customerController.getMe);
// Público: verificación en vivo de email/DNI en el registro (solo booleanos).
// Debe declararse antes de '/:id' para no ser capturado como un id.
router.get('/check', customerController.checkExists);
router.get('/dni/:dni', verifyToken, customerController.getByDni);
router.get('/:id', verifyToken, customerController.getById);
router.post('/', customerController.create);
router.put('/:id', verifyToken, customerController.update);
router.delete('/:id', verifyToken, verifyRole('admin'), customerController.delete);

module.exports = router;