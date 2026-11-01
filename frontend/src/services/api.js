import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  seedDemoData: () => api.post('/auth/seed-demo-data'),
  clearData: () => api.post('/auth/clear-data'),
};

// Transaction APIs
export const transactionApi = {
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getById: (id) => api.get(`/transactions/${id}`),
  getFiltered: (params) => api.get('/transactions', { params }),
  getAll: () => api.get('/transactions/all'),
};

// Budget APIs
export const budgetApi = {
  save: (data) => api.post('/budgets', data),
  getAll: (params) => api.get('/budgets', { params }),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// Dashboard APIs
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// Report APIs
export const reportApi = {
  getAnalytics: (params) => api.get('/reports/analytics', { params }),
  exportCsv: () => api.get('/reports/export/csv', { responseType: 'blob' }),
};

// Category APIs
export const categoryApi = {
  getAll: (type) => api.get('/categories', { params: type ? { type } : {} }),
  create: (data) => api.post('/categories', data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export default api;
