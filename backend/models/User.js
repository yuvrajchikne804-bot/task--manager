const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersFilePath = path.join(__dirname, '../data/users.json');

const initFile = () => {
  const dir = path.dirname(usersFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(usersFilePath)) fs.writeFileSync(usersFilePath, '[]');
};

const readUsers = () => {
  initFile();
  try {
    return JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
  } catch (e) {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

const User = {
  findOne: async ({ email }) => {
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    return {
      ...user,
      matchPassword: async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      }
    };
  },
  create: async ({ name, email, password }) => {
    const users = readUsers();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      _id: Math.random().toString(36).substring(2, 9),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(newUser);
    writeUsers(users);
    return newUser;
  },
  findById: (id) => {
    const query = {
      then: function(resolve, reject) {
        const users = readUsers();
        const user = users.find(u => u._id === id);
        if (!user) return resolve(null);
        resolve({
          ...user,
          matchPassword: async function(enteredPassword) {
            return await bcrypt.compare(enteredPassword, this.password);
          }
        });
      },
      select: function(fields) {
        return {
          then: function(resolve, reject) {
            const users = readUsers();
            const user = users.find(u => u._id === id);
            if (!user) return resolve(null);
            
            const userInstance = {
              ...user,
              matchPassword: async function(enteredPassword) {
                return await bcrypt.compare(enteredPassword, this.password);
              }
            };
            
            if (fields.includes('-password')) {
              delete userInstance.password;
            }
            resolve(userInstance);
          }
        };
      }
    };
    return query;
  }
};

module.exports = User;
