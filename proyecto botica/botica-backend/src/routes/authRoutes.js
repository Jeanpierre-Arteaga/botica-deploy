const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const customerAuthController = require('../controllers/customerAuthController');

router.post('/login', login);
router.post('/customer-login', customerAuthController.login);
router.post('/customer-register', customerAuthController.register);

module.exports = router;
