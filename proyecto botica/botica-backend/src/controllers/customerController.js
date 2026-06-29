const bcrypt = require('bcryptjs');
const CustomerModel = require('../models/customerModel');
const { uploadBuffer, deleteByUrl } = require('../config/s3');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Quita la contraseña y expone `has_password` (booleano) para que el front
// sepa si la cuenta tiene contraseña (login con email) o no (registro con
// Google) y muestre "Cambiar" vs "Crear contraseña".
const sanitize = (customer) => {
  if (!customer) return customer;
  const { customer_password, ...rest } = customer;
  return { ...rest, has_password: !!customer_password };
};

const customerController = {

  getAll: async (req, res) => {
    try {
      const customers = await CustomerModel.findAll();
      res.json(customers.map(sanitize));
    } catch (err) {
      console.error('[customers/getAll]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // GET /api/customers/me — perfil del customer autenticado
  getMe: async (req, res) => {
    try {
      if (req.user.role !== 'cust') {
        return res.status(403).json({
          message: 'Solo clientes. Staff usa /api/users/me.'
        });
      }
      const customer = await CustomerModel.findById(req.user.customer_id);
      if (!customer) {
        return res.status(404).json({ message: 'Cliente no encontrado.' });
      }
      return res.json(sanitize(customer));
    } catch (err) {
      console.error('[customers/me]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getById: async (req, res) => {
    try {
      const customer = await CustomerModel.findById(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Cliente no encontrado.' });
      res.json(sanitize(customer));
    } catch (err) {
      console.error('[customers/getById]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // GET /api/customers/check?email=&dni= — verificación ligera para el
  // formulario de registro. Público (no expone datos sensibles): SOLO devuelve
  // booleanos para validar en vivo si un email/DNI ya está en uso.
  //   { email_taken, dni_taken, dni_has_account }
  // dni_has_account distingue el DNI con cuenta web (debe iniciar sesión) del
  // DNI creado por el staff sin cuenta (registrarse lo enlazará, es válido).
  checkExists: async (req, res) => {
    try {
      const email = (req.query.email || '').toString().trim();
      const dni = (req.query.dni || '').toString().trim();

      const result = {};

      if (email) {
        const byEmail = await CustomerModel.findByEmailIncludingInactive(email);
        result.email_taken = !!byEmail;
      }
      if (dni && /^\d{8}$/.test(dni)) {
        const byDni = await CustomerModel.findByDni(dni);
        result.dni_taken = !!byDni;
        result.dni_has_account = !!(byDni && byDni.customer_password);
      }

      return res.json(result);
    } catch (err) {
      console.error('[customers/check]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  getByDni: async (req, res) => {
    try {
      const customer = await CustomerModel.findByDni(req.params.dni);
      if (!customer) return res.status(404).json({ message: 'Cliente no encontrado.' });
      res.json(sanitize(customer));
    } catch (err) {
      console.error('[customers/getByDni]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  create: async (req, res) => {
    try {
      const { full_name, dni, address, phone, email, customer_password } = req.body || {};

      if (!full_name) {
        return res.status(400).json({ message: 'full_name es obligatorio.' });
      }

      let hashed = null;
      if (customer_password !== undefined && customer_password !== null && customer_password !== '') {
        if (typeof customer_password !== 'string' || customer_password.length < 6) {
          return res.status(400).json({
            message: 'La contraseña debe tener al menos 6 caracteres.'
          });
        }
        hashed = await bcrypt.hash(customer_password, 10);
      }

      if (dni) {
        const existingByDni = await CustomerModel.findByDni(dni);
        if (existingByDni) {
          return res.status(409).json({ message: 'Ya existe un cliente con ese DNI.' });
        }
      }
      if (email) {
        const existingByEmail = await CustomerModel.findByEmailIncludingInactive(email);
        if (existingByEmail) {
          return res.status(409).json({ message: 'Email ya registrado.' });
        }
      }

      const customer = await CustomerModel.createWithPassword({
        full_name,
        dni: dni || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        customer_password: hashed
      });
      res.status(201).json(sanitize(customer));
    } catch (err) {
      if (err && err.code === '23505') {
        return res.status(409).json({ message: 'Cliente con email o DNI ya existe.' });
      }
      console.error('[customers/create]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  update: async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);

      // Ownership: un customer solo puede modificarse a sí mismo.
      // Staff/admin pueden modificar cualquier customer (uso legítimo en POS).
      if (req.user.role === 'cust' && req.user.customer_id !== targetId) {
        return res.status(403).json({
          message: 'No tienes permiso para modificar este cliente.'
        });
      }

      const customer = await CustomerModel.update(targetId, req.body);
      if (!customer) return res.status(404).json({ message: 'Cliente no encontrado.' });
      res.json(sanitize(customer));
    } catch (err) {
      console.error('[customers/update]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  delete: async (req, res) => {
    try {
      const customer = await CustomerModel.delete(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Cliente no encontrado.' });
      res.json({ message: 'Cliente eliminado.', customer });
    } catch (err) {
      console.error('[customers/delete]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // ============================================================
  // PERFIL PROPIO (cliente) — el cliente edita SUS datos
  // ============================================================

  // PUT /api/customers/me — actualiza nombre, email, teléfono, dirección, DNI,
  // foto/avatar y, opcional, la contraseña (hasheada con bcrypt). Solo 'cust'.
  updateMe: async (req, res) => {
    try {
      const id = req.user.customer_id;
      const {
        full_name, email, phone, address, dni, photo_url,
        customer_password, current_password,
      } = req.body || {};

      const data = {};

      // ── Nombre ──────────────────────────────────────────────
      if (full_name != null) {
        if (!String(full_name).trim()) {
          return res.status(400).json({ message: 'El nombre completo es obligatorio.' });
        }
        data.full_name = String(full_name).trim();
      }

      // ── Email (acceso) ──────────────────────────────────────
      // Debe ser válido y no estar tomado por OTRO cliente.
      if (email != null) {
        const value = String(email).trim().toLowerCase();
        if (!value) return res.status(400).json({ message: 'El email es obligatorio.' });
        if (!EMAIL_RE.test(value)) {
          return res.status(400).json({ message: 'Ingresa un email válido.' });
        }
        const existing = await CustomerModel.findByEmailIncludingInactive(value);
        if (existing && existing.customer_id !== id) {
          return res.status(409).json({ message: 'Ese email ya está registrado por otra cuenta.' });
        }
        data.email = value;
      }

      // ── Teléfono (opcional, 9 dígitos) ──────────────────────
      if (phone !== undefined) {
        const value = phone === null ? '' : String(phone).trim();
        if (value && !/^\d{9}$/.test(value)) {
          return res.status(400).json({ message: 'El teléfono debe tener 9 dígitos.' });
        }
        data.phone = value || null;
      }

      // ── Dirección (opcional) ────────────────────────────────
      if (address !== undefined) {
        data.address = address ? String(address).trim() : null;
      }

      // ── DNI (opcional, 8 dígitos, único) ────────────────────
      if (dni !== undefined) {
        const value = dni === null ? '' : String(dni).trim();
        if (value) {
          if (!/^\d{8}$/.test(value)) {
            return res.status(400).json({ message: 'El DNI debe tener 8 dígitos.' });
          }
          const existing = await CustomerModel.findByDni(value);
          if (existing && existing.customer_id !== id) {
            return res.status(409).json({ message: 'Ese DNI ya está registrado por otra cuenta.' });
          }
          data.dni = value;
        } else {
          data.dni = null;
        }
      }

      // ── Foto / avatar ───────────────────────────────────────
      if (photo_url !== undefined) data.photo_url = photo_url || null;

      // ── Contraseña (opcional) ───────────────────────────────
      // Si la cuenta YA tiene contraseña → exige y verifica la actual.
      // Si NO la tiene (registro con Google) → permite CREARLA sin actual.
      let newHashed = null;
      if (customer_password) {
        if (String(customer_password).length < 6) {
          return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
        }
        const currentHash = await CustomerModel.getPasswordHashById(id);
        if (currentHash) {
          if (!current_password) {
            return res.status(400).json({ message: 'Ingresa tu contraseña actual para confirmar el cambio.' });
          }
          const ok = await bcrypt.compare(String(current_password), currentHash);
          if (!ok) {
            return res.status(400).json({ message: 'La contraseña actual no es correcta.' });
          }
        }
        newHashed = await bcrypt.hash(String(customer_password), 10);
      }

      if (Object.keys(data).length > 0) {
        await CustomerModel.update(id, data);
      }
      if (newHashed) {
        await CustomerModel.updatePassword(id, newHashed);
      }

      const customer = await CustomerModel.findById(id);
      if (!customer) return res.status(404).json({ message: 'Cliente no encontrado.' });
      return res.json(sanitize(customer));
    } catch (err) {
      if (err && err.code === '23505') {
        return res.status(409).json({ message: 'Email o DNI ya registrado por otra cuenta.' });
      }
      console.error('[customers/updateMe]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  },

  // POST /api/customers/me/photo — sube la foto a S3/CloudFront (prefijo
  // 'avatars'), la guarda en photo_url y limpia la anterior si era nuestra.
  uploadMyPhoto: async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: 'No se recibió ninguna imagen.' });
      }
      const id = req.user.customer_id;
      const previa = await CustomerModel.getPhotoUrl(id);

      const { url } = await uploadBuffer(req.file.buffer, req.file.mimetype, 'avatars');
      await CustomerModel.update(id, { photo_url: url });

      if (previa && previa !== url) await deleteByUrl(previa);

      return res.json({ photo_url: url });
    } catch (err) {
      console.error('[customers/uploadMyPhoto]', err);
      return res.status(500).json({ message: 'Error al subir la imagen.' });
    }
  },

  // PATCH /api/customers/me/deactivate — el cliente desactiva SU PROPIA cuenta
  // (is_active=false). El frontend cierra la sesión a continuación.
  deactivateMe: async (req, res) => {
    try {
      const customer = await CustomerModel.softDelete(req.user.customer_id);
      if (!customer) return res.status(404).json({ message: 'Cliente no encontrado.' });
      return res.json({ message: 'Cuenta desactivada.', customer });
    } catch (err) {
      console.error('[customers/deactivateMe]', err);
      return res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = customerController;
