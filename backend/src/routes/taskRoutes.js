const express = require('express');
const { createTask } = require('../apps/task/controllers/controllers');
const authMiddleware = require('../apps/task/middlewares/middlewares');

const router = express.Router();

// Create a new task, must be logged in
router.post('/task/new', authMiddleware, createTask);

module.exports = router;
