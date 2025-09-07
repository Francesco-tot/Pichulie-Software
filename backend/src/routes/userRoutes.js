const express = require('express');
const { login, requestPasswordReset, resetPassword } = require('../apps/user/controllers/controllers');
const loginLimiter = require('../apps/user/middlewares/middlewares');

const router = express.Router();

// Ruta de login existente
router.post('/login', loginLimiter, login);

// Nuevas rutas para reset de contraseña
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;
