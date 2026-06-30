const express = require('express');
const router = express.Router();
const { login, verifyTwofa, resendTwofa } = require('../controllers/authController');
const customerAuthController = require('../controllers/customerAuthController');

router.post('/login', login);
// Verificación en dos pasos (2FA) — solo personal/admin.
router.post('/verify-2fa', verifyTwofa);
router.post('/resend-2fa', resendTwofa);
router.post('/customer-login', customerAuthController.login);
router.post('/customer-register', customerAuthController.register);

// Login / alta con Google (cliente)
router.post('/google', customerAuthController.googleAuth);

// Recuperación de contraseña (cliente)
router.post('/forgot-password', customerAuthController.forgotPassword);
router.post('/reset-password/validate', customerAuthController.validateResetToken);
router.post('/reset-password', customerAuthController.resetPassword);

module.exports = router;
