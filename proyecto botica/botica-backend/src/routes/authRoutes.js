const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const customerAuthController = require('../controllers/customerAuthController');

router.post('/login', login);
router.post('/customer-login', customerAuthController.login);
router.post('/customer-register', customerAuthController.register);

// Login / alta con Google (cliente)
router.post('/google', customerAuthController.googleAuth);

// Recuperación de contraseña (cliente)
router.post('/forgot-password', customerAuthController.forgotPassword);
router.post('/reset-password/validate', customerAuthController.validateResetToken);
router.post('/reset-password', customerAuthController.resetPassword);

module.exports = router;
