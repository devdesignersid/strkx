import { useEffect, useState, useRef, useCallback, Suspense, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import Editor, { type OnMount } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { Play, Loader2, CheckCircle2, XCircle, Terminal as TerminalIcon, FileText, Code2, RefreshCw, Maximize2, Minimize2, Send, Pause, RotateCcw, Settings, PanelLeftClose, PanelLeftOpen, PanelBottomClose, PanelBottomOpen, Scan, Clock, Star, TrendingUp, Zap, Lightbulb, Sparkles, BrainCircuit } from 'lucide-react';
import { aiService } from '@/lib/ai/aiService';
import { PROMPTS } from '@/lib/ai/prompts';
import { cn } from '@/lib/utils';
import * as monaco from 'monaco-editor';
import { motion } from 'framer-motion';
import { slideUp, staggerContainer, fadeIn } from '@/components/ui/DesignSystem';
import { MotivationManager } from '@/lib/MotivationManager';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  starterCode: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit?: number;
  testCases: { input: string; expectedOutput: string }[];
}

interface ExecutionResult {
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

export default function ProblemPage() {
  // ... (state remains same)
  const { slug } = useParams();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'solutions' | 'ai_analysis'>('description');
  const [isFocused, setIsFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [solutionModal, setSolutionModal] = useState<{ submissionId: string; currentName: string | null } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIConfirmation, setShowAIConfirmation] = useState(false);

  const descriptionPanelRef = useRef<ImperativePanelHandle>(null);
  const consolePanelRef = useRef<ImperativePanelHandle>(null);
  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(false);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);

  // ... (timer and editor state remain same)
  const [timeLeft, setTimeLeft] = useState(45 * 60); // Default 45 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [isCompletingCode, setIsCompletingCode] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // ... (effects remain same)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    if (slug) {
      axios.get(`http://localhost:3000/problems/${slug}`)
        .then(res => {
          setProblem(res.data);
          setCode(res.data.starterCode || '// Write your code here');
          if (res.data.timeLimit) {
            setTimeLeft(res.data.timeLimit * 60);
          }
        })
        .catch(err => console.error(err));
    }
  }, [slug]);

  const handleEditorWillMount = (monaco: typeof import('monaco-editor')) => {
    // Define VS Code Dark+ Theme
    monaco.editor.defineTheme('vscode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955' },
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'string', foreground: 'b5cea8' }, // Green strings as per image
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'class', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' }, // Yellow functions
        { token: 'variable', foreground: '9cdcfe' }, // Light blue variables
        { token: 'identifier', foreground: '9cdcfe' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2f3337',
        'editorCursor.foreground': '#d4d4d4',
        'editorWhitespace.foreground': '#404040',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      }
    });
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        quickSuggestions: autocompleteEnabled,
        suggestOnTriggerCharacters: autocompleteEnabled,
      });

    }
  }, [autocompleteEnabled]);

  useEffect(() => {
      aiService.loadFromStorage();
      setIsAIEnabled(aiService.isEnabled());
  }, []);

  const handleAIAnalyze = async () => {
    if (!aiService.isConfigured()) {
        toast.error('AI is not configured. Please go to Settings.', { duration: 3000 });
        return;
    }

    setIsAnalyzing(true);
    try {
        const prompt = PROMPTS.SOLUTION_EVALUATION
            .replace('{problemTitle}', problem?.title || '')
            .replace('{userCode}', code);

        const response = await aiService.generateCompletion(prompt);
        const jsonStr = response.replace(/```json\n?|```\n?|\n?```/g, '').trim();

        try {
            const analysis = JSON.parse(jsonStr);
            setAiAnalysis(analysis);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Raw JSON String:', jsonStr);
            toast.error('Failed to parse AI response. See console.', { duration: 3000 });
        }
    } catch (error) {
        console.error('Failed to analyze solution:', error);
        toast.error('Failed to analyze solution', { duration: 3000 });
    } finally {
        setIsAnalyzing(false);
    }
  };



  const handleRun = async (mode: 'run' | 'submit' = 'run') => {
    if (!problem) return;
    setIsRunning(true);
    if (mode === 'run') {
        setOutput(null);
        // Auto-expand console if it's collapsed
        if (isConsoleCollapsed) {
            consolePanelRef.current?.expand();
        }
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
      } else {
          // If submit, switch to submissions tab and refresh
          setActiveTab('submissions');
          fetchSubmissions();
          fetchSolutions();
          // Also show output in console for feedback
          setOutput(res.data);
          if (isConsoleCollapsed) consolePanelRef.current?.expand();

          if (res.data.passed) {
            MotivationManager.recordSolve();
          }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        toast.error('Execution timed out. Check for infinite loops.', {
          icon: <Clock className="w-4 h-4" />
        });
      } else {
        toast.error('Runtime Error. Check console for details.', {
          icon: <XCircle className="w-4 h-4" />,
          duration: 3000
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  interface Submission {
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

interface Solution {
  id: string;
  code: string;
  solutionName: string | null;
  executionTime: number | null;
  memoryUsed: number | null;
  createdAt: string;
}

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);

  const fetchSubmissions = useCallback(() => {
    if (!slug) return;
    axios.get(`http://localhost:3000/problems/${slug}/submissions`)
      .then(res => {
        setSubmissions(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch submissions:', err);
      });
  }, [slug]);

  const fetchSolutions = useCallback(() => {
    if (!slug) return;
    axios.get(`http://localhost:3000/problems/${slug}/solutions`)
      .then(res => {
        setSolutions(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch solutions:', err);
      });
  }, [slug]);

  const handleLoadSubmission = (submission: Submission) => {
    if (editorRef.current) {
        editorRef.current.setValue(submission.code);
        setCode(submission.code);
    }
  };

  const handleMarkAsSolution = async (submissionId: string, currentStatus: boolean, currentName: string | null) => {
    if (!slug) return;

    if (!currentStatus) {
      // Open custom modal
      setSolutionModal({ submissionId, currentName });
    } else {
      // Unmark as solution
      try {
        await axios.patch(`http://localhost:3000/problems/${slug}/submissions/${submissionId}/solution`, {
          isSolution: false,
        });
        fetchSubmissions();
        fetchSolutions();
      } catch (err) {
        console.error('Failed to unmark as solution:', err);
      }
    }
  };

  const confirmMarkAsSolution = async (name: string) => {
    if (!solutionModal || !slug) return;

    try {
      await axios.patch(`http://localhost:3000/problems/${slug}/submissions/${solutionModal.submissionId}/solution`, {
        isSolution: true,
        solutionName: name,
      });
      fetchSubmissions();
      fetchSolutions();
      setSolutionModal(null);
    } catch (err) {
      console.error('Failed to mark as solution:', err);
      setSolutionModal(null);
    }
  };

  useEffect(() => {
      if (activeTab === 'submissions') {
          fetchSubmissions();
      } else if (activeTab === 'solutions') {
          fetchSolutions();
      }
  }, [activeTab, fetchSubmissions, fetchSolutions]);

  const handleResetCode = () => {
    console.log('Reset Code Clicked');
    console.log('Problem:', problem);
    console.log('Editor Ref:', editorRef.current);
    if (problem?.starterCode && editorRef.current) {
      const starter = problem.starterCode;
      console.log('Resetting to:', starter);
      editorRef.current.setValue(starter);
      setCode(starter);
    } else {
        console.warn('Cannot reset code: Missing problem data or editor ref');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleDescription = () => {
      const panel = descriptionPanelRef.current;
      if (panel) {
          if (isDescriptionCollapsed) panel.expand();
          else panel.collapse();
      }
  };

  const toggleConsole = () => {
      const panel = consolePanelRef.current;
      if (panel) {
          if (isConsoleCollapsed) panel.expand();
          else panel.collapse();
      }
  };

  const toggleFocus = () => {
      const descPanel = descriptionPanelRef.current;
      const consolePanel = consolePanelRef.current;

      if (!isFocused) {
          descPanel?.collapse();
          consolePanel?.collapse();
          setIsFocused(true);
      } else {
          descPanel?.expand();
          consolePanel?.expand();
          setIsFocused(false);
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
            duration: 10000, // Show for longer
            icon: <Lightbulb className="w-4 h-4 text-yellow-400" />,
        });
    } catch (error) {
        console.error('Failed to get hint:', error);
        toast.error('Failed to get hint', { duration: 3000 });
    } finally {
        setIsRequestingHint(false);
    }
  };

  const handleCompleteCode = () => {
    if (!aiService.isConfigured()) {
        toast.error('AI is not configured. Please go to Settings.', { duration: 3000 });
        return;
    }
    setShowAIConfirmation(true);
  };

  const confirmAICompletion = async () => {
    setShowAIConfirmation(false);
    if (!editorRef.current) return;

    // Use full code context
    const currentCode = editorRef.current.getValue();

    setIsCompletingCode(true);
    try {
        const prompt = PROMPTS.SOLUTION_COMPLETION
            .replace('{problemDescription}', problem?.description || '')
            .replace('{userCode}', currentCode);

        const completion = await aiService.generateCompletion(prompt);

        // Clean up code block markers if present
        const cleanCode = completion.replace(/```javascript\n?|```typescript\n?|```\n?|\n?```/g, '');

        // Replace entire content
        editorRef.current.setValue(cleanCode);
        setCode(cleanCode);

        toast.success('Code completed!');
    } catch (error) {
        console.error('Failed to complete code:', error);
        toast.error('Failed to complete code', { duration: 3000 });
    } finally {
        setIsCompletingCode(false);
    }
  };

  const editorOptions = useMemo(() => ({
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontLigatures: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    contextmenu: true,
    quickSuggestions: autocompleteEnabled,
    suggestOnTriggerCharacters: autocompleteEnabled,
    snippetSuggestions: autocompleteEnabled ? 'inline' : 'none',
    wordBasedSuggestions: autocompleteEnabled ? 'currentDocument' : 'off',
  }), [autocompleteEnabled]);

  if (!problem) return (
    <div className="flex items-center justify-center h-full text-muted-foreground bg-background">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background text-foreground font-sans">
      {/* Toolbar / Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-10 relative">
        <div className="flex items-center space-x-6">
           <h2 className="font-semibold text-sm flex items-center gap-2 text-foreground/90 tracking-tight">
             <FileText className="w-4 h-4 text-primary" />
             {problem.title}
           </h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleRun('run')}
            disabled={isRunning}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200",
              "bg-secondary/50 text-foreground hover:bg-secondary hover:shadow-lg border border-white/5 disabled:opacity-50"
            )}
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Run
          </button>
          <button
            onClick={() => handleRun('submit')}
            disabled={isRunning}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200",
              "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] border border-primary/20 disabled:opacity-50"
            )}
          >
            <Send className="w-3.5 h-3.5" />
            Submit
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel: Description */}
          <Panel
            ref={descriptionPanelRef}
            defaultSize={35}
            minSize={20}
            collapsible
            onCollapse={() => setIsDescriptionCollapsed(true)}
            onExpand={() => setIsDescriptionCollapsed(false)}
            className="flex flex-col bg-card border-r border-border"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-2 pt-2">
              <div className="flex items-center">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'description' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'submissions' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Submissions
                </button>
                <button
                  onClick={() => setActiveTab('solutions')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'solutions' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Solutions
                </button>
                {isAIEnabled && (
                    <button
                    onClick={() => setActiveTab('ai_analysis')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'ai_analysis' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                    AI Analysis
                    </button>
                )}
              </div>
              <button
                onClick={toggleDescription}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
                title="Collapse Description"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 prose-headings:text-foreground/90 prose-p:text-muted-foreground prose-a:text-primary prose-code:text-primary/90 prose-code:text-[13px] prose-code:font-medium">
              {activeTab === 'description' && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{problem.description || 'No description available.'}</ReactMarkdown>
                </motion.div>
              )}

              {activeTab === 'submissions' && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-2 -m-6 p-4"
                >
                  {submissions.length === 0 ? (
                    <EmptyState
                      icon={Code2}
                      title="No submissions yet"
                      description="Run your code to see your history here."
                      action={{
                        label: "Run Code",
                        onClick: () => handleRun('run')
                      }}
                      className="py-12"
                    />
                  ) : (
                    submissions.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => handleLoadSubmission(sub)}
                        className="p-3 rounded-md bg-card border border-border hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {sub.status === 'ACCEPTED' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            )}
                            <span className={`text-xs font-medium ${sub.status === 'ACCEPTED' ? 'text-green-500' : 'text-red-500'}`}>
                              {sub.status === 'ACCEPTED' ? 'Accepted' : 'Wrong Answer'}
                            </span>
                            {sub.isSolution && (
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                            {sub.isSolution && sub.solutionName && (
                              <span className="text-xs text-amber-400 ml-1">• {sub.solutionName}</span>
                            )}
                          </div>
                          {sub.status === 'ACCEPTED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsSolution(sub.id, sub.isSolution, sub.solutionName);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                            >
                              {sub.isSolution ? 'Unmark' : 'Save as Solution'}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(sub.createdAt).toLocaleTimeString()}
                          </div>

                          {(sub.executionTime != null || sub.memoryUsed != null) && (
                            <div className="flex items-center gap-3">
                              {sub.executionTime != null && (
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span>{sub.executionTime.toFixed(1)}ms</span>
                                  {sub.timePercentile != null && sub.timePercentile < 50 && (
                                    <span className="text-green-400">↑{100 - sub.timePercentile}%</span>
                                  )}
                                </div>
                              )}
                              {sub.memoryUsed != null && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-blue-400" />
                                  <span>{(sub.memoryUsed / 1024).toFixed(1)}KB</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === 'solutions' && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-2 -m-6 p-4"
                >
                  {solutions.length === 0 ? (
                    <EmptyState
                      icon={Star}
                      title="No solutions yet"
                      description="Mark accepted submissions as solutions to save them here."
                      className="py-12"
                    />
                  ) : (
                    solutions.map((sol) => (
                      <div
                        key={sol.id}
                        onClick={() => {
                            if (editorRef.current) {
                                editorRef.current.setValue(sol.code);
                                setCode(sol.code);
                            }
                        }}
                        className="p-3 rounded-md bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 hover:from-amber-500/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="text-xs font-semibold text-amber-400">
                              {sol.solutionName || 'Solution'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(sol.createdAt).toLocaleTimeString()}
                          </div>
                        </div>

                        {(sol.executionTime != null || sol.memoryUsed != null) && (
                          <div className="flex items-center gap-3 text-[10px]">
                            {sol.executionTime != null && (
                              <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-400" />
                                <span className="text-foreground">{sol.executionTime.toFixed(1)}ms</span>
                              </div>
                            )}
                            {sol.memoryUsed != null && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-blue-400" />
                                <span className="text-foreground">{(sol.memoryUsed / 1024).toFixed(1)}KB</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === 'ai_analysis' && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                    {!aiAnalysis && !isAnalyzing ? (
                        <EmptyState
                            icon={BrainCircuit}
                            title="AI Solution Analysis"
                            description="Get detailed feedback on your solution's time complexity, space complexity, and code quality."
                            action={{
                                label: "Analyze My Code",
                                onClick: handleAIAnalyze
                            }}
                            className="py-12"
                        />
                    ) : isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                            <p className="text-muted-foreground">Analyzing your solution...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-card border border-border">
                                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Time Complexity</h4>
                                    <p className="text-lg font-mono text-foreground">{aiAnalysis.timeComplexity}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-card border border-border">
                                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Space Complexity</h4>
                                    <p className="text-lg font-mono text-foreground">{aiAnalysis.spaceComplexity}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-card border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-foreground">Analysis Score</h3>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-sm font-bold",
                                        aiAnalysis.score >= 8 ? "bg-green-500/10 text-green-500" :
                                        aiAnalysis.score >= 5 ? "bg-yellow-500/10 text-yellow-500" :
                                        "bg-red-500/10 text-red-500"
                                    )}>
                                        {aiAnalysis.score}/10
                                    </div>
                                </div>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnalysis.feedback}</ReactMarkdown>
                                </div>
                            </div>

                            {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-foreground">Suggestions</h3>
                                    <ul className="space-y-2">
                                        {aiAnalysis.suggestions.map((suggestion: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">
                                                <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                                <span>{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={handleAIAnalyze}
                                className="w-full py-2 rounded-md border border-border hover:bg-secondary/50 transition-colors text-sm font-medium text-muted-foreground"
                            >
                                Re-analyze
                            </button>
                        </div>
                    )}
                </motion.div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-transparent hover:bg-primary/20 transition-colors" />

          {/* Right Panel: Editor & Console */}
          <Panel defaultSize={65} minSize={30} collapsible>
            <PanelGroup direction="vertical" className="h-full">
              {/* Editor */}
              <Panel defaultSize={70} minSize={20} collapsible className="flex flex-col bg-[#1e1e1e] relative group overflow-hidden">
                 <div className="h-10 min-h-[2.5rem] shrink-0 border-b border-white/5 bg-[#252526] flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        {isDescriptionCollapsed && (
                            <button
                                onClick={toggleDescription}
                                className="p-1.5 -ml-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
                                title="Expand Description"
                            >
                                <PanelLeftOpen className="w-4 h-4" />
                            </button>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                          <Code2 className="w-3.5 h-3.5" />
                          JavaScript
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                       {/* Timer Controls */}
                       <div className={cn(
                         "flex items-center gap-2 rounded-full px-1 py-0.5 border border-white/5 transition-colors",
                         timeLeft < 300 ? "bg-red-500/10 border-red-500/20" : "bg-white/5"
                       )}>
                         <div className={cn(
                           "flex items-center gap-2 px-2 text-[10px] font-mono min-w-[50px] justify-center",
                           timeLeft < 300 ? "text-red-400" : "text-muted-foreground"
                         )}>
                           {formatTime(timeLeft)}
                         </div>
                         <div className="flex items-center gap-1 border-l border-white/5 pl-1">
                            <button
                              onClick={toggleTimer}
                              className="p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
                              title={isTimerRunning ? "Pause" : "Start"}
                            >
                              {isTimerRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                            </button>
                            <button
                              onClick={resetTimer}
                              className="p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Reset Timer"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                         </div>
                       </div>

                       {isAIEnabled && (
                           <div className="flex items-center gap-1 border-l border-white/5 pl-1">
                              <button
                                onClick={handleGetHint}
                                disabled={isRequestingHint}
                                className="p-1.5 hover:bg-white/5 rounded text-muted-foreground hover:text-yellow-400 transition-colors"
                                title="Get AI Hint"
                              >
                                {isRequestingHint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={handleCompleteCode}
                                disabled={isCompletingCode}
                                className="p-1.5 hover:bg-white/5 rounded text-muted-foreground hover:text-purple-400 transition-colors"
                                title="AI Complete Code"
                              >
                                {isCompletingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              </button>
                           </div>
                       )}

                      <button
                        onClick={() => setAutocompleteEnabled(!autocompleteEnabled)}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors border border-transparent",
                          autocompleteEnabled
                            ? "text-primary bg-primary/10 border-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                        title="Toggle Autocomplete"
                      >
                        <Settings className="w-3 h-3" />
                        {autocompleteEnabled ? 'Auto: On' : 'Auto: Off'}
                      </button>
                      <div className="w-px h-3 bg-white/10 mx-1" />
                      <button
                        onClick={handleResetCode}
                        className="p-1.5 hover:bg-white/5 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Reset Code"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={toggleFocus}
                        className={cn(
                          "p-1.5 hover:bg-white/5 rounded text-muted-foreground hover:text-foreground transition-colors",
                          isFocused && "text-primary bg-primary/10 hover:bg-primary/20"
                        )}
                        title={isFocused ? "Exit Focus Mode" : "Focus Mode"}
                      >
                        {isFocused ? <Minimize2 className="w-3.5 h-3.5" /> : <Scan className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={toggleFullscreen}
                        className="p-1.5 hover:bg-white/5 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Toggle Fullscreen"
                      >
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                      </button>
                      {isConsoleCollapsed && (
                        <>
                            <div className="w-px h-3 bg-white/10 mx-1" />
                            <button
                                onClick={toggleConsole}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
                                title="Expand Console"
                            >
                                <PanelBottomOpen className="w-3.5 h-3.5" />
                            </button>
                        </>
                      )}
                    </div>
                 </div>
                 <div className="flex-1 pt-2 relative min-h-0">
                    <Suspense fallback={
                      <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading Editor...
                      </div>
                    }>
                      <Editor
                        key={slug} // Force re-mount on problem change
                        height="100%"
                        defaultLanguage="javascript"
                        theme="vscode-dark"
                        defaultValue={problem.starterCode || '// Write your code here'}
                        onChange={(value) => setCode(value || '')}
                        beforeMount={handleEditorWillMount}
                        onMount={handleEditorDidMount}
                        options={editorOptions}
                      />
                    </Suspense>
                 </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-transparent hover:bg-primary/20 transition-colors" />

              {/* Console */}
              <Panel
                ref={consolePanelRef}
                defaultSize={30}
                minSize={10}
                collapsible
                onCollapse={() => setIsConsoleCollapsed(true)}
                onExpand={() => setIsConsoleCollapsed(false)}
                className="flex flex-col bg-card border-t border-border"
              >
                <div className="h-10 border-b border-border bg-secondary flex items-center px-4 justify-between shrink-0">
                  <span className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                    <TerminalIcon className="w-3.5 h-3.5" />
                    Console
                  </span>
                  <div className="flex items-center gap-2">
                      {output && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full border",
                            output.passed
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          )}
                        >
                          {output.passed ? "Accepted" : "Wrong Answer"}
                        </motion.span>
                      )}
                      <button
                        onClick={toggleConsole}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
                        title="Collapse Console"
                      >
                        <PanelBottomClose className="w-4 h-4" />
                      </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                  {output ? (
                    <motion.div
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      className="space-y-6"
                    >
                      {output.results.map((result, i) => (
                        <motion.div
                          key={i}
                          variants={slideUp}
                          className="group"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            {result.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm font-medium text-foreground">Test Case {i + 1}</span>
                          </div>

                          <div className="ml-6 space-y-3 pl-3 border-l border-white/5">
                            <div className="grid grid-cols-1 gap-1">
                              <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">Input</span>
                              <div className="bg-secondary/20 p-2.5 rounded-md border border-border/50 text-foreground/90 font-mono text-[11px]">
                                {result.input}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid grid-cols-1 gap-1">
                                <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">Expected</span>
                                <div className="bg-secondary/20 p-2.5 rounded-md border border-border/50 text-foreground/90 font-mono text-[11px]">
                                  {result.expectedOutput}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-1">
                                <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">Received</span>
                                <div className={cn(
                                  "p-2.5 rounded-md border font-mono text-[11px]",
                                  result.passed
                                    ? "bg-secondary/20 border-border/50 text-foreground/90"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                )}>
                                  {result.actualOutput ?? "undefined"}
                                </div>
                              </div>
                            </div>

                            {result.logs && result.logs.length > 0 && (
                              <div className="grid grid-cols-1 gap-1 mt-2">
                                <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">Logs</span>
                                <div className="bg-secondary/20 p-2.5 rounded-md border border-border/50 text-muted-foreground whitespace-pre-wrap font-mono text-[11px]">
                                  {result.logs.join('\n')}
                                </div>
                              </div>
                            )}

                            {result.error && (
                              <div className="grid grid-cols-1 gap-1">
                                <span className="text-red-500 uppercase tracking-wider text-[10px] font-semibold">Error</span>
                                <div className="bg-red-500/10 text-red-400 p-2.5 rounded-md border border-red-500/20 font-mono text-[11px]">
                                  {result.error}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                      <TerminalIcon className="w-12 h-12 mb-4 opacity-10" />
                      <p>Run your code to see execution results</p>
                    </div>
                  )}
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* AI Completion Confirmation Modal */}
      {showAIConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAIConfirmation(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-white/10 rounded-lg shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">AI Code Completion</h3>
                <p className="text-sm text-muted-foreground">
                  This will replace your current code with a complete solution generated by AI.
                  <br /><br />
                  <span className="text-yellow-400/90 text-xs">Warning: Any unsaved changes will be lost.</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAIConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAICompletion}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Generate Solution
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Solution Naming Modal */}
      {solutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSolutionModal(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-white/10 rounded-lg shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">Save as Solution</h3>
                <p className="text-sm text-muted-foreground">
                  Give this solution a memorable name
                </p>
              </div>
            </div>
            <input
              id="solution-name-input"
              type="text"
              autoFocus
              defaultValue={solutionModal?.currentName || 'Optimized Solution'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmMarkAsSolution((e.target as HTMLInputElement).value);
                } else if (e.key === 'Escape') {
                  setSolutionModal(null);
                }
              }}
              className="w-full bg-secondary/30 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors mb-4"
              placeholder="E.g. Hash Map Approach, Two Pointer Solution"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSolutionModal(null)}
                className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('solution-name-input') as HTMLInputElement;
                  confirmMarkAsSolution(input?.value || 'Solution');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
