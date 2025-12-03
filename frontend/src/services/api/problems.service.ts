import { apiClient } from './client';

/**
 * Problems API Service
 *
 * Provides methods for managing coding problems including CRUD operations,
 * submissions, and solutions.
 */
export const problemsService = {
  /**
   * Fetch all problems with optional filtering, sorting, and pagination
   * @param params - Query parameters for filtering and pagination
   * @param params.page - Page number (default: 1)
   * @param params.limit - Items per page (default: 20)
   * @param params.search - Search query for problem title
   * @param params.difficulty - Filter by difficulty (Easy, Medium, Hard)
   * @param params.status - Filter by status (Todo, Solved, Attempted)
   * @param params.tags - Filter by tags (comma-separated)
   * @param params.sort - Sort field (title, difficulty, status, acceptance)
   * @param params.order - Sort direction (asc, desc)
   * @returns Promise with paginated problems data
   */
  findAll: async (params?: any) => {
    const response = await apiClient.get('/problems', { params });
    return response.data;
  },

  /**
   * Fetch a single problem by its slug
   * @param slug - Unique problem identifier (URL-friendly)
   * @returns Promise with problem details
   */
  findOne: async (slug: string) => {
    const response = await apiClient.get(`/problems/${slug}`);
    return response.data;
  },

  /**
   * Create a new coding problem
   * @param data - Problem data including title, description, test cases, etc.
   * @returns Promise with created problem data
   */
  create: async (data: any) => {
    const response = await apiClient.post('/problems', data);
    return response.data;
  },

  /**
   * Update an existing problem
   * @param id - Problem ID
   * @param data - Updated problem data
   * @returns Promise with updated problem data
   */
  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/problems/${id}`, data);
    return response.data;
  },

  /**
   * Get a problem by ID (for editing)
   * @param id - Problem ID
   * @returns Promise with problem data
   */
  getById: async (id: string) => {
    const response = await apiClient.get(`/problems/${id}`);
    return response.data;
  },

  /**
   * Delete a problem permanently
   * @param id - Problem ID
   * @returns Promise with deletion confirmation
   */
  delete: async (id: string) => {
    const response = await apiClient.delete(`/problems/${id}`);
    return response.data;
  },

  /**
   * Get all submissions for a problem
   * @param slug - Problem slug
   * @returns Promise with array of user submissions
   */
  getSubmissions: async (slug: string) => {
    const response = await apiClient.get(`/problems/${slug}/submissions`);
    return response.data;
  },

  /**
   * Get all solutions for a problem
   * @param slug - Problem slug
   * @returns Promise with array of marked solutions
   */
  getSolutions: async (slug: string) => {
    const response = await apiClient.get(`/problems/${slug}/solutions`);
    return response.data;
  },

  /**
   * Mark a submission as a solution
   * @param slug - Problem slug
   * @param submissionId - Submission ID to mark
   * @param name - Name/title for the solution
   * @returns Promise with updated submission data
   */
  markSolution: async (slug: string, submissionId: string, name: string) => {
    const response = await apiClient.patch(`/problems/${slug}/submissions/${submissionId}/solution`, {
      isSolution: true,
      solutionName: name,
    });
    return response.data;
  },

  /**
   * Remove solution marking from a submission
   * @param slug - Problem slug
   * @param submissionId - Submission ID to unmark
   * @returns Promise with updated submission data
   */
  unmarkSolution: async (slug: string, submissionId: string) => {
    const response = await apiClient.patch(`/problems/${slug}/submissions/${submissionId}/solution`, {
      isSolution: false,
    });
    return response.data;
  },

  /**
   * Delete a submission permanently
   * @param slug - Problem slug
   * @param submissionId - Submission ID to delete
   * @returns Promise with deletion confirmation
   */
  deleteSubmission: async (slug: string, submissionId: string) => {
    const response = await apiClient.delete(`/problems/${slug}/submissions/${submissionId}`);
    return response.data;
  },
};
