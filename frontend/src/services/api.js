const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : '';
};

// We will fetch the token dynamically on each request using an interceptor or manual settings.
// Let's implement an interceptor for maximum reliability.
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, clear user details and redirect
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we are not already on login or register
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
