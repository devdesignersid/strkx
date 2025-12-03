import { apiClient } from './client';

/**
 * Lists API Service
 *
 * Provides methods for managing problem lists (collections) including
 * CRUD operations and problem assignment.
 */
export const listsService = {
  /**
   * Fetch all lists with optional filtering and pagination
   * @param params - Query parameters
   * @param params.page - Page number
   * @param params.limit - Items per page
   * @param params.search - Search query for list name
   * @returns Promise with paginated lists data
   */
  findAll: async (params?: any) => {
    const response = await apiClient.get('/lists', { params });
    return response.data;
  },

  /**
   * Fetch a single list by ID with optional problem filtering
   * @param id - List ID
   * @param params - Optional query parameters for filtering problems
   * @returns Promise with list details and problems
   */
  findOne: async (id: string, params?: any) => {
    const response = await apiClient.get(`/lists/${id}`, { params });
    return response.data;
  },

  /**
   * Create a new problem list
   * @param data - List data (name, description, etc.)
   * @returns Promise with created list data
   */
  create: async (data: any) => {
    const response = await apiClient.post('/lists', data);
    return response.data;
  },

  /**
   * Delete a list permanently
   * @param id - List ID
   * @returns Promise with deletion confirmation
   */
  delete: async (id: string) => {
    const response = await apiClient.delete(`/lists/${id}`);
    return response.data;
  },

  /**
   * Add one or more problems to a list
   * @param listId - Target list ID
   * @param problemIds - Array of problem IDs to add
   * @returns Promise with updated list data
   */
  addProblem: async (listId: string, problemIds: string[]) => {
    const response = await apiClient.post(`/lists/${listId}/problems`, { problemIds });
    return response.data;
  },

  /**
   * Remove one or more problems from a list
   * @param listId - Target list ID
   * @param problemIds - Array of problem IDs to remove
   * @returns Promise with updated list data
   */
  removeProblem: async (listId: string, problemIds: string[]) => {
    const response = await apiClient.delete(`/lists/${listId}/problems`, {
      data: { problemIds }
    });
    return response.data;
  }
};
