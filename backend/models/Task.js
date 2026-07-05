const fs = require('fs');
const path = require('path');

const tasksFilePath = path.join(__dirname, '../data/tasks.json');

const initFile = () => {
  const dir = path.dirname(tasksFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(tasksFilePath)) fs.writeFileSync(tasksFilePath, '[]');
};

const readTasks = () => {
  initFile();
  try {
    return JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'));
  } catch (e) {
    return [];
  }
};

const writeTasks = (tasks) => {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
};

const Task = {
  find: (query) => {
    const queryObj = {
      sortParams: null,
      sort: function(sortObj) {
        this.sortParams = sortObj;
        return this;
      },
      then: function(resolve, reject) {
        let tasks = readTasks();
        
        // Filter by user
        if (query.user) {
          tasks = tasks.filter(t => t.user.toString() === query.user.toString());
        }

        // Filter by search (title or description regex check)
        if (query.$or) {
          const searchTitleRegex = query.$or[0].title.$regex;
          tasks = tasks.filter(t => 
            (t.title && t.title.toLowerCase().includes(searchTitleRegex.toLowerCase())) ||
            (t.description && t.description.toLowerCase().includes(searchTitleRegex.toLowerCase()))
          );
        }

        // Filter by status
        if (query.status) {
          tasks = tasks.filter(t => t.status === query.status);
        }

        // Filter by priority
        if (query.priority) {
          tasks = tasks.filter(t => t.priority === query.priority);
        }

        // Sort if requested
        if (this.sortParams) {
          const sortField = Object.keys(this.sortParams)[0];
          const sortOrder = this.sortParams[sortField] === 'desc' ? -1 : 1; // 1 for asc, -1 for desc
          
          tasks.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            
            if (sortField === 'dueDate' || sortField === 'createdAt') {
              valA = valA ? new Date(valA) : new Date(0);
              valB = valB ? new Date(valB) : new Date(0);
            }
            
            if (valA < valB) return -1 * sortOrder;
            if (valA > valB) return 1 * sortOrder;
            return 0;
          });
        }
        resolve(tasks);
      }
    };
    return queryObj;
  },

  create: async ({ user, title, description, status, priority, dueDate }) => {
    const tasks = readTasks();
    const newTask = {
      _id: Math.random().toString(36).substring(2, 9),
      user: user.toString(),
      title,
      description: description || '',
      status: status || 'Pending',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tasks.push(newTask);
    writeTasks(tasks);
    return newTask;
  },

  findById: async (id) => {
    const tasks = readTasks();
    const task = tasks.find(t => t._id === id);
    if (!task) return null;
    
    return {
      ...task,
      save: async function() {
        const allTasks = readTasks();
        const index = allTasks.findIndex(t => t._id === this._id);
        if (index !== -1) {
          allTasks[index] = {
            _id: this._id,
            user: this.user.toString(),
            title: this.title,
            description: this.description,
            status: this.status,
            priority: this.priority,
            dueDate: this.dueDate,
            createdAt: this.createdAt,
            updatedAt: new Date().toISOString()
          };
          writeTasks(allTasks);
        }
        return this;
      },
      deleteOne: async function() {
        const allTasks = readTasks();
        const filteredTasks = allTasks.filter(t => t._id !== this._id);
        writeTasks(filteredTasks);
        return { deletedCount: 1 };
      }
    };
  },

  countDocuments: async (query) => {
    let tasks = readTasks();
    if (query.user) {
      tasks = tasks.filter(t => t.user.toString() === query.user.toString());
    }
    if (query.status) {
      if (query.status.$ne) {
        tasks = tasks.filter(t => t.status !== query.status.$ne);
      } else {
        tasks = tasks.filter(t => t.status === query.status);
      }
    }
    if (query.priority) {
      tasks = tasks.filter(t => t.priority === query.priority);
    }
    if (query.dueDate && query.dueDate.$lt) {
      const compareDate = new Date(query.dueDate.$lt);
      tasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < compareDate);
    }
    return tasks.length;
  }
};

module.exports = Task;
