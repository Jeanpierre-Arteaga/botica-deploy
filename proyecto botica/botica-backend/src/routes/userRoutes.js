const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyRole } = require('../middleware/auth');
const { uploadSingleImage, MAX_FILE_SIZE } = require('../middleware/upload');

// Envuelve multer y traduce sus errores a 400 claros (mismo patrón que productos).
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

router.post('/', verifyToken, verifyRole('admin'), userController.create);

router.get('/', verifyToken, verifyRole('admin'), userController.getAll);
router.get('/me', verifyToken, userController.getMe);

// Perfil propio (cualquier personal autenticado). DEBEN ir antes de '/:id'.
router.put('/me', verifyToken, userController.updateMe);
router.post('/me/photo', verifyToken, handleUpload, userController.uploadMyPhoto);
router.patch('/me/deactivate', verifyToken, userController.deactivateMe);

router.get('/:id', verifyToken, userController.getById);
router.put('/:id', verifyToken, verifyRole('admin'), userController.update);
router.patch('/:id/role', verifyToken, verifyRole('admin'), userController.updateRole);
router.patch('/:id/password', verifyToken, verifyRole('admin'), userController.updatePassword);
router.delete('/:id', verifyToken, verifyRole('admin'), userController.delete);

module.exports = router;