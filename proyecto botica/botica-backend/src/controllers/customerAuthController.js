const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const CustomerModel = require('../models/customerModel');

const sanitize = (customer) => {
  if (!customer) return null;
  const { customer_password, ...rest } = customer;
  return rest;
};

const signCustomerToken = (customer) => {
  return jwt.sign(
    {
      customer_id: customer.customer_id,
      role: 'cust',
      full_name: customer.full_name,
      email: customer.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

const customerAuthController = {

  login: async (req, res) => {
    try {
      const { email, customer_password } = req.body || {};

      if (!email || !customer_password) {
        return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
      }

      const customer = await CustomerModel.findByEmail(email);
      if (!customer || !customer.customer_password) {
        return res.status(401).json({ message: 'Cliente no encontrado o inactivo.' });
      }

      const validPassword = await bcrypt.compare(customer_password, customer.customer_password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Contraseña incorrecta.' });
      }

      const token = signCustomerToken(customer);
      return res.json({ token, customer: sanitize(customer) });
    } catch (err) {
      console.error('Error en customer login:', err);
      return res.status(500).json({ message: 'Error del servidor.' });
    }
  },

  register: async (req, res) => {
    try {
      const { full_name, dni, address, phone, email, customer_password } = req.body || {};

      if (!full_name || !email || !customer_password) {
        return res.status(400).json({
          message: 'full_name, email y customer_password son obligatorios.'
        });
      }
      if (typeof customer_password !== 'string' || customer_password.length < 6) {
        return res.status(400).json({
          message: 'La contraseña debe tener al menos 6 caracteres.'
        });
      }
      if (dni !== undefined && dni !== null && dni !== '' && !/^\d{8}$/.test(String(dni))) {
        return res.status(400).json({ message: 'El DNI debe tener 8 dígitos.' });
      }
      if (phone !== undefined && phone !== null && phone !== '' && !/^\d{9}$/.test(String(phone))) {
        return res.status(400).json({ message: 'El teléfono debe tener 9 dígitos.' });
      }

      const existing = await CustomerModel.findByEmailIncludingInactive(email);
      if (existing) {
        return res.status(409).json({ message: 'Email ya registrado.' });
      }

      const hashed = await bcrypt.hash(customer_password, 10);
      const customer = await CustomerModel.createWithPassword({
        full_name,
        dni: dni || null,
        address: address || null,
        phone: phone || null,
        email,
        customer_password: hashed
      });

      const token = signCustomerToken(customer);
      return res.status(201).json({ token, customer: sanitize(customer) });
    } catch (err) {
      if (err && err.code === '23505') {
        return res.status(409).json({ message: 'Email o DNI ya registrado.' });
      }
      console.error('Error en customer register:', err);
      return res.status(500).json({ message: 'Error del servidor.' });
    }
  }
};

module.exports = customerAuthController;
