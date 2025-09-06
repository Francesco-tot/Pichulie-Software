const express = require('express');
const { login } = require('../apps/user/controllers/controllers');
const loginLimiter = require('../apps/user/middlewares/middlewares');

const router = express.Router();

router.post('/users/login', loginLimiter, login);

module.exports = router;
