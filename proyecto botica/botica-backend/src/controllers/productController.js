const ProductModel = require('../models/productModel');

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
      res.status(201).json(producto);
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
      res.json(producto);
    } catch (err) {
      console.error('[products/update]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  patch: async (req, res) => {
    try {
      const producto = await ProductModel.patch(req.params.id, req.body);
      if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
      res.json(producto);
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
  }
};

module.exports = productController;