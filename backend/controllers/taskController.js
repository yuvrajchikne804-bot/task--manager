const Task = require('../models/Task');

// @desc    Get all tasks for logged in user (with search and filters)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const query = { user: req.user._id };

    // Search filter (title or description)
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Status filter
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    // Priority filter
    if (req.query.priority && req.query.priority !== 'All') {
      query.priority = req.query.priority;
    }

    // Sort options
    let sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    const tasks = await Task.find(query).sort(sort);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('Get Tasks Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving tasks' });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  try {
    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      status: status || 'Pending',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
    });

    res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Create Task Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating task' });
  }
};

// @desc    Get single task details
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify task owner
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this task' });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Get Task ID Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving task details' });
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify task owner
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this task' });
    }

    // Perform updates
    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;

    await task.save();

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Update Task Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating task' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify task owner
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete Task Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting task' });
  }
};

// @desc    Get dashboard metrics and counts
// @route   GET /api/tasks/stats/summary
// @access  Private
const getTaskStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total tasks
    const total = await Task.countDocuments({ user: userId });

    // Status counts
    const pending = await Task.countDocuments({ user: userId, status: 'Pending' });
    const inProgress = await Task.countDocuments({ user: userId, status: 'In Progress' });
    const completed = await Task.countDocuments({ user: userId, status: 'Completed' });

    // Priority counts
    const low = await Task.countDocuments({ user: userId, priority: 'Low' });
    const medium = await Task.countDocuments({ user: userId, priority: 'Medium' });
    const high = await Task.countDocuments({ user: userId, priority: 'High' });

    // Overdue tasks: dueDate exists, is earlier than today, and status is not Completed
    const today = new Date();
    const overdue = await Task.countDocuments({
      user: userId,
      status: { $ne: 'Completed' },
      dueDate: { $lt: today },
    });

    res.status(200).json({
      success: true,
      stats: {
        total,
        status: {
          pending,
          inProgress,
          completed,
        },
        priority: {
          low,
          medium,
          high,
        },
        overdue,
      },
    });
  } catch (error) {
    console.error('Get Stats Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving dashboard statistics' });
  }
};

module.exports = {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats,
};
