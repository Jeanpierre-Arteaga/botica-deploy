const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, verifyRole } = require('../middleware/auth');
const { uploadSingleImage, MAX_FILE_SIZE } = require('../middleware/upload');

// Envuelve multer y traduce sus errores a 400 claros (mismo patrón que users).
function handleUpload(req, res, next) {
  uploadSingleImage(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      const mb = Math.round(MAX_FILE_SIZE / (1024 * 1024));
      return res.status(400).json({ message: `La imagen supera el límite de ${mb} MB.` });
    }
    if (err.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: 'No se pudo procesar la imagen.' });
  });
}

router.get('/', verifyToken, verifyRole('admin', 'emp'), customerController.getAll);
router.get('/me', verifyToken, verifyRole('cust'), customerController.getMe);

// Perfil propio del cliente (solo 'cust'). DEBEN ir antes de '/:id'.
router.put('/me', verifyToken, verifyRole('cust'), customerController.updateMe);
router.post('/me/photo', verifyToken, verifyRole('cust'), handleUpload, customerController.uploadMyPhoto);
router.patch('/me/deactivate', verifyToken, verifyRole('cust'), customerController.deactivateMe);

// Público: verificación en vivo de email/DNI en el registro (solo booleanos).
// Debe declararse antes de '/:id' para no ser capturado como un id.
router.get('/check', customerController.checkExists);
router.get('/dni/:dni', verifyToken, customerController.getByDni);
router.get('/:id', verifyToken, customerController.getById);
router.post('/', customerController.create);
router.put('/:id', verifyToken, customerController.update);
router.delete('/:id', verifyToken, verifyRole('admin'), customerController.delete);

module.exports = router;