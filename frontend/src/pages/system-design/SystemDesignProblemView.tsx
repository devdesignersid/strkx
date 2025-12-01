import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { toast } from 'sonner';
import { aiService } from '@/lib/ai/aiService';

import { useSystemDesignProblem } from '@/features/system-design/hooks/useSystemDesignProblem';
import { SystemDesignHeader } from '@/features/system-design/components/SystemDesignHeader';
import { SolutionModal } from '@/features/problem/components/SolutionModal';
import { SystemDesignDescription } from '@/features/system-design/components/SystemDesignDescription';
import { SystemDesignCanvas } from '@/features/system-design/components/SystemDesignCanvas';
import NotesEditor from '@/features/system-design/components/NotesEditor';

export default function SystemDesignProblemView() {
    const { id } = useParams();
    const {
        problem,
        notes,
        setNotes,
        excalidrawData,
        setExcalidrawData,
        setTimeSpentSeconds,
        handleSubmit,
        submissions,
        solutions,
        aiAnalysis,
        isAnalyzing,
        handleAnalyze,
        loadSubmission,
        handleMarkAsSolution,
    } = useSystemDesignProblem(id);

    const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
    const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
    const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
    const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [solutionModal, setSolutionModal] = useState<{ submissionId: string; currentName: string | null } | null>(null);
    const [isAIEnabled, setIsAIEnabled] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Timer state - matching ProblemPage
    const [timeLeft, setTimeLeft] = useState((problem?.defaultDuration || 45) * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const leftPanelRef = useRef<ImperativePanelHandle>(null);
    const rightPanelRef = useRef<ImperativePanelHandle>(null);
    const descriptionPanelRef = useRef<ImperativePanelHandle>(null);
    const notesPanelRef = useRef<ImperativePanelHandle>(null);

    useEffect(() => {
        aiService.loadFromStorage();
        setIsAIEnabled(aiService.isEnabled());
    }, []);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
                setTimeSpentSeconds((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft, setTimeSpentSeconds]);

    const toggleTimer = () => {
        setIsTimerRunning(!isTimerRunning);
    };

    const resetTimer = () => {
        setTimeLeft((problem?.defaultDuration || 45) * 60);
        setTimeSpentSeconds(0);
        setIsTimerRunning(false);
    };

    const toggleLeftPanel = () => {
        const panel = leftPanelRef.current;
        if (panel) {
            if (isLeftPanelCollapsed) {
                panel.resize(35);
                setIsLeftPanelCollapsed(false);
                setIsFocusMode(false);
            } else {
                panel.collapse();
            }
        }
    };

    const toggleRightPanel = () => {
        const panel = rightPanelRef.current;
        if (panel) {
            if (isRightPanelCollapsed) {
                panel.resize(65);
                setIsRightPanelCollapsed(false);
            } else {
                panel.collapse();
            }
        }
    };

    const toggleNotes = () => {
        const panel = notesPanelRef.current;
        if (panel) {
            if (isNotesCollapsed) {
                panel.resize(50);
                setIsNotesCollapsed(false);
            } else {
                panel.collapse();
            }
        }
    };

    const toggleNotesMaximize = () => {
        const panel = descriptionPanelRef.current;
        if (panel) {
            if (isDescriptionCollapsed) {
                panel.expand();
                setIsDescriptionCollapsed(false);
            } else {
                panel.collapse();
                setIsDescriptionCollapsed(true);
            }
        }
    };

    const toggleFocusMode = useCallback(() => {
        const newFocusMode = !isFocusMode;
        setIsFocusMode(newFocusMode);

        const leftPanel = leftPanelRef.current;

        if (newFocusMode) {
            leftPanel?.collapse();
        } else {
            leftPanel?.resize(35);
        }
    }, [isFocusMode]);

    const handleMarkAsSolutionClick = (submissionId: string, currentStatus: boolean, currentName: string | null) => {
        if (currentStatus) {
            // If already marked as solution, unmark directly without modal
            if (handleMarkAsSolution) {
                handleMarkAsSolution(submissionId);
            }
        } else {
            // Show modal to name the solution
            setSolutionModal({ submissionId, currentName });
        }
    };

    const confirmMarkAsSolution = (name: string) => {
        if (solutionModal && handleMarkAsSolution) {
            handleMarkAsSolution(solutionModal.submissionId, name);
            setSolutionModal(null);
        }
    };

    const resetLayout = () => {
        const leftPanel = leftPanelRef.current;
        const rightPanel = rightPanelRef.current;
        const notesPanel = notesPanelRef.current;
        const descriptionPanel = descriptionPanelRef.current;

        if (leftPanel && rightPanel) {
            leftPanel.resize(35);
            rightPanel.resize(65);
            notesPanel?.resize(50);
            descriptionPanel?.expand();
            setIsLeftPanelCollapsed(false);
            setIsRightPanelCollapsed(false);
            setIsNotesCollapsed(false);
            setIsDescriptionCollapsed(false);
            setIsFocusMode(false);
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

    const handleResetCanvas = () => {
        if (confirm('Are you sure you want to reset the canvas? This will clear all your diagrams.')) {
            setExcalidrawData(null);
            toast.success('Canvas reset');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+. or Ctrl+. for Focus Mode
            if ((e.metaKey || e.ctrlKey) && e.key === '.') {
                e.preventDefault();
                toggleFocusMode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleFocusMode]);

    const onSubmit = async () => {
        const result = await handleSubmit();
        if (result.success) {
            toast.success('Solution submitted successfully!');
        } else {
            toast.error('Failed to submit solution');
        }
    };



    if (!problem) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading problem...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background text-foreground font-sans">
            <SystemDesignHeader
                problem={problem}
                onSubmit={onSubmit}
                isLeftPanelCollapsed={isLeftPanelCollapsed}
                onToggleLeftPanel={toggleLeftPanel}
                isRightPanelCollapsed={isRightPanelCollapsed}
                onToggleRightPanel={toggleRightPanel}
                onResetLayout={resetLayout}
            />

            <div className="flex-1 overflow-hidden relative">
                <PanelGroup direction="horizontal" className="h-full">
                    {/* Left Panel: Description + Notes (vertical split) */}
                    <Panel
                        ref={leftPanelRef}
                        defaultSize={35}
                        minSize={20}
                        collapsible
                        onCollapse={() => {
                            setIsLeftPanelCollapsed(true);
                            setIsFocusMode(true);
                        }}
                        onExpand={() => {
                            setIsLeftPanelCollapsed(false);
                            setIsFocusMode(false);
                        }}
                        className="flex flex-col bg-card border-r border-border"
                    >
                        <PanelGroup direction="vertical">
                            {/* Description */}
                            <Panel
                                ref={descriptionPanelRef}
                                defaultSize={50}
                                minSize={20}
                                collapsible
                                onCollapse={() => setIsDescriptionCollapsed(true)}
                                onExpand={() => setIsDescriptionCollapsed(false)}
                            >
                                <SystemDesignDescription
                                    problem={problem}
                                    submissions={submissions}
                                    solutions={solutions}
                                    aiAnalysis={aiAnalysis}
                                    isAIEnabled={isAIEnabled}
                                    isAnalyzing={isAnalyzing}
                                    onAnalyze={handleAnalyze}
                                    onLoadSubmission={loadSubmission}
                                    onMarkAsSolution={handleMarkAsSolutionClick}
                                    onCollapse={toggleLeftPanel}
                                    isNotesCollapsed={isNotesCollapsed}
                                    onToggleNotes={toggleNotes}
                                />
                            </Panel>

                            <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />

                            {/* Notes */}
                            <Panel
                                ref={notesPanelRef}
                                defaultSize={50}
                                minSize={20}
                                collapsible
                                onCollapse={() => setIsNotesCollapsed(true)}
                                onExpand={() => setIsNotesCollapsed(false)}
                            >
                                <NotesEditor
                                    value={notes}
                                    onChange={setNotes}
                                    onCollapse={toggleNotes}
                                    isMaximized={isDescriptionCollapsed}
                                    onToggleMaximize={toggleNotesMaximize}
                                />
                            </Panel>
                        </PanelGroup>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

                    {/* Right Panel: Excalidraw Canvas */}
                    <Panel
                        ref={rightPanelRef}
                        minSize={30}
                        collapsible
                        onCollapse={() => setIsRightPanelCollapsed(true)}
                        onExpand={() => setIsRightPanelCollapsed(false)}
                        className="flex flex-col overflow-hidden"
                    >
                        <SystemDesignCanvas
                            excalidrawData={excalidrawData}
                            onChange={(elements, appState) => setExcalidrawData({ elements, appState })}
                            isTimerRunning={isTimerRunning}
                            timeLeft={timeLeft}
                            onToggleTimer={toggleTimer}
                            onResetTimer={resetTimer}
                            onToggleFullscreen={toggleFullscreen}
                            isFullscreen={isFullscreen}
                            formatTime={formatTime}
                            isFocusMode={isFocusMode}
                            onToggleFocusMode={toggleFocusMode}
                            onResetCanvas={handleResetCanvas}
                            onCollapse={toggleRightPanel}
                        />
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
