export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  starterCode: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit?: number;
  testCases: { input: string; expectedOutput: string }[];
}

export interface ExecutionResult {
  passed: boolean;
  results: {
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error?: string;
    logs?: string[];
  }[];
  error?: string;
}

export interface Submission {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  output: string;
  executionTime: number | null;
  memoryUsed: number | null;
  isSolution: boolean;
  solutionName: string | null;
  timePercentile: number | null;
  memoryPercentile: number | null;
}

export interface Solution {
  id: string;
  code: string;
  solutionName: string | null;
  executionTime: number | null;
  memoryUsed: number | null;
  createdAt: string;
}
