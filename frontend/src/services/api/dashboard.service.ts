import { apiClient } from './client';

export const dashboardService = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },
  getActivity: async () => {
    const response = await apiClient.get('/dashboard/activity');
    return response.data;
  },
  getHeatmap: async () => {
    const response = await apiClient.get('/dashboard/heatmap');
    return response.data;
  },
};
