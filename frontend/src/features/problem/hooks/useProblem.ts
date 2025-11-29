import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { API_URL } from '@/config';
import type { Problem, ExecutionResult, Submission, Solution } from '@/types/problem';
import { useMotivation } from '@/hooks/useMotivation';
import { aiService } from '@/lib/ai/aiService';
import { PROMPTS } from '@/lib/ai/prompts';


export function useProblem(slug: string | undefined) {
  const { recordSolve } = useMotivation();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [isCompletingCode, setIsCompletingCode] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const endTimeRef = useRef<number | null>(null);

  // Timer countdown effect
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

    // Cleanup: clear interval when component unmounts or timer stops
    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, timeLeft]);

  const fetchProblem = useCallback(() => {
    if (!slug) return;
    // Reset state
    setProblem(null);
    setOutput(null);
    setAiAnalysis(null);
    setSubmissions([]);
    setSolutions([]);
    setIsRunning(false);
    setIsAnalyzing(false);
    setIsTimerRunning(false);
    endTimeRef.current = null;

    axios.get(`${API_URL}/problems/${slug}`, { withCredentials: true })
      .then(res => {
        setProblem(res.data);
        setCode(res.data.starterCode || '// Write your code here');
        if (res.data.timeLimit) {
          setTimeLeft(res.data.timeLimit * 60);
        }
      })
      .catch(err => console.error(err));
  }, [slug]);

  const fetchSubmissions = useCallback(() => {
    if (!slug) return;
    axios.get(`${API_URL}/problems/${slug}/submissions`, { withCredentials: true })
      .then(res => setSubmissions(res.data))
      .catch(err => console.error('Failed to fetch submissions:', err));
  }, [slug]);

  const fetchSolutions = useCallback(() => {
    if (!slug) return;
    axios.get(`${API_URL}/problems/${slug}/solutions`, { withCredentials: true })
      .then(res => setSolutions(res.data))
      .catch(err => console.error('Failed to fetch solutions:', err));
  }, [slug]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  useEffect(() => {
    if (problem) {
      fetchSubmissions();
      fetchSolutions();
    }
  }, [problem, fetchSubmissions, fetchSolutions]);

  const handleRun = async (mode: 'run' | 'submit' = 'run', onSuccess?: () => void, codeToSubmit?: string) => {
    if (!problem) return;
    setIsRunning(true);
    if (mode === 'run') {
      setOutput(null);
    }

    const codeToUse = codeToSubmit || code;

    try {
      const res = await axios.post(`${API_URL}/execution`, {
        code: codeToUse,
        language: 'javascript',
        problemSlug: slug,
        mode,
      }, { withCredentials: true });

      if (mode === 'run') {
        setOutput(res.data);
        onSuccess?.();
      } else {
        fetchSubmissions();
        fetchSolutions();
        setOutput(res.data);
        onSuccess?.();

        if (res.data.passed) {
          recordSolve();
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        toast.error(TOAST_MESSAGES.PROBLEM.EXECUTION_TIMEOUT);
      } else {
        toast.error(TOAST_MESSAGES.PROBLEM.EXECUTION_ERROR);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleAIAnalyze = async () => {
    if (!aiService.isConfigured()) {
      toast.error('AI is not configured. Please go to Settings.', { duration: 3000 });
      return;
    }

    setIsAnalyzing(true);
    try {
      const prompt = PROMPTS.SOLUTION_EVALUATION
        .replace('{problemTitle}', problem?.title || '')
        .replace('{problemDescription}', problem?.description || '')
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
      }, {
        duration: 8000
      });
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

        const testCasesStr = problem?.testCases?.map((tc, i) =>
            `Test Case ${i + 1}:\nInput: ${tc.input}\nExpected Output: ${tc.expectedOutput}`
        ).join('\n\n') || 'No test cases available.';

        const prompt = PROMPTS.SOLUTION_COMPLETION
            .replace('{problemDescription}', problem?.description || '')
            .replace('{userCode}', currentCode)
            .replace('{testCases}', testCasesStr)
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

  const markAsSolution = async (submissionId: string, name: string) => {
    if (!slug) return;
    try {
      await axios.patch(`${API_URL}/problems/${slug}/submissions/${submissionId}/solution`, {
        isSolution: true,
        solutionName: name,
      }, { withCredentials: true });
      fetchSubmissions();
      fetchSolutions();
      fetchSubmissions();
      fetchSolutions();
      toast.success(TOAST_MESSAGES.PROBLEM.SOLUTION_MARKED);
    } catch (err) {
      console.error('Failed to mark as solution:', err);
      toast.error(TOAST_MESSAGES.GENERAL.ERROR);
    }
  };

  const unmarkAsSolution = async (submissionId: string) => {
    if (!slug) return;
    try {
      await axios.patch(`${API_URL}/problems/${slug}/submissions/${submissionId}/solution`, {
        isSolution: false,
      }, { withCredentials: true });
      fetchSubmissions();
      fetchSolutions();
      toast.success(TOAST_MESSAGES.PROBLEM.SOLUTION_UNMARKED);
    } catch (err) {
      console.error('Failed to unmark as solution:', err);
      toast.error(TOAST_MESSAGES.GENERAL.ERROR);
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
    timeLeft,
    isTimerRunning,
    fetchSubmissions,
    fetchSolutions,
    handleRun,
    handleAIAnalyze,
    handleGetHint,
    handleCompleteCode,
    toggleTimer,
    resetTimer,
    markAsSolution,
    unmarkAsSolution
  };
}
