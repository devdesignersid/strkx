import { apiClient } from './client';

/**
 * Interview API Service
 *
 * Provides methods for managing mock interview sessions including
 * creation, submission tracking, and session management.
 */

export interface CreateSessionData {
  type: string;
  difficulty: string;
  questionCount: number;
  includeSystemDesign: boolean;
}

export interface SubmitAnswerData {
  code: string;
  language: string;
  timeSpent: number;
}

export const interviewService = {
  /**
   * Create a new mock interview session
   * @param data - Session configuration
   * @param data.type - Interview type (e.g., 'technical', 'behavioral')
   * @param data.difficulty - Difficulty level
   * @param data.questionCount - Number of questions
   * @param data.includeSystemDesign - Whether to include system design questions
   * @returns Promise with created session data including session ID
   */
  createSession: async (data: CreateSessionData) => {
    const response = await apiClient.post('/interview-sessions', data);
    return response.data;
  },

  /**
   * Get details of an interview session
   * @param sessionId - Session ID
   * @returns Promise with session details, questions, and progress
   */
  getSession: async (sessionId: string) => {
    const response = await apiClient.get(`/interview-sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Submit an answer for a question in an interview session
   * @param sessionId - Session ID
   * @param questionId - Question ID
   * @param data - Answer submission data
   * @param data.code - User's code solution
   * @param data.language - Programming language used
   * @param data.timeSpent - Time spent in seconds
   * @returns Promise with submission results and next question
   */
  submitAnswer: async (sessionId: string, questionId: string, data: SubmitAnswerData) => {
    const response = await apiClient.post(
      `/interview-sessions/${sessionId}/questions/${questionId}/submit`,
      data
    );
    return response.data;
  },

  /**
   * End an interview session (placeholder for future implementation)
   * @param sessionId - Session ID
   */
  endSession: async (sessionId: string) => {
    // Placeholder for future implementation
    console.log('Ending session:', sessionId);
  },

  /**
   * Mark a session as abandoned (called when user leaves page)
   * Uses fetch with keepalive to ensure request completes even during page unload
   * @param sessionId - Session ID to abandon
   */
  abandonSession: async (sessionId: string) => {
    // Use fetch with keepalive for reliability during unload
    // We bypass apiClient here to ensure keepalive works as expected for unload events
    const { API_URL } = await import('@/config');
    await fetch(`${API_URL}/interview-sessions/${sessionId}/abandon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true
    });
  }
};
