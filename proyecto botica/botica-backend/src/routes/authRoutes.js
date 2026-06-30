const express = require('express');
const router = express.Router();
const { login, verifyTwofa, resendTwofa, forgotPassword } = require('../controllers/authController');
const customerAuthController = require('../controllers/customerAuthController');

router.post('/login', login);
// Verificación en dos pasos (2FA) — solo personal/admin.
router.post('/verify-2fa', verifyTwofa);
router.post('/resend-2fa', resendTwofa);
router.post('/customer-login', customerAuthController.login);
// Verificación en dos pasos (2FA) — cliente (login con correo+contraseña).
router.post('/customer-verify-2fa', customerAuthController.verifyTwofa);
router.post('/customer-resend-2fa', customerAuthController.resendTwofa);
router.post('/customer-register', customerAuthController.register);

// Login / alta con Google (cliente)
router.post('/google', customerAuthController.googleAuth);

// Recuperación de contraseña (cliente)
router.post('/forgot-password', customerAuthController.forgotPassword);
// Recuperación de contraseña (personal/admin) — mismo patrón, distinta tabla.
router.post('/staff/forgot-password', forgotPassword);
// Validación de token y reseteo: COMPARTIDOS por cliente y personal (el token
// sabe a quién pertenece).
router.post('/reset-password/validate', customerAuthController.validateResetToken);
router.post('/reset-password', customerAuthController.resetPassword);

module.exports = router;
