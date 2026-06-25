// ============================================================
// BOTICA CENTRAL — Middleware de subida de imágenes (multer)
// ============================================================
// Guarda el archivo en memoria (memoryStorage) para luego subir el
// buffer a S3. No escribe a disco. Solo acepta imágenes JPEG/PNG/WEBP
// hasta 5 MB.
// ============================================================

const multer = require('multer');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Formato no permitido. Solo JPG, PNG o WEBP.');
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// Campo esperado en el form-data: "image"
const uploadSingleImage = upload.single('image');

module.exports = { uploadSingleImage, MAX_FILE_SIZE };
