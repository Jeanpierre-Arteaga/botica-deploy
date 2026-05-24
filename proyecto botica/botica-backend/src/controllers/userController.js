const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
require('dotenv').config();

const userController = {

  create: async (req, res) => {
    try {
      const { user_code, user_password, full_name, role, location_id } = req.body;

      if (!role || !['admin', 'emp'].includes(role)) {
        return res.status(400).json({
          message: "El campo 'role' es obligatorio y debe ser 'admin' o 'emp'."
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user_password, salt);

      const usuario = await UserModel.create({
        user_code,
        user_password: hashedPassword,
        full_name,
        role,
        location_id
      });
      res.status(201).json(usuario);
    } catch (err) {
      console.error('[users/create]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getAll: async (req, res) => {
    try {
      const usuarios = await UserModel.findAll();
      res.json(usuarios);
    } catch (err) {
      console.error('[users/getAll]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getMe: async (req, res) => {
    try {
      // Customers tienen otro endpoint (/api/customers/me); su JWT no trae user_id.
      if (req.user.role === 'cust') {
        return res.status(403).json({
          message: 'Este endpoint es solo para personal. Usa /api/customers/me.'
        });
      }
      const usuario = await UserModel.findById(req.user.user_id);
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });
      res.json(usuario);
    } catch (err) {
      console.error('[users/getMe]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getById: async (req, res) => {
    try {
      const usuario = await UserModel.findById(req.params.id);
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });
      res.json(usuario);
    } catch (err) {
      console.error('[users/getById]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  update: async (req, res) => {
    try {
      const usuario = await UserModel.update(req.params.id, req.body);
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });
      res.json(usuario);
    } catch (err) {
      console.error('[users/update]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  updateRole: async (req, res) => {
    try {
      const { role } = req.body;
      if (!['admin', 'emp'].includes(role)) {
        return res.status(400).json({
          message: "El campo 'role' debe ser 'admin' o 'emp'."
        });
      }
      const usuario = await UserModel.updateRole(req.params.id, role);
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });
      res.json(usuario);
    } catch (err) {
      console.error('[users/updateRole]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  delete: async (req, res) => {
    try {
      const usuario = await UserModel.softDelete(req.params.id);
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });
      res.json({ message: 'Usuario desactivado.', usuario });
    } catch (err) {
      console.error('[users/delete]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = userController;
