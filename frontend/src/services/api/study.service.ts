import { apiClient } from './client';

/**
 * Study Stats API Service
 *
 * Provides methods for tracking and managing study time statistics
 * including daily stats, synchronization, and reset operations.
 */
export const studyService = {
  /**
   * Get today's study statistics for the current user
   * @returns Promise with today's study stats including total seconds
   */
  getTodayStats: async () => {
    const response = await apiClient.get('/study-stats/today');
    return response.data;
  },

  /**
   * Sync study time progress to the server
   * Should be called periodically while user is studying
   * @param data - Study progress data
   * @param data.duration - Time spent studying in seconds
   * @param data.timestamp - ISO timestamp of the sync
   * @returns Promise with updated study stats
   */
  syncStats: async (data: { duration: number; timestamp: string }) => {
    const response = await apiClient.post('/study-stats/sync', data);
    return response.data;
  },

  /**
   * Reset all study statistics for the current user
   * WARNING: This will clear all historical study data
   * @returns Promise with reset confirmation
   */
  resetStats: async () => {
    const response = await apiClient.post('/study-stats/reset');
    return response.data;
  }
};
