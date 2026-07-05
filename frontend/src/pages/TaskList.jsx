import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { useToast } from '../context/ToastContext';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate:asc');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // null for create, task object for edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pending',
    priority: 'Medium',
    dueDate: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const { addToast } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (priorityFilter !== 'All') params.append('priority', priorityFilter);
      if (sortBy) params.append('sortBy', sortBy);

      const response = await api.get(`/tasks?${params.toString()}`);
      if (response.data.success) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Fetch tasks error:', error.message);
      addToast('Failed to load tasks list', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when filters or sorts change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTasks();
    }, 300); // Debounce search changes

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter, priorityFilter, sortBy]);

  const handleOpenCreateModal = () => {
    setCurrentTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'Pending',
      priority: 'Medium',
      dueDate: '',
    });
    setValidationErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setCurrentTask(task);
    // Format date string for the HTML date input (YYYY-MM-DD)
    let formattedDate = '';
    if (task.dueDate) {
      formattedDate = new Date(task.dueDate).toISOString().split('T')[0];
    }

    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: formattedDate,
    });
    setValidationErrors({});
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (currentTask) {
        // Edit Mode
        const response = await api.put(`/tasks/${currentTask._id}`, formData);
        if (response.data.success) {
          addToast('Task updated successfully!', 'success');
          setModalOpen(false);
          fetchTasks();
        }
      } else {
        // Create Mode
        const response = await api.post('/tasks', formData);
        if (response.data.success) {
          addToast('Task created successfully!', 'success');
          setModalOpen(false);
          fetchTasks();
        }
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to save task';
      addToast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        addToast('Task deleted successfully', 'success');
        fetchTasks();
      }
    } catch (error) {
      console.error('Delete error:', error.message);
      addToast('Failed to delete task', 'error');
    }
  };

  return (
    <div className="fade-in">
      <div className="content-header">
        <div>
          <h2>Task Management</h2>
          <p>Organize, modify, and track daily activities.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Task
        </button>
      </div>

      {/* Control Bar */}
      <div className="controls-bar">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="select-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            className="select-input"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <select
            className="select-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="dueDate:asc">Due Date (Ascending)</option>
            <option value="dueDate:desc">Due Date (Descending)</option>
            <option value="createdAt:desc">Created (Newest)</option>
            <option value="createdAt:asc">Created (Oldest)</option>
          </select>
        </div>
      </div>

      {/* Task Grid */}
      {loading ? (
        <Loader />
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks found</h3>
          <p>Try adjustments in search text, filter selections, or create a new task.</p>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            Add Task
          </button>
        </div>
      ) : (
        <div className="tasks-grid">
          {tasks.map((task) => (
            <div key={task._id} className="task-card scale-in">
              <div className="task-card-header">
                <h3 className="task-card-title" title={task.title}>{task.title}</h3>
              </div>
              
              <div className="task-badges">
                <span className={`badge ${
                  task.status === 'Completed' ? 'badge-status-completed' :
                  task.status === 'In Progress' ? 'badge-status-progress' : 'badge-status-pending'
                }`}>
                  {task.status}
                </span>
                <span className={`badge ${
                  task.priority === 'High' ? 'badge-priority-high' :
                  task.priority === 'Medium' ? 'badge-priority-medium' : 'badge-priority-low'
                }`}>
                  {task.priority}
                </span>
              </div>

              <p className="task-card-body">
                {task.description || 'No description available.'}
              </p>

              <div className="task-card-footer">
                <div className="task-due-date">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                </div>

                <div className="task-actions">
                  <button
                    className="action-btn edit"
                    title="Edit Task"
                    onClick={() => handleOpenEditModal(task)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    className="action-btn delete"
                    title="Delete Task"
                    onClick={() => handleDeleteTask(task._id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content scale-in">
            <div className="modal-header">
              <h3 className="modal-title">{currentTask ? 'Edit Task' : 'Create New Task'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="title">Task Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-control"
                    placeholder="Enter task title"
                    value={formData.title}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                  {validationErrors.title && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                      {validationErrors.title}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    className="form-control"
                    rows="3"
                    placeholder="Provide details about this task"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    style={{ resize: 'vertical' }}
                  ></textarea>
                  {validationErrors.description && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                      {validationErrors.description}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      className="select-input"
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      style={{ width: '100%' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      className="select-input"
                      value={formData.priority}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      style={{ width: '100%' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    className="form-control"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
