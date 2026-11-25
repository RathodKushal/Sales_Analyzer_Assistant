/**
 * API Client — Axios Wrapper with JWT Interceptors
 * ====================================================
 * Centralized HTTP client for all backend API calls.
 * Automatically attaches JWT tokens and handles 401s.
 */

import axios from 'axios';

const API_BASE_URL = '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: Attach JWT ─────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 ────────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ────────────────────────────────────────────
export const authAPI = {
  login: (username, password) =>
    client.post('/auth/login', { username, password }),

  register: (username, email, password, role = 'viewer') =>
    client.post('/auth/register', { username, email, password, role }),

  getProfile: () =>
    client.get('/auth/me'),
};

// ── Customers API ───────────────────────────────────────
export const customersAPI = {
  list: (skip = 0, limit = 50) => client.get('/customers/', { params: { skip, limit } }),
  getById: (id) => client.get(`/customers/${id}`),
  getSegments: () => client.get('/customers/stats'),
};

// ── Orders API ──────────────────────────────────────────
export const ordersAPI = {
  list: (skip = 0, limit = 50) => client.get('/orders/', { params: { skip, limit } }),
  getById: (id) => client.get(`/orders/${id}`),
  getStats: () => client.get('/orders/stats'),
};

// ── Products API ────────────────────────────────────────
export const productsAPI = {
  list: (skip = 0, limit = 50) => client.get('/products/', { params: { skip, limit } }),
  getById: (id) => client.get(`/products/${id}`),
};

// ── Inventory API (Live SKU Catalog & Stock Control) ───
export const inventoryAPI = {
  list: (includeArchived = false, approvalStatus = 'active') =>
    client.get('/products/inventory', { params: { includeArchived, approval_status: approvalStatus } }),
  listPending: () => client.get('/products/inventory', { params: { approval_status: 'pending_approval' } }),
  listAll: (includeArchived = false) =>
    client.get('/products/inventory', { params: { includeArchived, approval_status: 'all' } }),
  create: (data) => client.post('/products/', data),
  update: (id, data) => client.put(`/products/${id}`, data),
  delete: (id) => client.delete(`/products/${id}`),
  restore: (id) => client.post(`/products/${id}/restore`),
};

// ── Suppliers / Vendors API ─────────────────────────────
export const suppliersAPI = {
  list: () => client.get('/suppliers/'),
  create: (data) => client.post('/suppliers/', data),
};

// ── Restock & Procurement Workflow API ─────────────────
export const restockRequestsAPI = {
  list: (status = null, requestType = null) =>
    client.get('/products/restock-requests', { params: { status, request_type: requestType } }),
  create: (data) =>
    client.post('/products/restock-requests', data),
  updateStatus: (id, data) =>
    client.put(`/products/restock-requests/${id}/status`, data),
};

// ── Returns API ─────────────────────────────────────────
export const returnsAPI = {
  list: (skip = 0, limit = 50) => client.get('/returns/', { params: { skip, limit } }),
  getById: (id) => client.get(`/returns/${id}`),
  getStats: () => client.get('/returns/stats'),
};

// ── Analytics API ───────────────────────────────────────
export const analyticsAPI = {
  predict: (data) =>
    client.post('/analytics/predict', data),

  batchPredict: (records) =>
    client.post('/analytics/batch-predict', { records }),

  getSummary: () =>
    client.get('/analytics/summary'),

  getDiscountBins: () =>
    client.get('/analytics/discount-bins'),

  getHypeProducts: (limit = 150, search = null) => {
    const params = { limit };
    if (search) params.search = search;
    return client.get('/analytics/hype-products', { params });
  },

  getHypePrediction: (stockCode) =>
    client.get(`/analytics/hype/${stockCode}`),

  // ── Forecast & Demand ──────────────────────────────
  getForecast: (months = 6, category = null) => {
    const params = { months };
    if (category) params.category = category;
    return client.get('/analytics/forecast', { params });
  },

  getDemandAnalysis: () =>
    client.get('/analytics/demand-analysis'),

  getCategoryTrends: () =>
    client.get('/analytics/category-trends'),

  getDatasetMeta: () =>
    client.get('/analytics/dataset-meta'),
};

// ── Reports API ─────────────────────────────────────────
export const reportsAPI = {
  generate: (data) =>
    client.post('/reports/generate', data),

  download: (filename) =>
    client.get(`/reports/download/${filename}`, {
      responseType: 'blob',
    }),

  list: () =>
    client.get('/reports/list'),

  getTemplates: () =>
    client.get('/reports/templates'),
};

// ── Ingestion API ───────────────────────────────────────
export const ingestionAPI = {
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/ingestion/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadSalesDataset: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/ingestion/upload-sales-dataset', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDatasetStatus: () =>
    client.get('/ingestion/dataset-status'),
  resetDataset: () =>
    client.post('/ingestion/reset-dataset'),
  downloadTemplate: () =>
    client.get('/ingestion/sample-template', { responseType: 'blob' }),
  getHistory: () =>
    client.get('/ingestion/history'),
};

// ── PowerBI API ─────────────────────────────────────────
export const powerbiAPI = {
  getEmbedToken: (reportId) =>
    client.post(`/powerbi/token/${reportId}`),
};

// ── Social API ──────────────────────────────────────────
export const socialAPI = {
  generateContent: (data) =>
    client.post('/social/generate-content', data),

  generateImage: (data) =>
    client.post('/social/generate-image', data),

  getHistory: () =>
    client.get('/social/history'),
};

// ── Billing / POS API ────────────────────────────────────
export const billingAPI = {
  createBill: (data) => client.post('/orders/billing', data),
  getInvoices: (params = {}) => client.get('/orders/invoices', { params }),
  getInvoice: (id) => client.get(`/orders/invoices/${id}`),
};

// ── Admin API ───────────────────────────────────────────
export const adminAPI = {
  getMetrics: () => client.get('/admin/metrics'),
  getUsers: (params = {}) => client.get('/admin/users', { params }),
  createUser: (data) => client.post('/admin/users', data),
  updateUser: (id, data) => client.put(`/admin/users/${id}`, data),
  resetPassword: (id, new_password) => client.put(`/admin/users/${id}/reset-password`, { new_password }),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),
  getSettings: () => client.get('/admin/settings'),
  updateSettings: (settings) => client.put('/admin/settings', { settings }),
  resetSettings: () => client.post('/admin/settings/reset'),
};

export default client;
