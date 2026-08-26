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

// ── Sales API ───────────────────────────────────────────
export const salesAPI = {
  list: (page = 1, perPage = 25, filters = {}) =>
    client.get('/sales/', {
      params: { page, per_page: perPage, ...filters },
    }),

  getById: (id) =>
    client.get(`/sales/${id}`),

  create: (data) =>
    client.post('/sales/', data),

  getStats: () =>
    client.get('/sales/stats'),

  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/sales/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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

export default client;
