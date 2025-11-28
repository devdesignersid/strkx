import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { Loader2 } from 'lucide-react';
import { aiService } from '@/lib/ai/aiService';

import { useProblem } from '@/features/problem/hooks/useProblem';
import { ProblemHeader } from '@/features/problem/components/ProblemHeader';
import { ProblemDescription } from '@/features/problem/components/ProblemDescription';
import { CodeEditor } from '@/features/problem/components/CodeEditor';
import { ConsolePanel } from '@/features/problem/components/ConsolePanel';
import { SolutionModal } from '@/features/problem/components/SolutionModal';

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
    unmarkAsSolution
  } = useProblem(slug);


  const [isFullscreen, setIsFullscreen] = useState(false);
  const [solutionModal, setSolutionModal] = useState<{ submissionId: string; currentName: string | null } | null>(null);

  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(false);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [autocompleteEnabled] = useState(true);
  const [isAIEnabled, setIsAIEnabled] = useState(false);

  const descriptionPanelRef = useRef<ImperativePanelHandle>(null);
  const consolePanelRef = useRef<ImperativePanelHandle>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    aiService.loadFromStorage();
    setIsAIEnabled(aiService.isEnabled());
  }, []);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
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
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background text-foreground font-sans">
      <ProblemHeader
        problem={problem}
        isRunning={isRunning}
        onRun={(mode) => {
            handleRun(mode, () => {
                if (isConsoleCollapsed) consolePanelRef.current?.expand();
            });
        }}
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
              onLoadSolution={(code) => setCode(code)}
              onCollapse={toggleDescription}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Right Panel: Editor & Console */}
          <Panel minSize={30}>
            <PanelGroup direction="vertical">
              <Panel minSize={30}>
                <CodeEditor
                  code={code}
                  onChange={(val) => setCode(val || '')}
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
                  isAIEnabled={isAIEnabled}
                  formatTime={formatTime}
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
    </div>
  );
}
