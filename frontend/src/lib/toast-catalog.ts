/**
 * Centralized registry of all toast messages in the application.
 *
 * GUIDELINES:
 * - Keep messages short and punchy (< 40 chars preferred).
 * - Use "Sentence case" for descriptions, "Title Case" for titles.
 * - No technical jargon (e.g., "500 Error", "JSON parse failed").
 * - Be helpful and actionable.
 */

export const TOAST_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: { title: 'Welcome back!', description: 'Great to see you again.' },
    LOGOUT_SUCCESS: { title: 'Logged out', description: 'See you next time.' },
    LOGIN_FAILED: { title: 'Login failed', description: 'Please check your credentials.' },
    SESSION_EXPIRED: { title: 'Session expired', description: 'Please log in again.' },
    UNAUTHORIZED: { title: 'Access denied', description: 'You don\'t have permission to view this.' },
    API_KEY_SAVED: { title: 'API Key saved', description: 'AI features are now enabled.' },
    API_KEY_INVALID: { title: 'Invalid API Key', description: 'Please check your key and try again.' },
    API_KEY_MISSING: { title: 'API Key missing', description: 'Configure AI settings to use this feature.' },
    API_KEY_REQUIRED: { title: 'API Key required', description: 'Please enter an API key.' },
    CONNECTION_SUCCESS: { title: 'Connected!', description: 'AI provider configured successfully.' },
    CONNECTION_FAILED: { title: 'Connection failed', description: 'Invalid API key or provider error.' },
    CONNECTION_ERROR: { title: 'Network error', description: 'Could not connect to AI provider.' },
  },
  PROBLEM: {
    SAVED: { title: 'Saved!', description: 'Your problem has been saved successfully.' },
    UPDATED: { title: 'Updated!', description: 'Changes saved successfully.' },
    DELETED: { title: 'Problem deleted', description: 'The problem has been removed.' },
    GENERATED: { title: 'Problem generated', description: 'Ready for you to review.' },
    GENERATION_FAILED: { title: 'Generation failed', description: 'Could not generate problem.' },
    LOAD_FAILED: { title: 'Error loading problems', description: 'Please refresh the page.' },
    DELETE_FAILED: { title: 'Delete failed', description: 'Could not delete the problem.' },
    BULK_DELETED: { title: 'Problems deleted', description: 'Selected problems have been removed.' },
    BULK_DELETE_FAILED: { title: 'Bulk delete failed', description: 'Could not delete some problems. Try again.' },
    CODE_SAVED: { title: 'Code saved', description: 'Your progress is safe.' },
    EXECUTION_TIMEOUT: { title: 'Time limit exceeded', description: 'Check for infinite loops in your code.' },
    EXECUTION_ERROR: { title: 'Runtime error', description: 'Check the console for details.' },
    TESTS_PASSED: { title: 'All tests passed!', description: 'Great job! You solved it.' },
    TESTS_FAILED: { title: 'Tests failed', description: 'Check the output and try again.' },
    SUBMITTED: { title: 'Submitted!', description: 'Your solution has been recorded.' },
    SOLUTION_MARKED: { title: 'Marked as solution', description: 'This is now your official solution.' },
    SOLUTION_UNMARKED: { title: 'Unmarked', description: 'No longer your official solution.' },
    TITLE_REQUIRED: { title: 'Title required', description: 'Please enter a title first.' },
  },
  LISTS: {
    CREATED: { title: 'List created', description: 'Start adding problems to it.' },
    UPDATED: { title: 'List updated', description: 'Changes saved.' },
    DELETED: { title: 'List deleted', description: 'The list is gone.' },
    PROBLEM_ADDED: { title: 'Added to list', description: 'Problem saved to your list.' },
    PROBLEM_REMOVED: { title: 'Removed from list', description: 'Problem removed from your list.' },
    LOAD_FAILED: { title: 'Error loading lists', description: 'Please try refreshing the page.' },
    CREATE_FAILED: { title: 'Create failed', description: 'Could not create the list.' },
    DELETE_FAILED: { title: 'Delete failed', description: 'Could not delete the list.' },
    LOAD_DETAILS_FAILED: { title: 'Error loading list', description: 'Could not load list details.' },
    REMOVE_FAILED: { title: 'Remove failed', description: 'Could not remove problems from list.' },
    ADD_FAILED: { title: 'Add failed', description: 'Could not add problems to list.' },
  },
  INTERVIEW: {
    STARTED: { title: 'Interview started', description: 'Good luck! You got this.' },
    RESTORED: { title: 'Session restored', description: 'Welcome back to your interview.' },
    TIME_WARNING: { title: '5 minutes left', description: 'Wrap up your solution soon.' },
    COMPLETED: { title: 'Interview complete', description: 'Check your summary for feedback.' },
    START_FAILED: { title: 'Start failed', description: 'Could not start the interview.' },
    LOAD_FAILED: { title: 'Load failed', description: 'Could not load interview session.' },
    SUBMITTED_NEXT: { title: 'Submitted!', description: 'Moving to next question...' },
    SUBMIT_FAILED: { title: 'Submission failed', description: 'Please try again.' },
  },
  AI: {
    ANALYSIS_COMPLETE: { title: 'Analysis complete', description: 'Check the feedback panel.' },
    HINT_GENERATED: { title: 'Hint ready', description: 'Here is a nudge in the right direction.' },
    CODE_COMPLETED: { title: 'Code completed', description: 'AI has filled in the gaps.' },
    ANALYSIS_FAILED: { title: 'Analysis failed', description: 'Could not analyze your solution.' },
    CONFIG_SAVED: { title: 'Settings saved', description: 'AI configuration updated.' },
  },
  TIMER: {
    STARTED: { title: 'Timer started', description: 'Focus time!' },
    PAUSED: { title: 'Timer paused', description: 'Take a breather.' },
    STOPPED: { title: 'Timer stopped', description: 'Session ended.' },
    RESET: { title: 'Timer reset', description: 'Ready for a new session.' },
    BREAK_TIME: { title: 'Break time', description: 'Take 5 minutes to stretch.' },
  },
  SETTINGS: {
    RESET_SUCCESS: { title: 'Reset complete', description: 'All data has been cleared.' },
    RESET_FAILED: { title: 'Reset failed', description: 'Could not reset data. Try again.' },
  },
  MOTIVATION: {
    FIRST_SOLVE: { title: 'First solve!', description: 'Great start to the day.' },
    KEEP_GOING: { title: 'Keep it up!', description: 'Consistency is key.' },
  },
  GENERAL: {
    COPIED: { title: 'Copied!', description: 'Copied to clipboard.' },
    ERROR: { title: 'Something went wrong', description: 'Please try again later.' },
    NETWORK_ERROR: { title: 'Connection lost', description: 'Check your internet connection.' },
    NETWORK_RESTORED: { title: 'Back online', description: 'Connection restored.' },
  }
} as const;
