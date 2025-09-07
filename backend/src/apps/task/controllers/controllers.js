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

module.exports = { createTask };
