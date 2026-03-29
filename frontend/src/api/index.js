import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dmart_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dmart_token');
      localStorage.removeItem('dmart_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const login = (email, password) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');

// ── Products ──────────────────────────────────────────
export const getProducts = (params) => api.get('/products', { params });
export const getProductByBarcode = (barcode) => api.get(`/products/barcode/${barcode}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// ── Categories ────────────────────────────────────────
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);

// ── Bills ─────────────────────────────────────────────
export const createBill = (data) => api.post('/bills', data);
export const getBills = (params) => api.get('/bills', { params });
export const getBill = (id) => api.get(`/bills/${id}`);
export const cancelBill = (id) => api.patch(`/bills/${id}/cancel`);

// ── Customers ─────────────────────────────────────────
export const getCustomers = (params) => api.get('/customers', { params });
export const createCustomer = (data) => api.post('/customers', data);

// ── Dashboard ─────────────────────────────────────────
export const getDashboardStats = () => api.get('/dashboard/stats');

// ── Staff (add these lines to your existing src/api/index.js) ───────────────

export const getStaff        = (params)   => api.get('/staff', { params });
export const createStaff     = (data)     => api.post('/staff', data);
export const updateStaff     = (id, data) => api.put(`/staff/${id}`, data);
export const changeStaffPass = (id, pwd)  => api.patch(`/staff/${id}/password`, { password: pwd });
export const toggleStaff     = (id)       => api.patch(`/staff/${id}/toggle`);
export const deleteStaff     = (id)       => api.delete(`/staff/${id}`);

export default api;
