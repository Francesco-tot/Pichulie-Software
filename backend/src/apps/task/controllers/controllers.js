const Task = require('../models/models');

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
      console.error('Task creation error:', error);
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

module.exports = { createTask, getTasksByUser };
