const LocationModel = require('../models/locationModel');

const locationController = {

  getAll: async (req, res) => {
    try {
      const locations = await LocationModel.findAll();
      res.json(locations);
    } catch (err) {
      console.error('[locations/getAll]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getById: async (req, res) => {
    try {
      const location = await LocationModel.findById(req.params.id);
      if (!location) return res.status(404).json({ message: 'Sede no encontrada.' });
      res.json(location);
    } catch (err) {
      console.error('[locations/getById]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  create: async (req, res) => {
    try {
      const location = await LocationModel.create(req.body);
      res.status(201).json(location);
    } catch (err) {
      console.error('[locations/create]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  update: async (req, res) => {
    try {
      const location = await LocationModel.update(req.params.id, req.body);
      if (!location) return res.status(404).json({ message: 'Sede no encontrada.' });
      res.json(location);
    } catch (err) {
      console.error('[locations/update]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  delete: async (req, res) => {
    try {
      const location = await LocationModel.delete(req.params.id);
      if (!location) return res.status(404).json({ message: 'Sede no encontrada.' });
      res.json({ message: 'Sede desactivada.', location });
    } catch (err) {
      console.error('[locations/delete]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = locationController;
