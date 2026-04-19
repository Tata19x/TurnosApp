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
  registerEmployee: (name, email, password) => 
    api.post('/auth/register-employee', { name, email, password }),
  getEmployees: () => api.get('/auth/employees'),
  updateEmployee: (id, data) => api.put(`/auth/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/auth/employees/${id}`),
};

// Turnos endpoints
export const turnosAPI = {
  getAll: () => api.get('/turnos'),
  getById: (id) => api.get(`/turnos/${id}`),
  create: (turno) => api.post('/turnos', turno),
  update: (id, turno) => api.put(`/turnos/${id}`, turno),
  delete: (id) => api.delete(`/turnos/${id}`),
};

export default api;