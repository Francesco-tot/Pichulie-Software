const express = require('express');

const router = express.Router();

// Este archivo se mantiene para futuras funcionalidades relacionadas con usuarios
// La funcionalidad de reset de contraseña está implementada en controllers.js
// y se accede a través de userRoutes.js

// Placeholder para futuras funcionalidades de usuario
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User module is working'
  });
});

module.exports = router;
