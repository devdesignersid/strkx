import { apiClient } from './client';

/**
 * User API Service
 *
 * Provides methods for user authentication, profile management,
 * and account operations.
 */
export const userService = {
  /**
   * Get the current user's profile information
   * @returns Promise with user profile data
   */
  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Log out the current user
   * Clears server-side session and returns confirmation
   * @returns Promise with logout confirmation
   */
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  /**
   * Reset user account (delete all user data)
   * WARNING: This is a destructive operation that cannot be undone
   * @returns Promise with reset confirmation
   */
  resetAccount: async () => {
    const response = await apiClient.delete('/user/reset');
    return response.data;
  }
};
