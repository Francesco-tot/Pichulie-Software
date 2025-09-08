const express = require('express');
const { createTask, getTasksByUser, getUserTasks } = require('../apps/task/controllers/controllers');
const authMiddleware = require('../apps/task/middlewares/middlewares');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route GET /tasks
 * @group Tasks - Task management operations  
 * @summary Get user's tasks (optimized ≤ 500ms)
 * @description Retrieves tasks for authenticated user with filtering and pagination
 * @security JWT
 */
router.get('/', authenticateToken, getUserTasks);

/**
 * @route POST /tasks
 * @group Tasks - Task management operations
 * @summary Create a new task
 * @security JWT
 */
router.post('/', authenticateToken, createTask);

// Legacy routes (mantener compatibilidad)
router.post('/new', authMiddleware, createTask);
router.get('/legacy', authMiddleware, getTasksByUser);

module.exports = router;
