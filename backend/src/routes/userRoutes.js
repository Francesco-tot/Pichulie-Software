const express = require('express');
const { login, requestPasswordReset, resetPassword, validateResetToken } = require('../apps/user/controllers/controllers');
const loginLimiter = require('../apps/user/middlewares/middlewares');

const router = express.Router();


// Login route existing
router.post('/login', loginLimiter, login);

// Routes for password reset
router.post('/request-reset', requestPasswordReset);
router.get('/validate-token/:token', validateResetToken);
router.post('/reset-password', resetPassword);

module.exports = router;
