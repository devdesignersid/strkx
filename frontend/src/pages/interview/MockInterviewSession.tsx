import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type OnMount } from '@monaco-editor/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { sounds } from '@/lib/sounds';
import * as monaco from 'monaco-editor';
import { ProblemDescription } from '@/features/problem/components/ProblemDescription';
import { CodeEditor } from '@/features/problem/components/CodeEditor';
import { MockInterviewHeader } from './MockInterviewHeader';
import type { Problem } from '@/types/problem';
import { Modal, Button, LoadingThunder } from '@/design-system/components';
import { interviewService } from '@/services/api/interview.service';
import { executionService } from '@/services/api/execution.service';

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

  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const descriptionPanelRef = useRef<any>(null);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const mounted = useRef(true);
  const isFinished = useRef(false);
  const isEditorChange = useRef(false);
  const submissionInProgress = useRef(false); // Prevent double-click race condition
  const submittingQuestionId = useRef<string | null>(null); // Track which question is being submitted to prevent stale closure re-submissions
  const sessionRef = useRef<Session | null>(null); // Track latest session state for cleanup

  // Update sessionRef whenever session changes
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const abandonSession = useCallback(() => {
    const currentSession = sessionRef.current;
    if (sessionId && !isFinished.current && currentSession && currentSession.status !== 'COMPLETED' && currentSession.status !== 'ABANDONED') {
      interviewService.abandonSession(sessionId).catch(err => console.error('Failed to abandon session:', err));
    }
  }, [sessionId]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      /**
       * PERFORMANCE: Dispose Monaco editor instance to prevent memory leak.
       * Monaco editors can retain 10-20MB of memory if not disposed.
       * Critical for interview sessions where users may abandon mid-session.
       */
      editorRef.current?.dispose();
      // If unmounting and not finished/completed, abandon session
      abandonSession();
    };
  }, [abandonSession]);

  // Handle Browser Refresh/Close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionId && session && session.status !== 'COMPLETED' && session.status !== 'ABANDONED' && !isFinished.current) {
        // Trigger browser warning
        e.preventDefault();
        e.returnValue = '';

        // Attempt to abandon immediately
        interviewService.abandonSession(sessionId).catch(() => {
          // Ignore errors during cleanup
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session, sessionId, abandonSession]);

  // Fetch Session
  useEffect(() => {
    if (!sessionId) return;

    interviewService.getSession(sessionId)
      .then((response) => {
        if (!mounted.current) return;

        // Backend wraps response in a "data" object via TransformInterceptor
        const data: Session = response.data || response;

        // Validate session data
        if (!data || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          console.error('Invalid session data:', response);
          toast.error({
            title: 'Invalid Session',
            description: 'The session data is incomplete. Please try creating a new interview session.'
          });
          navigate('/mock-interview');
          return;
        }

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
        } else if (data.status === 'COMPLETED' || data.questions.every(q => q.status === 'COMPLETED')) {
          isFinished.current = true; // Mark as finished so we don't abandon
          navigate(`/mock-interview/session/${sessionId}/summary`, { replace: true });
          return; // Don't set session state
        }
      })
      .catch(err => {
        if (!mounted.current) return;
        console.error(err);
        toast.error(TOAST_MESSAGES.INTERVIEW.LOAD_FAILED);
        navigate('/mock-interview');
      });
  }, [sessionId, navigate]);

  // Update code when question changes
  useEffect(() => {
    if (session && session.questions[currentQuestionIndex]) {
      const question = session.questions[currentQuestionIndex];
      const starterCode = question.problem.starterCode || '// Write your solution here';
      // Mark as programmatic change to prevent cursor jumping
      isEditorChange.current = false;
      setCode(starterCode);
      if (editorRef.current) {
        editorRef.current.setValue(starterCode);
      }
    }
  }, [session, currentQuestionIndex]);

  // When code changes externally, update the editor (prevents cursor jumping)
  useEffect(() => {
    if (editorRef.current && code !== undefined && !isEditorChange.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== code) {
        editorRef.current.setValue(code);
      }
    }
    isEditorChange.current = false;
  }, [code]);

  const toggleDescription = () => {
    const panel = descriptionPanelRef.current;
    if (panel) {
      if (isDescriptionCollapsed) panel.expand();
      else panel.collapse();
    }
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    // Abandon the session and navigate away
    abandonSession();
    setShowExitModal(false);
    navigate('/mock-interview'); // Navigate back to setup page
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
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

  const toggleFocusMode = () => {
    const newFocusMode = !isFocusMode;
    setIsFocusMode(newFocusMode);

    const descPanel = descriptionPanelRef.current;

    if (newFocusMode) {
      descPanel?.collapse();
    } else {
      descPanel?.expand();
    }
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleSubmit = useCallback(async (auto = false) => {
    // Double-click prevention using ref (faster than state)
    if (submissionInProgress.current || isSubmitting || !session) {
      return;
    }

    const question = session.questions[currentQuestionIndex];

    // Prevent submitting the same question twice (stale closure protection)
    if (submittingQuestionId.current === question.id) {
      return;
    }

    // Prevent submissions on completed sessions
    if (session.status === 'COMPLETED') {
      isFinished.current = true;
      navigate(`/mock-interview/session/${sessionId}/summary`);
      return;
    }

    // CRITICAL: Read code directly from editor ref to avoid stale React state
    // This fixes the empty code submission bug when using cmd+enter
    const currentCode = editorRef.current?.getValue() || code;

    if (!currentCode || currentCode.trim() === '' || currentCode.trim() === '// Write your solution here') {
      toast.error({
        title: 'Empty Code',
        description: 'Please write some code before submitting.'
      });
      return;
    }

    submissionInProgress.current = true; // Set lock immediately
    submittingQuestionId.current = question.id; // Mark this question as being submitted
    setIsSubmitting(true);

    try {
      // 1. Run Tests (Mock execution for now, or call execution service)
      // Ideally we call the execution service first to get the result.
      // For strict interview mode, maybe we just submit whatever they have?
      // But user wants "Result (passed tests / failed)".
      // So let's run the code against test cases.

      let status = 'WRONG_ANSWER';
      let outputLog = '';

      try {
        const execData = await executionService.run({
          code: currentCode,
          language: 'javascript',
          problemSlug: question.problem.slug,
          mode: 'submit'
        });

        // Backend wraps response in a "data" object via TransformInterceptor
        const resultData = execData.data || execData;
        status = resultData.passed ? 'ACCEPTED' : 'WRONG_ANSWER';
        outputLog = JSON.stringify(resultData.results);

        // Play sound based on test results
        if (resultData.passed) {
          sounds.playSuccess();
        } else {
          sounds.playFailure();
        }

      } catch (e) {
        console.error('Execution failed', e);
        status = 'RUNTIME_ERROR';
        sounds.playFailure();
      }

      if (!mounted.current) return;

      // 2. Submit to Interview Session
      const submitPayload = {
        code: currentCode,
        language: 'javascript',
        timeSpent: 20 * 60 - timeLeft, // Calculate time spent
        status, // Pass the status from execution
        output: outputLog,
        autoSubmitted: auto // Use the auto parameter correctly
      };

      // Note: interviewService.submitAnswer signature might need adjustment if we pass extra fields like status/output
      // The interface defined earlier was: submitAnswer: async (sessionId: string, questionId: string, data: SubmitAnswerData)
      // SubmitAnswerData was: { code: string; language: string; timeSpent: number; }
      // We are passing more data here. I should update the interface in interview.service.ts or cast here.
      // Let's cast for now or assume the service passes it through.

      const response = await interviewService.submitAnswer(sessionId!, question.id, submitPayload as any);

      // Backend wraps response in a "data" object via TransformInterceptor
      const data = response.data || response;

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

    } catch (error: any) {
      if (mounted.current) {
        console.error(error);

        // Check if it's a "question already completed" error (duplicate submission in same session)
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already completed')) {
          // Question was already submitted in this session, just proceed
          // Check if there's a next question
          if (currentQuestionIndex === session.questionCount - 1) {
            isFinished.current = true;
            navigate(`/mock-interview/session/${sessionId}/summary`);
          } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeLeft(20 * 60);
          }
          return;
        }

        toast.error(TOAST_MESSAGES.INTERVIEW.SUBMIT_FAILED);
      }
    } finally {
      if (mounted.current) {
        setIsSubmitting(false);
        submissionInProgress.current = false; // Release lock
      }
    }
  }, [session, sessionId, currentQuestionIndex, code, isSubmitting, navigate, timeLeft]);

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

    // CRITICAL: cleanup to prevent memory leak
    return () => clearInterval(interval);
  }, [timeLeft, session, handleSubmit]); // Depend on session to ensure we don't submit before load

  // Don't render if session is completed
  if (session?.status === 'COMPLETED') {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center">
          <LoadingThunder className="mx-auto mb-4" size="lg" />
          <p>Redirecting to summary...</p>
        </div>
      </div>
    );
  }

  if (!session) return <div className="flex items-center justify-center h-screen bg-background text-foreground"><LoadingThunder size="lg" /></div>;

  const currentQuestion = session.questions[currentQuestionIndex];
  if (!currentQuestion) return <div>Error: Question not found</div>;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-hidden font-sans">
      {/* Header */}
      <MockInterviewHeader
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={session.questionCount}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        isDescriptionCollapsed={isDescriptionCollapsed}
        onToggleDescription={toggleDescription}
        onExit={handleExit}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel: Description */}
          <Panel
            ref={descriptionPanelRef}
            defaultSize={40}
            minSize={20}
            collapsible
            onCollapse={() => setIsDescriptionCollapsed(true)}
            onExpand={() => setIsDescriptionCollapsed(false)}
            className="flex flex-col bg-card border-r border-border"
          >
            <ProblemDescription
              problem={currentQuestion.problem}
              submissions={[]} // No history needed for mock interview
              solutions={[]}
              aiAnalysis={null}
              isAnalyzing={false}
              isAIEnabled={false} // Disable AI features in mock interview
              onAnalyze={() => { }}
              onLoadSubmission={() => { }}
              onMarkAsSolution={() => { }}
              onDeleteSubmission={() => { }}
              onLoadSolution={() => { }}
              onCollapse={toggleDescription}
              hiddenTabs={['solutions', 'ai_analysis', 'submissions']} // Hide unnecessary tabs
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Right Panel: Editor */}
          <Panel minSize={30} className="flex flex-col overflow-hidden">
            <CodeEditor
              code={code}
              onChange={(val) => {
                isEditorChange.current = true;
                setCode(val || '');
              }}
              onMount={handleEditorDidMount}
              isTimerRunning={true} // Timer always running
              timeLeft={timeLeft}
              onToggleTimer={() => { }} // Read-only
              onResetTimer={() => { }} // Read-only
              onResetCode={() => setCode(currentQuestion.problem.starterCode)}
              onGetHint={() => { }}
              onCompleteCode={() => { }}
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              isRequestingHint={false}
              isCompletingCode={false}
              autocompleteEnabled={false} // Disable autocomplete
              onToggleAutocomplete={() => { }}
              isAIEnabled={false}
              formatTime={(seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
              }}
              isFocusMode={isFocusMode}
              onToggleFocusMode={toggleFocusMode}
              onRun={() => handleSubmit(false)} // Run = Submit in interview? Or maybe separate run? For now map to submit.
              timerReadOnly={true}
              hideAI={true}
              hideAutocomplete={true}
              hideDividers={true}
            />
          </Panel>
        </PanelGroup>
      </div>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={handleCancelExit}
        title="Exit Interview?"
        description="If you exit now, your interview session will be marked as FAILED. Are you sure you want to proceed?"
        footer={
          <>
            <Button variant="outline" onClick={handleCancelExit}>
              Stay
            </Button>
            <Button variant="destructive" onClick={handleConfirmExit}>
              Leave & Fail
            </Button>
          </>
        }
      />
    </div>
  );
};

export default MockInterviewSession;
