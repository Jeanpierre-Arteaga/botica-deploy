const bcrypt = require('bcryptjs');
const CustomerModel = require('../models/customerModel');

const sanitize = (customer) => {
  if (!customer) return customer;
  const { customer_password, ...rest } = customer;
  return rest;
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
  }
};

module.exports = customerController;
