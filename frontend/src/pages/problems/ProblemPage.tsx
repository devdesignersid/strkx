import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { LoadingThunder } from '@/design-system/components';
import { aiService } from '@/lib/ai/aiService';

import { useProblemPage } from '@/hooks/useProblemPage';
import { ProblemHeader } from '@/features/problem/components/ProblemHeader';
import { ProblemDescription } from '@/features/problem/components/ProblemDescription';
import { CodeEditor } from '@/features/problem/components/CodeEditor';
import { ConsolePanel } from '@/features/problem/components/ConsolePanel';
import { SolutionModal } from '@/features/problem/components/SolutionModal';
import { Scratchpad } from '@/features/problem/components/Scratchpad';

export default function ProblemPage() {
  const { slug } = useParams();
  const {
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
    handleRun,
    handleAIAnalyze,
    handleGetHint,
    handleCompleteCode,
    toggleTimer,
    resetTimer,
    markAsSolution,
    unmarkAsSolution,
    deleteSubmission
  } = useProblemPage(slug);


  const [isFullscreen, setIsFullscreen] = useState(false);
  const [solutionModal, setSolutionModal] = useState<{ submissionId: string; currentName: string | null } | null>(null);

  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(false);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  const descriptionPanelRef = useRef<ImperativePanelHandle>(null);
  const consolePanelRef = useRef<ImperativePanelHandle>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    aiService.loadFromStorage();
    setIsAIEnabled(aiService.isEnabled());
  }, []);

  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  const isEditorChange = useRef(false);
  const lastRunCodeRef = useRef<string>(''); // Track code when tests were last run

  const handleCodeChange = useCallback((val: string | undefined) => {
    isEditorChange.current = true;
    setCode(val || '');
  }, []);

  // When code changes externally (like loading a submission), update the editor
  useEffect(() => {
    if (editorRef.current && code !== undefined && !isEditorChange.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== code) {
        editorRef.current.setValue(code);
      }
    }
    isEditorChange.current = false;
  }, [code]);

  // Calculate if submit should be enabled
  // User must have run tests AND code must not have changed since last run
  const canSubmit = !!output?.passed && lastRunCodeRef.current === code;

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

  const toggleDescription = () => {
    const panel = descriptionPanelRef.current;
    if (panel) {
      if (isDescriptionCollapsed) {
        panel.expand();
        // Disable focus mode when expanding any panel
        if (isFocusMode) setIsFocusMode(false);
      } else {
        panel.collapse();
      }
    }
  };

  const toggleConsole = () => {
    const panel = consolePanelRef.current;
    if (panel) {
      if (isConsoleCollapsed) {
        panel.expand();
        // Disable focus mode when expanding any panel
        if (isFocusMode) setIsFocusMode(false);
      } else {
        panel.collapse();
      }
    }
  };

  const toggleFocusMode = () => {
    const newFocusMode = !isFocusMode;
    setIsFocusMode(newFocusMode);

    const descPanel = descriptionPanelRef.current;
    const consolePanel = consolePanelRef.current;

    if (newFocusMode) {
      descPanel?.collapse();
      consolePanel?.collapse();
    } else {
      descPanel?.expand();
      consolePanel?.expand();
    }
  };

  const handleMarkAsSolutionClick = (submissionId: string, currentStatus: boolean, currentName: string | null) => {
    if (!currentStatus) {
      setSolutionModal({ submissionId, currentName });
    } else {
      unmarkAsSolution(submissionId);
    }
  };

  const confirmMarkAsSolution = (name: string) => {
    if (solutionModal) {
      markAsSolution(solutionModal.submissionId, name);
      setSolutionModal(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!problem) return (
    <div className="flex items-center justify-center h-full text-muted-foreground bg-background">
      <LoadingThunder size="lg" />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background text-foreground font-sans">
      <ProblemHeader
        problem={problem}
        isRunning={isRunning}
        onRun={(mode) => {
          // Get the latest code from the editor
          const currentCode = editorRef.current?.getValue() || code;
          // Save code snapshot when running tests
          lastRunCodeRef.current = currentCode;
          handleRun(mode, () => {
            if (isConsoleCollapsed) consolePanelRef.current?.expand();
          }, currentCode);
        }}
        canSubmit={canSubmit}
        isDescriptionCollapsed={isDescriptionCollapsed}
        isConsoleCollapsed={isConsoleCollapsed}
        onToggleDescription={toggleDescription}
        onToggleConsole={toggleConsole}
      />

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
            <ProblemDescription
              problem={problem}
              submissions={submissions}
              solutions={solutions}
              aiAnalysis={aiAnalysis}
              isAnalyzing={isAnalyzing}
              isAIEnabled={isAIEnabled}
              onAnalyze={handleAIAnalyze}
              onLoadSubmission={(sub) => setCode(sub.code)}
              onMarkAsSolution={handleMarkAsSolutionClick}
              onDeleteSubmission={deleteSubmission}
              onLoadSolution={(code) => setCode(code)}
              onCollapse={toggleDescription}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Right Panel: Editor & Console */}
          <Panel minSize={30} className="flex flex-col overflow-hidden">
            <PanelGroup direction="vertical">
              <Panel minSize={30} className="flex flex-col overflow-hidden">
                <CodeEditor
                  code={code}
                  onChange={handleCodeChange}
                  onMount={handleEditorDidMount}
                  isTimerRunning={isTimerRunning}
                  timeLeft={timeLeft}
                  onToggleTimer={toggleTimer}
                  onResetTimer={resetTimer}
                  onResetCode={() => setCode(problem.starterCode)}
                  onGetHint={handleGetHint}
                  onCompleteCode={() => handleCompleteCode(code)}
                  onToggleFullscreen={toggleFullscreen}
                  isFullscreen={isFullscreen}
                  isRequestingHint={isRequestingHint}
                  isCompletingCode={isCompletingCode}
                  autocompleteEnabled={autocompleteEnabled}
                  onToggleAutocomplete={() => setAutocompleteEnabled(!autocompleteEnabled)}
                  isAIEnabled={isAIEnabled}
                  formatTime={formatTime}
                  isFocusMode={isFocusMode}
                  onToggleFocusMode={toggleFocusMode}
                  onRun={() => {
                    const currentCode = editorRef.current?.getValue() || code;
                    lastRunCodeRef.current = currentCode;
                    handleRun('run', () => {
                      if (isConsoleCollapsed) consolePanelRef.current?.expand();
                    }, currentCode);
                  }}
                  isScratchpadOpen={isScratchpadOpen}
                  onToggleScratchpad={() => setIsScratchpadOpen(!isScratchpadOpen)}
                />
              </Panel>

              <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />

              <Panel
                ref={consolePanelRef}
                defaultSize={25}
                minSize={5}
                collapsible
                onCollapse={() => setIsConsoleCollapsed(true)}
                onExpand={() => setIsConsoleCollapsed(false)}
              >
                <ConsolePanel
                  output={output}
                  isRunning={isRunning}
                  onCollapse={toggleConsole}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      <SolutionModal
        isOpen={!!solutionModal}
        onClose={() => setSolutionModal(null)}
        onConfirm={confirmMarkAsSolution}
        currentName={solutionModal?.currentName || null}
      />

      <Scratchpad
        problemId={problem.id}
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
      />
    </div>
  );
}
