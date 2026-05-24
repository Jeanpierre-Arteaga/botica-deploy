const InventoryModel = require('../models/inventoryModel');

const inventoryController = {

  getAll: async (req, res) => {
    try {
      const items = await InventoryModel.findAll(req.query);
      res.json(items);
    } catch (err) {
      console.error('[inventory/getAll]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getById: async (req, res) => {
    try {
      const item = await InventoryModel.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Registro no encontrado.' });
      res.json(item);
    } catch (err) {
      console.error('[inventory/getById]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getLowStock: async (req, res) => {
    try {
      const items = await InventoryModel.findLowStock();
      res.json(items);
    } catch (err) {
      console.error('[inventory/getLowStock]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  create: async (req, res) => {
    try {
      const item = await InventoryModel.create(req.body);
      res.status(201).json(item);
    } catch (err) {
      console.error('[inventory/create]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  update: async (req, res) => {
    try {
      const item = await InventoryModel.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ message: 'Registro no encontrado.' });
      res.json(item);
    } catch (err) {
      console.error('[inventory/update]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  transfer: async (req, res) => {
    try {
      const result = await InventoryModel.transfer(req.body);
      res.json(result);
    } catch (err) {
      console.error('[inventory/transfer]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = inventoryController;
