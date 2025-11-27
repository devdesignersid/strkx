import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import Editor, { type OnMount } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { Play, Loader2, CheckCircle2, XCircle, Terminal as TerminalIcon, FileText, Code2, RefreshCw, Maximize2, Minimize2, Send, Pause, RotateCcw, Settings, PanelLeftClose, PanelLeftOpen, PanelBottomClose, PanelBottomOpen, Scan, Clock, Star, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as monaco from 'monaco-editor';
import { motion } from 'framer-motion';
import remarkGfm from 'remark-gfm';

// ... (interfaces remain same)

export default function ProblemPage() {
  // ... (state remains same)
  const { slug } = useParams();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'solutions'>('description');
  const [isFocused, setIsFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [solutionModal, setSolutionModal] = useState<{ submissionId: string; currentName: string | null } | null>(null);

  const descriptionPanelRef = useRef<ImperativePanelHandle>(null);
  const consolePanelRef = useRef<ImperativePanelHandle>(null);
  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(false);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);

  // ... (timer and editor state remain same)
  const [timeLeft, setTimeLeft] = useState(45 * 60); // Default 45 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
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
      }
    } catch (err) {
      console.error(err);
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
    setCode(submission.code);
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
    if (problem?.starterCode) {
      setCode(problem.starterCode);
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
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.description || 'No description available.'}</ReactMarkdown>
              )}

              {activeTab === 'submissions' && (
                <div className="space-y-2 -m-6 p-4">
                  {submissions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No submissions yet. Click Submit to create one!
                    </div>
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
                </div>
              )}

              {activeTab === 'solutions' && (
                <div className="space-y-2 -m-6 p-4">
                  {solutions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Star className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No solutions yet</p>
                      <p className="text-xs mt-1 opacity-70">Mark accepted submissions as solutions!</p>
                    </div>
                  ) : (
                    solutions.map((sol) => (
                      <div
                        key={sol.id}
                        onClick={() => setCode(sol.code)}
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
                </div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-transparent hover:bg-primary/20 transition-colors" />

          {/* Right Panel: Editor & Console */}
          <Panel defaultSize={65} minSize={30} collapsible>
            <PanelGroup direction="vertical">
              {/* Editor */}
              <Panel defaultSize={70} minSize={20} collapsible className="flex flex-col bg-[#1e1e1e] relative group">
                 <div className="h-10 border-b border-white/5 bg-[#252526] flex items-center justify-between px-4">
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
                 <div className="flex-1 pt-2 relative">
                    <Suspense fallback={
                      <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading Editor...
                      </div>
                    }>
                      <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        theme="vscode-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        beforeMount={handleEditorWillMount}
                        onMount={handleEditorDidMount}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
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
                        }}
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
                    <div className="space-y-6">
                      {output.results.map((result, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
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
                              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Input</span>
                              <div className="bg-black/30 p-2 rounded border border-white/5 text-foreground/90">
                                {result.input}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid grid-cols-1 gap-1">
                                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Expected</span>
                                <div className="bg-black/30 p-2 rounded border border-white/5 text-foreground/90">
                                  {result.expectedOutput}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-1">
                                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Received</span>
                                <div className={cn(
                                  "p-2 rounded border border-white/5",
                                  result.passed ? "bg-black/30 text-foreground/90" : "bg-red-500/5 text-red-400 border-red-500/10"
                                )}>
                                  {result.actualOutput ?? "undefined"}
                                </div>
                              </div>
                            </div>

                            {result.logs && result.logs.length > 0 && (
                              <div className="grid grid-cols-1 gap-1 mt-2">
                                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Logs</span>
                                <div className="bg-black/50 p-2 rounded border border-white/5 text-muted-foreground whitespace-pre-wrap">
                                  {result.logs.join('\n')}
                                </div>
                              </div>
                            )}

                            {result.error && (
                              <div className="grid grid-cols-1 gap-1">
                                <span className="text-red-500 uppercase tracking-wider text-[10px]">Error</span>
                                <div className="bg-red-500/5 text-red-400 p-2 rounded border border-red-500/10">
                                  {result.error}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
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
              defaultValue={solutionModal.currentName || 'Optimized Solution'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmMarkAsSolution((e.target as HTMLInputElement).value);
                } else if (e.key === 'Escape') {
                  setSolutionModal(null);
                }
              }}
              className="w-full bg-secondary/30 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors mb-4"
              placeholder="e.g., Hash Map Approach, Two Pointer Solution"
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
