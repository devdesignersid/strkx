import { apiClient } from './client';

export const authService = {
  login: async (credentials: any) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
  googleLogin: async () => {
    window.location.href = `${apiClient.defaults.baseURL}/auth/google`;
  },
};
