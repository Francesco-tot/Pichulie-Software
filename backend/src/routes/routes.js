const express = require("express");
const userRoutes = require("./userRoutes");

const router = express.Router();

// Rutas de usuarios (incluye login y reset de contraseña)
router.use("/api/users", userRoutes);

module.exports = router;