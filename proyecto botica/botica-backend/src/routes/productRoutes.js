const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyRole } = require('../middleware/auth');
const { uploadSingleImage, MAX_FILE_SIZE } = require('../middleware/upload');

// Envuelve multer para traducir sus errores a respuestas 400 claras
// (archivo muy grande, tipo no permitido, etc.) sin tumbar el servidor.
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

// Lectura pública (catálogo). /search y /stock van ANTES de /:id para que la
// ruta paramétrica no los capture.
router.get('/', productController.getAll);
router.get('/search', productController.search);
router.get('/stock', productController.checkStock);
router.get('/:id', productController.getById);

// Escritura (admin)
router.post('/', verifyToken, verifyRole('admin'), productController.create);
router.post('/offers/:id', verifyToken, verifyRole('admin'), productController.addOffer);
router.put('/:id', verifyToken, verifyRole('admin'), productController.update);
router.patch('/:id', verifyToken, verifyRole('admin'), productController.patch);
router.delete('/:id', verifyToken, verifyRole('admin'), productController.delete);

// Imágenes de producto (admin)
router.post(
  '/:id/image',
  verifyToken,
  verifyRole('admin'),
  handleUpload,
  productController.uploadImage
);
router.delete(
  '/:id/image',
  verifyToken,
  verifyRole('admin'),
  productController.deleteImage
);

module.exports = router;
