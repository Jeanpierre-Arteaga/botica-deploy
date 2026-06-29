const ProductModel = require('../models/productModel');
const ImageModel = require('../models/imageModel');
const { uploadBuffer, deleteByUrl } = require('../config/s3');

// Normaliza el campo image_url del body: string no vacío → trim, si no null.
function cleanImageUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const productController = {

  getAll: async (req, res) => {
    try {
      const productos = await ProductModel.findAll(req.query);
      res.json(productos);
    } catch (err) {
      console.error('[products/getAll]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // GET /api/products/search?q=&limit=  (público)
  // Sugerencias para el autocompletado: top N por relevancia. Con menos de 2
  // caracteres devuelve [] para no listar todo el catálogo.
  search: async (req, res) => {
    try {
      const q = (req.query.q || '').toString().trim();
      if (q.length < 2) return res.json([]);
      let limit = parseInt(req.query.limit, 10);
      if (!Number.isFinite(limit) || limit < 1) limit = 8;
      if (limit > 20) limit = 20;
      const rows = await ProductModel.searchSuggestions(q, limit);
      res.json(rows);
    } catch (err) {
      console.error('[products/search]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'ID de producto inválido.' });
      }
      const locationRaw = req.query.location_id;
      const location_id =
        locationRaw !== undefined && locationRaw !== null && locationRaw !== ''
          ? parseInt(locationRaw, 10)
          : null;
      const producto = await ProductModel.findById(
        id,
        Number.isNaN(location_id) ? null : location_id
      );
      if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
      res.json(producto);
    } catch (err) {
      console.error('[products/getById]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  checkStock: async (req, res) => {
    try {
      const { productId, location_id } = req.query;
      if (!productId || !location_id) {
        return res.status(400).json({ message: 'Se requiere productId y location_id.' });
      }
      const stock = await ProductModel.checkStock(productId, location_id);
      if (!stock) return res.status(404).json({ message: 'No se encontró stock.' });
      res.json(stock);
    } catch (err) {
      console.error('[products/checkStock]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  create: async (req, res) => {
    try {
      const producto = await ProductModel.create(req.body);

      // Modo "pegar URL": si llega image_url en el body, la guardamos como
      // imagen principal sin pasar por S3.
      const image_url = cleanImageUrl(req.body.image_url);
      if (image_url) {
        await ImageModel.upsertMain(producto.product_id, image_url);
      }

      res.status(201).json({ ...producto, image_url: image_url || null });
    } catch (err) {
      console.error('[products/create]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  addOffer: async (req, res) => {
    try {
      const producto = await ProductModel.addOffer(req.params.id, req.body);
      if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
      res.json(producto);
    } catch (err) {
      console.error('[products/addOffer]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  update: async (req, res) => {
    try {
      const producto = await ProductModel.update(req.params.id, req.body);
      if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });

      // Modo "pegar URL" al editar.
      const image_url = cleanImageUrl(req.body.image_url);
      if (image_url) {
        await ImageModel.upsertMain(producto.product_id, image_url);
      }

      res.json({ ...producto, ...(image_url ? { image_url } : {}) });
    } catch (err) {
      console.error('[products/update]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  patch: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'ID de producto inválido.' });
      }

      const image_url = cleanImageUrl(req.body.image_url);

      // Separamos image_url del resto de campos (no es columna de product).
      const { image_url: _ignored, ...rest } = req.body;
      const hasOtherFields = Object.keys(rest).length > 0;

      let producto;
      if (hasOtherFields) {
        try {
          producto = await ProductModel.patch(id, rest);
          if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
        } catch (err) {
          // Si solo venían campos no permitidos pero sí hay image_url, seguimos.
          if (!(err && err.message === 'NO_VALID_FIELDS' && image_url)) throw err;
        }
      }

      if (image_url) {
        await ImageModel.upsertMain(id, image_url);
      }

      if (!producto) {
        producto = await ProductModel.findById(id);
        if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
      }

      res.json({ ...producto, ...(image_url ? { image_url } : {}) });
    } catch (err) {
      if (err && err.message === 'NO_VALID_FIELDS') {
        return res.status(400).json({ message: 'No hay campos válidos para actualizar.' });
      }
      console.error('[products/patch]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  delete: async (req, res) => {
    try {
      const producto = await ProductModel.delete(req.params.id);
      if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
      res.json({ message: 'Producto eliminado.', producto });
    } catch (err) {
      console.error('[products/delete]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // ============================================================
  // IMÁGENES (admin)
  // ============================================================

  /**
   * POST /api/products/:id/image  (multipart, campo "image")
   * Sube el archivo a S3, guarda la URL como imagen principal y limpia
   * la imagen anterior de S3 si era nuestra (CloudFront).
   */
  uploadImage: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'ID de producto inválido.' });
      }
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: 'No se recibió ninguna imagen.' });
      }

      // El producto debe existir.
      const producto = await ProductModel.findById(id);
      if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });

      // URL previa (para limpieza posterior).
      const previa = await ImageModel.getMainByProduct(id);
      const urlPrevia = previa ? previa.url : null;

      // Subir a S3 y registrar como principal.
      const { url } = await uploadBuffer(req.file.buffer, req.file.mimetype, 'products');
      await ImageModel.upsertMain(id, url);

      // Limpieza best-effort de la imagen anterior (solo si era nuestra).
      if (urlPrevia && urlPrevia !== url) {
        await deleteByUrl(urlPrevia);
      }

      res.json({ image_url: url });
    } catch (err) {
      console.error('[products/uploadImage]', err);
      return res.status(500).json({ message: 'Error al subir la imagen.' });
    }
  },

  /**
   * DELETE /api/products/:id/image
   * Borra la imagen principal del producto en BD y, si era nuestra, en S3.
   */
  deleteImage: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'ID de producto inválido.' });
      }

      const urls = await ImageModel.deleteByProduct(id);
      // Limpieza best-effort en S3 de las que sean nuestras.
      await Promise.all(urls.map((u) => deleteByUrl(u)));

      res.json({ message: 'Imagen eliminada.', removed: urls.length });
    } catch (err) {
      console.error('[products/deleteImage]', err);
      return res.status(500).json({ message: 'Error al eliminar la imagen.' });
    }
  },
};

module.exports = productController;
