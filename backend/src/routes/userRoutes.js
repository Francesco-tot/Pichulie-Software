const express = require('express');
const { login } = require('../apps/user/controllers/controllers');

const router = express.Router();

router.post('/users/login', login);

module.exports = router;
