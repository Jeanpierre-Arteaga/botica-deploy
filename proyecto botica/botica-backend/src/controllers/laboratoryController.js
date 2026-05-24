const LaboratoryModel = require('../models/laboratoryModel');

const laboratoryController = {

  getAll: async (req, res) => {
    try {
      const labs = await LaboratoryModel.findAll();
      res.json(labs);
    } catch (err) {
      console.error('[laboratories/getAll]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getById: async (req, res) => {
    try {
      const lab = await LaboratoryModel.findById(req.params.id);
      if (!lab) return res.status(404).json({ message: 'Laboratorio no encontrado.' });
      res.json(lab);
    } catch (err) {
      console.error('[laboratories/getById]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  create: async (req, res) => {
    try {
      const lab = await LaboratoryModel.create(req.body);
      res.status(201).json(lab);
    } catch (err) {
      console.error('[laboratories/create]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  update: async (req, res) => {
    try {
      const lab = await LaboratoryModel.update(req.params.id, req.body);
      if (!lab) return res.status(404).json({ message: 'Laboratorio no encontrado.' });
      res.json(lab);
    } catch (err) {
      console.error('[laboratories/update]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = laboratoryController;
