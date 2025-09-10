const Task = require('../models/models');

/**
 * Helper function for consistent error handling in development mode
 */
const handleServerError = (error, context, res) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`${context} error:`, error);
    console.error('Stack trace:', error.stack);
  } else {
    console.error(`${context} error occurred`);
  }
  
  return res.status(500).json({ 
    success: false,
    message: 'Try it again later',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

/**
 * GET /tasks
 * Get all tasks of the authenticated user
 */
const getUserTasks = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Get query parameters for optional filters
    const { status, date, limit = 50, page = 1 } = req.query;
    
    // Build base filter (only user tasks)
    const filter = { user_id: req.user.id };
    
    // Add additional filters
    if (status && ['to do', 'in process', 'finished'].includes(status)) {
      filter.status = status;
    }
    
    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        // Filter by day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        filter.task_date = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      }
    }

    // Set pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    //Sort by task date (most recent first)
    const tasks = await Task.find(filter)
      .lean() // Returns flat JS objects 
      .sort({ task_date: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination (only if needed)
    const totalTasks = await Task.countDocuments(filter);
    
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      success: true,
      message: 'Tasks successfully found',
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTasks / parseInt(limit)),
          totalTasks,
          tasksPerPage: parseInt(limit),
          hasNextPage: skip + tasks.length < totalTasks,
          hasPrevPage: parseInt(page) > 1
        }
      },
      meta: {
        responseTime: `${responseTime}ms`,
        count: tasks.length
      }
    });

  } catch (error) {
    return handleServerError(error, 'Get user tasks', res);
  }
};

const createTask = async (req, res) => {
  try {
    const { title, detail, status, task_date } = req.body;

    const newTask = new Task({
      title,
      detail,
      status,
      task_date,
      user_id: req.user.id,
    });

    await newTask.save();

    res.status(201).json({
      message: `Task created successfully with id: ${newTask.id}`,
      task: newTask,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Task creation error:', error);
    }
    res.status(500).json({ message: 'Try again later' });
  }
};

const getTasksByUser = async (req, res) => {
  try {
    // Sort by title by default and by title if specified
    const sortBy = req.query.sort === 'title' ? { title: 1 } : { task_date: 1 };

    // Find tasks by the user and sort them
    const tasks = await Task.find({ user_id: req.user.id }).sort(sortBy);

    // Group by status
    const grouped = tasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];

      acc[task.status].push(task);

      return acc;
    }, {});

    res.status(200).json({
      message: 'Tasks grouped by status',
      tasks: grouped,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Try again later' });
  }
};

module.exports = { createTask, getTasksByUser, getUserTasks };
