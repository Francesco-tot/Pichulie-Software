const express = require('express');
const { login, logout, requestPasswordReset, resetPassword, validateResetToken, resendResetToken } = require('../apps/user/controllers/controllers');
const loginLimiter = require('../apps/user/middlewares/middlewares');

const router = express.Router();


// Login route existing
router.post('/login', loginLimiter, login);
router.post('/logout', logout);

// Routes for password reset
router.post('/request-reset', requestPasswordReset);
router.get('/validate-token/:token', validateResetToken);
router.post('/reset-password', resetPassword);
router.post('/resend-reset', resendResetToken);

module.exports = router;
