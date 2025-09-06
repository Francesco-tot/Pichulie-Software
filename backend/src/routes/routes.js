const express = require("express");
const userRoutes = require("./userRoutes");

const router = express.Router();

router.use("/api", userRoutes);

module.exports = router;