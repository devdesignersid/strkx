import axios from 'axios';
import { API_URL } from '@/config';
import { tokenStorage } from '@/utils/tokenStorage';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Still send cookies for Chrome fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add Authorization header from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    }
    // Handle global errors (e.g., 401 Unauthorized)
    if (error.response?.status === 401) {
      // Optional: Redirect to login or clear auth state
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
