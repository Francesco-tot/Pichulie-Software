const express = require('express');
const { createTask, getTasksByUser } = require('../apps/task/controllers/controllers');
const authMiddleware = require('../apps/task/middlewares/middlewares');

const router = express.Router();

// Create a new task, must be logged in
router.post('/new', authMiddleware, createTask);
router.get('/', authMiddleware, getTasksByUser );

module.exports = router;
