import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import type { Problem, ExecutionResult, Submission, Solution } from '@/types/problem';
import { MotivationManager } from '@/lib/MotivationManager';
import { aiService } from '@/lib/ai/aiService';
import { PROMPTS } from '@/lib/ai/prompts';
import { Clock, XCircle, Lightbulb } from 'lucide-react';
import React from 'react';

export function useProblem(slug: string | undefined) {
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

  useEffect(() => {
    let interval: number;

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

    return () => clearInterval(interval);
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

    axios.get(`http://localhost:3000/problems/${slug}`)
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
    axios.get(`http://localhost:3000/problems/${slug}/submissions`)
      .then(res => setSubmissions(res.data))
      .catch(err => console.error('Failed to fetch submissions:', err));
  }, [slug]);

  const fetchSolutions = useCallback(() => {
    if (!slug) return;
    axios.get(`http://localhost:3000/problems/${slug}/solutions`)
      .then(res => setSolutions(res.data))
      .catch(err => console.error('Failed to fetch solutions:', err));
  }, [slug]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  const handleRun = async (mode: 'run' | 'submit' = 'run', onSuccess?: () => void) => {
    if (!problem) return;
    setIsRunning(true);
    if (mode === 'run') {
      setOutput(null);
    }

    try {
      const res = await axios.post('http://localhost:3000/execution', {
        code,
        language: 'javascript',
        problemSlug: slug,
        mode,
      });

      if (mode === 'run') {
        setOutput(res.data);
        onSuccess?.();
      } else {
        fetchSubmissions();
        fetchSolutions();
        setOutput(res.data);
        onSuccess?.();

        if (res.data.passed) {
          MotivationManager.recordSolve();
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        toast.error('Execution timed out. Check for infinite loops.', {
          icon: React.createElement(Clock, { className: "w-4 h-4" })
        });
      } else {
        toast.error('Runtime Error. Check console for details.', {
          icon: React.createElement(XCircle, { className: "w-4 h-4" }),
          duration: 3000
        });
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
      toast.error('Failed to analyze solution', { duration: 3000 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetHint = async () => {
    if (!aiService.isConfigured()) {
      toast.error('AI is not configured. Please go to Settings.', { duration: 3000 });
      return;
    }

    setIsRequestingHint(true);
    try {
      const prompt = PROMPTS.SOLUTION_HINT
        .replace('{problemDescription}', problem?.description || '')
        .replace('{userCode}', code);

      const hint = await aiService.generateCompletion(prompt);

      toast.info('AI Hint', {
        description: hint,
        duration: 10000,
        icon: React.createElement(Lightbulb, { className: "w-4 h-4 text-yellow-400" }),
      });
    } catch (error) {
      console.error('Failed to get hint:', error);
      toast.error('Failed to get hint', { duration: 3000 });
    } finally {
      setIsRequestingHint(false);
    }
  };

  const handleCompleteCode = async (currentCode: string) => {
     if (!aiService.isConfigured()) {
        toast.error('AI is not configured. Please go to Settings.', { duration: 3000 });
        return;
    }

    setIsCompletingCode(true);
    try {
        const prompt = PROMPTS.SOLUTION_COMPLETION
            .replace('{problemDescription}', problem?.description || '')
            .replace('{userCode}', currentCode);

        const completion = await aiService.generateCompletion(prompt);
        const cleanCode = completion.replace(/```javascript\n?|```typescript\n?|```\n?|\n?```/g, '');

        setCode(cleanCode);
        toast.success('Code completed!');
    } catch (error) {
        console.error('Failed to complete code:', error);
        toast.error('Failed to complete code', { duration: 3000 });
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
      await axios.patch(`http://localhost:3000/problems/${slug}/submissions/${submissionId}/solution`, {
        isSolution: true,
        solutionName: name,
      });
      fetchSubmissions();
      fetchSolutions();
      toast.success('Solution saved!');
    } catch (err) {
      console.error('Failed to mark as solution:', err);
      toast.error('Failed to save solution');
    }
  };

  const unmarkAsSolution = async (submissionId: string) => {
    if (!slug) return;
    try {
      await axios.patch(`http://localhost:3000/problems/${slug}/submissions/${submissionId}/solution`, {
        isSolution: false,
      });
      fetchSubmissions();
      fetchSolutions();
      toast.success('Solution removed');
    } catch (err) {
      console.error('Failed to unmark as solution:', err);
      toast.error('Failed to remove solution');
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
