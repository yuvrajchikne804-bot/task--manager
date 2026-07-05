import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch stats summary
        const statsRes = await api.get('/tasks/stats/summary');
        
        // Fetch tasks (recent active ones)
        const tasksRes = await api.get('/tasks?sortBy=dueDate:asc');

        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
        
        if (tasksRes.data.success) {
          // Take top 3 non-completed tasks as upcoming tasks
          const activeTasks = tasksRes.data.tasks
            .filter(t => t.status !== 'Completed')
            .slice(0, 3);
          setRecentTasks(activeTasks);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error.message);
        addToast('Failed to load dashboard metrics', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [addToast]);

  if (loading) {
    return <Loader />;
  }

  // Fallback defaults if database has no records
  const total = stats?.total || 0;
  const statusStats = stats?.status || { pending: 0, inProgress: 0, completed: 0 };
  const priorityStats = stats?.priority || { low: 0, medium: 0, high: 0 };
  const overdue = stats?.overdue || 0;

  // Calculate percentages
  const completionRate = total > 0 ? Math.round((statusStats.completed / total) * 100) : 0;
  const pendingRate = total > 0 ? Math.round((statusStats.pending / total) * 100) : 0;
  const progressRate = total > 0 ? Math.round((statusStats.inProgress / total) * 100) : 0;

  const getPriorityPct = (val) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 360); // Degrees for conic-gradient
  };

  const getPriorityPctDisplay = (val) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 100); // 0-100 percentage for label
  };

  return (
    <div className="fade-in">
      <div className="content-header">
        <div>
          <h2>Analytics Dashboard</h2>
          <p>Get a bird's-eye view of your project tasks and milestones.</p>
        </div>
        <Link to="/tasks" className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Manage Tasks
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <div className="stat-value">{total}</div>
          </div>
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-info">
            <h3>Completed</h3>
            <div className="stat-value">{statusStats.completed}</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--color-completed)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-info">
            <h3>In Progress</h3>
            <div className="stat-value">{statusStats.inProgress}</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--color-progress)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>

        <div className="stat-card overdue">
          <div className="stat-info">
            <h3>Overdue Tasks</h3>
            <div className="stat-value">{overdue}</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--priority-high)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="visuals-row">
        {/* Progress Breakdown */}
        <div className="chart-card">
          <div className="chart-title">
            <span>Overall Completion Metrics</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{completionRate}% Total Done</span>
          </div>

          <div className="progress-container">
            <div className="progress-item">
              <div className="progress-label">
                <span>Completed Tasks</span>
                <span>{statusStats.completed} / {total} ({completionRate}%)</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${completionRate}%`, backgroundColor: 'var(--color-completed)' }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-label">
                <span>In Progress</span>
                <span>{statusStats.inProgress} / {total} ({progressRate}%)</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progressRate}%`, backgroundColor: 'var(--color-progress)' }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-label">
                <span>Pending Tasks</span>
                <span>{statusStats.pending} / {total} ({pendingRate}%)</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${pendingRate}%`, backgroundColor: 'var(--color-pending)' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Charts */}
        <div className="chart-card">
          <div className="chart-title">
            <span>Priority Distribution</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Task count by priority</span>
          </div>

          <div className="priority-circle-container">
            <div className="priority-stat-item">
              <div 
                className="circular-indicator" 
                style={{ 
                  '--accent-color': 'var(--priority-low)', 
                  '--percentage': `${getPriorityPct(priorityStats.low)}deg` 
                }}
              >
                <span className="circular-value">{priorityStats.low}</span>
              </div>
              <span className="circular-label">Low ({getPriorityPctDisplay(priorityStats.low)}%)</span>
            </div>

            <div className="priority-stat-item">
              <div 
                className="circular-indicator" 
                style={{ 
                  '--accent-color': 'var(--priority-medium)', 
                  '--percentage': `${getPriorityPct(priorityStats.medium)}deg` 
                }}
              >
                <span className="circular-value">{priorityStats.medium}</span>
              </div>
              <span className="circular-label">Medium ({getPriorityPctDisplay(priorityStats.medium)}%)</span>
            </div>

            <div className="priority-stat-item">
              <div 
                className="circular-indicator" 
                style={{ 
                  '--accent-color': 'var(--priority-high)', 
                  '--percentage': `${getPriorityPct(priorityStats.high)}deg` 
                }}
              >
                <span className="circular-value">{priorityStats.high}</span>
              </div>
              <span className="circular-label">High ({getPriorityPctDisplay(priorityStats.high)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Queue Section */}
      <div className="chart-card">
        <div className="chart-title">
          <span>Upcoming Schedule</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active tasks sorted by urgency</span>
        </div>

        {recentTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
            <p>No upcoming tasks. You are all caught up!</p>
            <Link to="/tasks" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.9rem', marginTop: '8px', display: 'inline-block' }}>
              Create a new task &rarr;
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentTasks.map(task => (
              <div 
                key={task._id} 
                className="stat-card" 
                style={{ 
                  padding: '16px 20px', 
                  backgroundColor: 'rgba(255,255,255,0.01)', 
                  cursor: 'default',
                  transform: 'none',
                  boxShadow: 'none'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, marginRight: '16px' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{task.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                    {task.description || 'No description provided.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className={`badge ${
                    task.priority === 'High' ? 'badge-priority-high' :
                    task.priority === 'Medium' ? 'badge-priority-medium' : 'badge-priority-low'
                  }`}>
                    {task.priority}
                  </span>
                  <span className={`badge ${
                    task.status === 'Completed' ? 'badge-status-completed' :
                    task.status === 'In Progress' ? 'badge-status-progress' : 'badge-status-pending'
                  }`}>
                    {task.status}
                  </span>
                  {task.dueDate && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
