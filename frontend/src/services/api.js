import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Resolve the backend API base URL.
 * - If VITE_API_URL is set, use it (stripping trailing slashes).
 * - If it does not already end with /api/v1, append it — this keeps old
 *   builds where VITE_API_URL pointed at the Render root working too.
 * - If VITE_API_URL is missing entirely, fall back to the production backend.
 */
export const API_BASE_URL = (() => {
  let base = (import.meta.env.VITE_API_URL || '').trim();
  if (!base) base = 'https://logicore-api-85rj.onrender.com';
  base = base.replace(/\/+$/, '');
  if (!base.endsWith('/api/v1')) base += '/api/v1';
  return base;
})();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || 'An error occurred';
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;