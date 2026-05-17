import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agregar token a todas las solicitudes
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

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  registerEmployee: (name, email, password, document, phone, address) => 
    api.post('/auth/register-employee', { name, email, password, document, phone, address }),
  getEmployees: () => api.get('/auth/employees'),
  updateEmployee: (id, data) => api.put(`/auth/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/auth/employees/${id}`),
  getReportsSummary: (params = {}) => api.get('/reports/summary', { params }),
  exportReports: (params = {}) => api.get('/reports/export', { params, responseType: 'blob' }),
  exportReportsExcel: (params = {}) => api.get('/reports/export-excel', { params, responseType: 'blob' }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Turnos endpoints
export const turnosAPI = {
  getAll: () => api.get('/turnos'),
  getById: (id) => api.get(`/turnos/${id}`),
  create: (turno) => api.post('/turnos', turno),
  createBulk: (turnos) => api.post('/turnos/bulk', { turnos }),
  update: (id, turno) => api.put(`/turnos/${id}`, turno),
  delete: (id) => api.delete(`/turnos/${id}`),
};

export default api;
