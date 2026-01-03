import axios from 'axios';
import { encryptDatesInObject, decryptDatesInObject } from './dateEncryptionClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests and encrypt dates
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Encrypt dates in request data
      if (config.data && typeof config.data === 'object') {
        config.data = await encryptDatesInObject(config.data);
      }
      
      // Encrypt dates in request params
      if (config.params && typeof config.params === 'object') {
        config.params = await encryptDatesInObject(config.params);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors and token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  async (response) => {
    // Decrypt dates in response data
    if (response.data && typeof response.data === 'object') {
      response.data = await decryptDatesInObject(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token, logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        processQueue(error, null);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Try to refresh token
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/refresh`, {
          refreshToken,
        });

        if (response.data.success) {
          const { token: newToken } = response.data.data;
          localStorage.setItem('token', newToken);

          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Process queued requests
          processQueue(null, newToken);
          isRefreshing = false;

          // Retry original request
          return api(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        // Refresh failed, logout
        processQueue(refreshError, null);
        isRefreshing = false;
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

