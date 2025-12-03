import axios from 'axios';
import { API_URL } from '@/config';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
