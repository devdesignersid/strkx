import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Clock, Loader2, Send } from 'lucide-react';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { cn } from '@/lib/utils';
import * as monaco from 'monaco-editor';
import { API_URL } from '@/config';

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  starterCode: string;
  difficulty: string;
  testCases: any[];
}

interface Question {
  id: string;
  problemId: string;
  orderIndex: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  problem: Problem;
  startTime: string | null;
  endTime: string | null;
}

interface Session {
  id: string;
  userId: string;
  status: string;
  questions: Question[];
  questionCount: number;
}

const MockInterviewSession: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [code, setCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60); // 20 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const mounted = useRef(true);
  const isFinished = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // If unmounting and not finished/completed, abandon session
      if (!isFinished.current && session?.status !== 'COMPLETED' && session?.status !== 'ABANDONED') {
         // Use sendBeacon for reliability during unload/navigation
         const url = `${API_URL}/interview-sessions/${sessionId}/abandon`;
         navigator.sendBeacon(url);
      }
    };
  }, [session, sessionId]);

  // Handle Browser Refresh/Close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session && session.status !== 'COMPLETED' && session.status !== 'ABANDONED' && !isFinished.current) {
        // Trigger browser warning
        e.preventDefault();
        e.returnValue = '';

        // Attempt to abandon immediately
        const url = `${API_URL}/interview-sessions/${sessionId}/abandon`;
        navigator.sendBeacon(url);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session, sessionId]);

  // Fetch Session
  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API_URL}/interview-sessions/${sessionId}`, { credentials: 'include' })
      .then(res => res.json())
      .then((data: Session) => {
        if (!mounted.current) return;
        setSession(data);
        // Find first non-completed question
        const activeIndex = data.questions.findIndex(q => q.status === 'IN_PROGRESS' || q.status === 'PENDING');
        if (activeIndex !== -1) {
          setCurrentQuestionIndex(activeIndex);
          // If IN_PROGRESS, calculate remaining time
          if (data.questions[activeIndex].status === 'IN_PROGRESS' && data.questions[activeIndex].startTime) {
             const start = new Date(data.questions[activeIndex].startTime!).getTime();
             const now = Date.now();
             const elapsed = Math.floor((now - start) / 1000);
             const remaining = (20 * 60) - elapsed;
             setTimeLeft(remaining > 0 ? remaining : 0);
          }
        } else if (data.status === 'COMPLETED') {
            isFinished.current = true; // Mark as finished so we don't abandon
            navigate(`/mock-interview/session/${sessionId}/summary`);
        }
      })
      .catch(err => {
        if (!mounted.current) return;
        console.error(err);
        toast.error(TOAST_MESSAGES.INTERVIEW.LOAD_FAILED);
      });
  }, [sessionId, navigate]);

  // Update code when question changes
  useEffect(() => {
    if (session && session.questions[currentQuestionIndex]) {
      const question = session.questions[currentQuestionIndex];
      // If we have saved code (not implemented yet in backend for partial saves, but good to have), use it.
      // For now, use starter code.
      setCode(question.problem.starterCode || '// Write your solution here');
      if (editorRef.current) {
          editorRef.current.setValue(question.problem.starterCode || '// Write your solution here');
      }
    }
  }, [session, currentQuestionIndex]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft <= 0 && session) {
        // Auto-submit
        handleSubmit(true);
        return;
    }

    const interval = setInterval(() => {
      if (mounted.current) {
        setTimeLeft((prev) => prev - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, session]); // Depend on session to ensure we don't submit before load

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    // Define theme similar to ProblemPage
    monaco.editor.defineTheme('vscode-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: { 'editor.background': '#1e1e1e' }
    });
  };

  const handleSubmit = async (auto = false) => {
    if (isSubmitting || !session) return;
    setIsSubmitting(true);

    const question = session.questions[currentQuestionIndex];

    try {
        // 1. Run Tests (Mock execution for now, or call execution service)
        // Ideally we call the execution service first to get the result.
        // For strict interview mode, maybe we just submit whatever they have?
        // But user wants "Result (passed tests / failed)".
        // So let's run the code against test cases.

        let status = 'WRONG_ANSWER';
        let outputLog = '';

        try {
            const execRes = await fetch(`${API_URL}/execution`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    code,
                    language: 'javascript',
                    problemSlug: question.problem.slug,
                    mode: 'submit'
                })
            });
            const execData = await execRes.json();
            status = execData.passed ? 'ACCEPTED' : 'WRONG_ANSWER';
            outputLog = JSON.stringify(execData.results);
        } catch (e) {
            console.error('Execution failed', e);
            status = 'RUNTIME_ERROR';
        }

        if (!mounted.current) return;

        // 2. Submit to Interview Session
        const res = await fetch(`${API_URL}/interview-sessions/${sessionId}/questions/${question.id}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                code,
                language: 'javascript',
                status,
                output: outputLog,
                autoSubmitted: auto
            })
        });

        if (!res.ok) throw new Error('Submission failed');

        const data = await res.json();

        if (!mounted.current) return;

        if (data.nextQuestionId) {
            // Move to next question
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeLeft(20 * 60);
            toast.success(TOAST_MESSAGES.INTERVIEW.SUBMITTED_NEXT);
        } else {
            // Finish
            isFinished.current = true; // Mark as explicitly finished
            navigate(`/mock-interview/session/${sessionId}/summary`);
        }

    } catch (error) {
        if (mounted.current) {
            console.error(error);
            toast.error(TOAST_MESSAGES.INTERVIEW.SUBMIT_FAILED);
        }
    } finally {
        if (mounted.current) {
            setIsSubmitting(false);
        }
    }
  };

  if (!session) return <div className="flex items-center justify-center h-screen bg-background text-foreground"><Loader2 className="animate-spin" /></div>;

  const currentQuestion = session.questions[currentQuestionIndex];
  if (!currentQuestion) return <div>Error: Question not found</div>;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-md border border-primary/20 font-medium tracking-wide">
                MOCK INTERVIEW
            </span>
            <span className="text-sm text-muted-foreground">
                Question <span className="text-foreground font-medium">{currentQuestionIndex + 1}</span> of {session.questionCount}
            </span>
        </div>

        <div className={cn(
            "flex items-center gap-2 font-mono text-xl font-bold transition-colors",
            timeLeft < 60 ? "text-red-500 animate-pulse" : "text-foreground"
        )}>
            <Clock className="w-5 h-5" />
            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>

        <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit & Next
        </button>
      </header>

      {/* Main Content */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Description */}
        <Panel defaultSize={40} minSize={20} className="border-r border-border bg-card/30">
            <div className="h-full overflow-y-auto p-6 prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-pre:bg-secondary/50 prose-pre:border prose-pre:border-white/5">
                <h1 className="text-2xl font-bold mb-4 tracking-tight">{currentQuestion.problem.title}</h1>
                <div className="flex gap-2 mb-6">
                    <span className={cn(
                        "px-2.5 py-0.5 rounded-md text-xs font-medium border",
                        currentQuestion.problem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        currentQuestion.problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                    )}>
                        {currentQuestion.problem.difficulty}
                    </span>
                </div>
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                    {currentQuestion.problem.description}
                </ReactMarkdown>
            </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors transition-all duration-300" />

        {/* Editor */}
        <Panel defaultSize={60} minSize={30} className="bg-[#1e1e1e]">
            <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vscode-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'JetBrains Mono', monospace",
                    quickSuggestions: false, // DISABLE AUTOCOMPLETE
                    suggestOnTriggerCharacters: false, // DISABLE AUTOCOMPLETE
                    parameterHints: { enabled: false }, // DISABLE HINTS
                    hover: { enabled: false }, // DISABLE HOVER
                    padding: { top: 20, bottom: 20 },
                }}
            />
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default MockInterviewSession;
