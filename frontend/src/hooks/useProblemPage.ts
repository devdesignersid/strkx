import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { problemsService } from '@/services/api/problems.service';
import { executionService } from '@/services/api/execution.service';
import { useMotivation } from '@/hooks/useMotivation';
import { aiService } from '@/lib/ai/aiService';
import { PROMPTS } from '@/lib/ai/prompts';
import type { ExecutionResult } from '@/types/problem';

export function useProblemPage(slug: string | undefined) {
  const { recordSolve } = useMotivation();
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionMode, setExecutionMode] = useState<'run' | 'submit' | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [isCompletingCode, setIsCompletingCode] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const endTimeRef = useRef<number | null>(null);

  // Fetch Problem
  const { data: problemData } = useQuery({
    queryKey: ['problem', slug],
    queryFn: () => problemsService.findOne(slug!),
    enabled: !!slug,
  });
  const problem = problemData?.data;

  // Fetch Submissions
  const { data: submissionsData } = useQuery({
    queryKey: ['submissions', slug],
    queryFn: () => problemsService.getSubmissions(slug!),
    enabled: !!slug,
  });
  const submissions = submissionsData?.data || [];

  // Fetch Solutions
  const { data: solutionsData } = useQuery({
    queryKey: ['solutions', slug],
    queryFn: () => problemsService.getSolutions(slug!),
    enabled: !!slug,
  });
  const solutions = solutionsData?.data || [];

  // Initialize Code & Timer
  useEffect(() => {
    if (problem) {
      setCode(prev => prev || problem.starterCode || '// Write your code here');
      if (problem.timeLimit) {
        setTimeLeft(problem.timeLimit * 60);
      }
    }
  }, [problem]);

  // Timer Logic
  useEffect(() => {
    let interval: number | null = null;

    if (isTimerRunning && timeLeft > 0) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      interval = window.setInterval(() => {
        const now = Date.now();
        if (endTimeRef.current) {
          const remaining = Math.ceil((endTimeRef.current - now) / 1000);

          if (remaining <= 0) {
            setTimeLeft(0);
            setIsTimerRunning(false);
            endTimeRef.current = null;
          } else {
            setTimeLeft(remaining);
          }
        }
      }, 1000);
    } else {
      endTimeRef.current = null;
    }

    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft]);

  // Persistence Logic
  useEffect(() => {
    if (!slug || !code) return;
    if (code === problem?.starterCode) return;
    const key = `strkx_code_${slug}`;
    localStorage.setItem(key, code);
  }, [code, slug, problem]);

  useEffect(() => {
    if (!slug) return;
    const key = `strkx_code_${slug}`;
    const savedCode = localStorage.getItem(key);
    if (savedCode) {
      setCode(savedCode);
    }
  }, [slug]);

  // Mutations
  const runCodeMutation = useMutation({
    mutationFn: executionService.run,
    onSuccess: (data, variables) => {
      if (variables.mode === 'run') {
        setOutput(data.data);
      } else {
        queryClient.invalidateQueries({ queryKey: ['submissions', slug] });
        queryClient.invalidateQueries({ queryKey: ['solutions', slug] });
        setOutput(data.data);
        if (data.data.passed) {
          recordSolve();
          if (slug) localStorage.removeItem(`strkx_code_${slug}`);
        }
      }
    },
    onError: (err: any) => {
      console.error(err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        toast.error(TOAST_MESSAGES.PROBLEM.EXECUTION_TIMEOUT);
      } else {
        toast.error(TOAST_MESSAGES.PROBLEM.EXECUTION_ERROR);
      }
    }
  });

  const handleRun = async (mode: 'run' | 'submit' = 'run', onSuccess?: () => void, codeToSubmit?: string) => {
    if (!problem || !slug) return;
    setIsRunning(true);
    setExecutionMode(mode);
    if (mode === 'run') setOutput(null);

    const codeToUse = codeToSubmit || code;

    try {
      await runCodeMutation.mutateAsync({
        code: codeToUse,
        language: 'javascript',
        problemSlug: slug,
        mode
      });
      onSuccess?.();
    } finally {
      setIsRunning(false);
      setExecutionMode(null);
    }
  };

  const markSolutionMutation = useMutation({
    mutationFn: ({ submissionId, name }: { submissionId: string; name: string }) =>
      problemsService.markSolution(slug!, submissionId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', slug] });
      queryClient.invalidateQueries({ queryKey: ['solutions', slug] });
      toast.success(TOAST_MESSAGES.PROBLEM.SOLUTION_MARKED);
    },
    onError: () => toast.error(TOAST_MESSAGES.GENERAL.ERROR)
  });

  const unmarkSolutionMutation = useMutation({
    mutationFn: (submissionId: string) => problemsService.unmarkSolution(slug!, submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', slug] });
      queryClient.invalidateQueries({ queryKey: ['solutions', slug] });
      toast.success(TOAST_MESSAGES.PROBLEM.SOLUTION_UNMARKED);
    },
    onError: () => toast.error(TOAST_MESSAGES.GENERAL.ERROR)
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: (submissionId: string) => problemsService.deleteSubmission(slug!, submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', slug] });
      queryClient.invalidateQueries({ queryKey: ['solutions', slug] });
      toast.success('Submission deleted');
    },
    onError: () => toast.error(TOAST_MESSAGES.GENERAL.ERROR)
  });

  // AI Handlers
  const handleAIAnalyze = async () => {
    if (!aiService.isConfigured()) {
      toast.error('AI is not configured. Please go to Settings.', { duration: 3000 });
      return;
    }

    setIsAnalyzing(true);
    try {
      const testCasesStr = problem?.testCases?.map((tc: any, i: number) =>
        `Test Case ${i + 1}:\nInput: ${tc.input}\nExpected Output: ${tc.expectedOutput}`
      ).join('\n\n') || 'No test cases available.';

      const prompt = PROMPTS.SOLUTION_EVALUATION
        .replace('{problemTitle}', problem?.title || '')
        .replace('{problemDescription}', problem?.description || '')
        .replace('{testCases}', testCasesStr)
        .replace('{userCode}', code);

      const response = await aiService.generateCompletion(prompt);
      const jsonStr = response.replace(/```json\n?|```\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(jsonStr);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze solution:', error);
      toast.error(TOAST_MESSAGES.AI.ANALYSIS_FAILED);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetHint = async () => {
    if (!aiService.isConfigured()) {
      toast.error(TOAST_MESSAGES.AUTH.API_KEY_MISSING);
      return;
    }

    setIsRequestingHint(true);
    try {
      const prompt = PROMPTS.SOLUTION_HINT
        .replace('{problemDescription}', problem?.description || '')
        .replace('{userCode}', code);

      const hint = await aiService.generateCompletion(prompt);
      toast.info({
        title: TOAST_MESSAGES.AI.HINT_GENERATED.title,
        description: hint
      }, { duration: 8000 });
    } catch (error) {
      console.error('Failed to get hint:', error);
      toast.error(TOAST_MESSAGES.GENERAL.ERROR);
    } finally {
      setIsRequestingHint(false);
    }
  };

  const handleCompleteCode = async (currentCode: string) => {
    if (!aiService.isConfigured()) {
      toast.error(TOAST_MESSAGES.AUTH.API_KEY_MISSING);
      return;
    }

    setIsCompletingCode(true);
    try {
      let testResultsStr = 'No test results available.';
      if (output && output.results) {
        const failingTests = output.results.filter(r => !r.passed);
        if (failingTests.length > 0) {
          testResultsStr = 'Failing Tests:\n' + failingTests.map(t =>
            `Input: ${t.input}\nExpected: ${t.expectedOutput}\nActual: ${t.actualOutput}\nError: ${t.error || 'N/A'}`
          ).join('\n\n');
        } else if (output.results.length > 0) {
          testResultsStr = 'All previous tests passed.';
        }
      }

      const testCasesStr = problem?.testCases?.map((tc: any, i: number) =>
        `Test Case ${i + 1}:\nInput: ${tc.input}\nExpected Output: ${tc.expectedOutput}`
      ).join('\n\n') || 'No test cases available.';

      const STRUCTURE_DEFINITIONS_TEXT = `
// Definition for singly-linked list.
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}

// Definition for a binary tree node.
function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val)
    this.left = (left===undefined ? null : left)
    this.right = (right===undefined ? null : right)
}

// Definition for a Node (Graph).
function Node(val, neighbors) {
    this.val = val === undefined ? 0 : val;
    this.neighbors = neighbors === undefined ? [] : neighbors;
}

// Definition for a Node (Random List).
function Node(val, next, random) {
    this.val = val === undefined ? 0 : val;
    this.next = next === undefined ? null : next;
    this.random = random === undefined ? null : random;
}
`;

      const prompt = PROMPTS.SOLUTION_COMPLETION
        .replace('{problemTitle}', problem?.title || '')
        .replace('{problemDescription}', problem?.description || '')
        .replace('{starterCode}', problem?.starterCode || '')
        .replace('{userCode}', currentCode)
        .replace('{testCases}', testCasesStr)
        .replace('{structureDefinitions}', STRUCTURE_DEFINITIONS_TEXT)
        .replace('{testResults}', testResultsStr);

      const completion = await aiService.generateCompletion(prompt);
      const cleanCode = completion.replace(/```javascript\n?|```typescript\n?|```\n?|\n?```/g, '');

      setCode(cleanCode);
      toast.success(TOAST_MESSAGES.AI.CODE_COMPLETED);
    } catch (error) {
      console.error('Failed to complete code:', error);
      toast.error(TOAST_MESSAGES.GENERAL.ERROR);
    } finally {
      setIsCompletingCode(false);
    }
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    if (problem?.timeLimit) {
      setTimeLeft(problem.timeLimit * 60);
    } else {
      setTimeLeft(45 * 60);
    }
  };

  return {
    problem,
    code,
    setCode,
    output,
    isRunning,
    submissions,
    solutions,
    aiAnalysis,
    isAnalyzing,
    isRequestingHint,
    isCompletingCode,
    subcategory: 'Hooks',
    executionMode,
    timeLeft,
    isTimerRunning,
    handleRun,
    handleAIAnalyze,
    handleGetHint,
    handleCompleteCode,
    toggleTimer,
    resetTimer,
    markAsSolution: (submissionId: string, name: string) => markSolutionMutation.mutate({ submissionId, name }),
    unmarkAsSolution: (submissionId: string) => unmarkSolutionMutation.mutate(submissionId),
    deleteSubmission: (submissionId: string) => deleteSubmissionMutation.mutate(submissionId)
  };
}
