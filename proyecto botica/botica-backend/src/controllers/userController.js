const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { uploadBuffer, deleteByUrl } = require('../config/s3');
require('dotenv').config();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userController = {

  create: async (req, res) => {
    try {
      const { user_code, user_password, full_name, role, location_id } = req.body;

      if (!user_code || !String(user_code).trim()) {
        return res.status(400).json({ message: 'El usuario (acceso) es obligatorio.' });
      }
      if (!full_name || !String(full_name).trim()) {
        return res.status(400).json({ message: 'El nombre completo es obligatorio.' });
      }
      if (!user_password || String(user_password).length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
      }
      if (!role || !['admin', 'emp'].includes(role)) {
        return res.status(400).json({
          message: "El campo 'role' es obligatorio y debe ser 'admin' o 'emp'."
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user_password, salt);

      const usuario = await UserModel.create({
        user_code: String(user_code).trim(),
        user_password: hashedPassword,
        full_name: String(full_name).trim(),
        role,
        location_id: location_id ?? null
      });
      res.status(201).json(usuario);
    } catch (err) {
      // Violación de UNIQUE(user_code) → 409 claro.
      if (err && err.code === '23505') {
        return res.status(409).json({ message: 'Ya existe un usuario con ese acceso (email/código).' });
      }
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
      if (err && err.code === '23505') {
        return res.status(409).json({ message: 'Ya existe un usuario con ese acceso (email/código).' });
      }
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

  // PATCH /api/users/:id/password — restablece la contraseña (admin). El string
  // llega en claro y se guarda HASHEADO con bcrypt.
  updatePassword: async (req, res) => {
    try {
      const { user_password } = req.body;
      if (!user_password || String(user_password).length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(String(user_password), salt);
      const usuario = await UserModel.updatePassword(req.params.id, hashed);
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });
      res.json({ message: 'Contraseña actualizada.' });
    } catch (err) {
      console.error('[users/updatePassword]', err);
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
  },

  // ============================================================
  // PERFIL PROPIO (staff/admin) — el usuario edita SUS datos
  // ============================================================

  // PUT /api/users/me — actualiza nombre, acceso (user_code), foto y, opcional,
  // la contraseña (hasheada con bcrypt). Solo personal (cust usa otro flujo).
  updateMe: async (req, res) => {
    try {
      if (req.user.role === 'cust') {
        return res.status(403).json({ message: 'Este endpoint es solo para personal.' });
      }
      const id = req.user.user_id;
      const { full_name, user_code, user_password, photo_url } = req.body;

      const data = {};
      if (full_name != null) {
        if (!String(full_name).trim()) {
          return res.status(400).json({ message: 'El nombre completo es obligatorio.' });
        }
        data.full_name = String(full_name).trim();
      }
      if (user_code != null) {
        const code = String(user_code).trim();
        if (!code) return res.status(400).json({ message: 'El email/acceso es obligatorio.' });
        // Validamos formato email solo si cambió respecto al actual (códigos
        // heredados tipo ADMIN01 se conservan tal cual).
        const actual = await UserModel.findById(id);
        if (code !== (actual && actual.user_code) && !EMAIL_RE.test(code)) {
          return res.status(400).json({ message: 'Ingresa un email válido (ej. nombre@boticas.pe).' });
        }
        data.user_code = code;
      }
      if (photo_url !== undefined) data.photo_url = photo_url || null;

      if (Object.keys(data).length > 0) {
        await UserModel.update(id, data);
      }

      // Cambio de contraseña (opcional).
      if (user_password) {
        if (String(user_password).length < 8) {
          return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(String(user_password), salt);
        await UserModel.updatePassword(id, hashed);
      }

      const usuario = await UserModel.findById(id);
      return res.json(usuario);
    } catch (err) {
      if (err && err.code === '23505') {
        return res.status(409).json({ message: 'Ya existe un usuario con ese acceso (email/código).' });
      }
      console.error('[users/updateMe]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // POST /api/users/me/photo — sube la foto de perfil a S3/CloudFront (prefijo
  // 'avatars'), la guarda en photo_url y limpia la anterior si era nuestra.
  uploadMyPhoto: async (req, res) => {
    try {
      if (req.user.role === 'cust') {
        return res.status(403).json({ message: 'Este endpoint es solo para personal.' });
      }
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: 'No se recibió ninguna imagen.' });
      }
      const id = req.user.user_id;
      const previa = await UserModel.getPhotoUrl(id);

      const { url } = await uploadBuffer(req.file.buffer, req.file.mimetype, 'avatars');
      await UserModel.update(id, { photo_url: url });

      if (previa && previa !== url) await deleteByUrl(previa);

      return res.json({ photo_url: url });
    } catch (err) {
      console.error('[users/uploadMyPhoto]', err);
      return res.status(500).json({ message: 'Error al subir la imagen.' });
    }
  },

  // PATCH /api/users/me/deactivate — el usuario desactiva SU PROPIA cuenta
  // (is_active=false). El frontend cierra la sesión a continuación.
  deactivateMe: async (req, res) => {
    try {
      if (req.user.role === 'cust') {
        return res.status(403).json({ message: 'Este endpoint es solo para personal.' });
      }
      const usuario = await UserModel.softDelete(req.user.user_id);
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });
      return res.json({ message: 'Cuenta desactivada.', usuario });
    } catch (err) {
      console.error('[users/deactivateMe]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = userController;
