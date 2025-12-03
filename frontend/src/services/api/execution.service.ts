import { apiClient } from './client';

export const executionService = {
  run: async (data: { code: string; language: string; problemSlug: string; mode: 'run' | 'submit' }) => {
    const response = await apiClient.post('/execution', data);
    return response.data;
  },
};
