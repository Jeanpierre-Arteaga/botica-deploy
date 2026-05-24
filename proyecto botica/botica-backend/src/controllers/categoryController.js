const CategoryModel = require('../models/categoryModel');

const categoryController = {

  getAll: async (req, res) => {
    try {
      let featured = null;
      if (req.query.featured === 'true') featured = true;
      else if (req.query.featured === 'false') featured = false;

      const categories = await CategoryModel.findAll({ featured });
      res.json(categories);
    } catch (err) {
      console.error('[categories/getAll]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getById: async (req, res) => {
    try {
      const category = await CategoryModel.findById(req.params.id);
      if (!category) return res.status(404).json({ message: 'Categoría no encontrada.' });
      res.json(category);
    } catch (err) {
      console.error('[categories/getById]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  create: async (req, res) => {
    try {
      const category = await CategoryModel.create(req.body);
      res.status(201).json(category);
    } catch (err) {
      console.error('[categories/create]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  update: async (req, res) => {
    try {
      const category = await CategoryModel.update(req.params.id, req.body);
      if (!category) return res.status(404).json({ message: 'Categoría no encontrada.' });
      res.json(category);
    } catch (err) {
      console.error('[categories/update]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  delete: async (req, res) => {
    try {
      const category = await CategoryModel.delete(req.params.id);
      if (!category) return res.status(404).json({ message: 'Categoría no encontrada.' });
      res.json({ message: 'Categoría eliminada.', category });
    } catch (err) {
      console.error('[categories/delete]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = categoryController;
