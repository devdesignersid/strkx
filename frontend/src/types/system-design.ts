// System Design Practice - Type Definitions

export type SystemDesignDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface SystemDesignProblem {
  id: string;
  title: string;
  slug: string;
  description: string; // Markdown
  difficulty: SystemDesignDifficulty;
  tags: string[];
  constraints: string[];
  defaultDuration: number; // Minutes
  authorId: string;
  createdAt: string;
  updatedAt: string;
  status?: 'Todo' | 'Attempted' | 'Solved';
  solutions?: any[]; // Array of official solutions
}

export interface SystemDesignSubmission {
  id: string;
  problemId: string;
  userId: string;
  excalidrawJson: any; // ExcalidrawElement[] but keeping flexible
  notesMarkdown: string;
  timeSpentSeconds: number;
  startedAt: string;
  finishedAt: string;
  createdAt: string;
}

export interface SystemDesignAnalysis {
  architectureCorrectness: string;
  scalability: string;
  missingConsiderations: string[];
  security: string;
  performance: string;
  score: number; // 0-100
  suggestedImprovements: Array<{
    priority: 'High' | 'Medium' | 'Low';
    suggestion: string;
  }>;
}

export interface SystemDesignWorkspaceState {
  notes: string; // Markdown
  excalidrawData: any; // Excalidraw elements
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  timeSpentSeconds: number;
}

// Empty template so notes editor opens blank
export const NOTES_TEMPLATE = ``;
