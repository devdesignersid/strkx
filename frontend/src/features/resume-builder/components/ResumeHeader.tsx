import { FileText, RotateCcw, ArrowLeft, Undo2, Redo2, Sparkles, Loader2, Linkedin, Heart, Save, History } from 'lucide-react';
import { Button } from '@/design-system/components';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/design-system/components/Tooltip';
import { Link } from 'react-router-dom';
import { useResumeStore } from '../hooks/useResumeStore';
import { useResumeAnalysis } from '../hooks/useResumeAnalysis';
import { useLinkedInOptimization } from '../hooks/useLinkedInOptimization';
import { useCoverLetter } from '../hooks/useCoverLetter';
import { useResumeVersions } from '../hooks/useResumeVersions';
import { useEffect, useState } from 'react';
import { ResumeAnalyzer } from './analyzer/ResumeAnalyzer';
import { LinkedInOptimizer } from './analyzer/LinkedInOptimizer';
import { CoverLetterGenerator } from './analyzer/CoverLetterGenerator';
import { VersionHistoryPanel } from './versions/VersionHistoryPanel';
import { aiService } from '@/lib/ai/aiService';

interface ResumeHeaderProps {
    onReset: () => void;
}

export function ResumeHeader({ onReset }: ResumeHeaderProps) {
    // Get undo/redo from temporal store
    const temporalStore = (useResumeStore as any).temporal;
    const { undo, redo, pastStates, futureStates } = temporalStore.getState();

    const canUndo = pastStates.length > 0;
    const canRedo = futureStates.length > 0;

    // AI Analysis state
    const [showAnalyzer, setShowAnalyzer] = useState(false);
    const [showLinkedIn, setShowLinkedIn] = useState(false);
    const [showCoverLetter, setShowCoverLetter] = useState(false);
    const [isAIEnabled, setIsAIEnabled] = useState(false);
    const { analyzeResume, isLoading, error, result, clearResult } = useResumeAnalysis();
    const {
        optimizeLinkedIn,
        isLoading: linkedInLoading,
        error: linkedInError,
        result: linkedInResult,
        clearResult: clearLinkedInResult
    } = useLinkedInOptimization();
    const {
        generateCoverLetter,
        isLoading: coverLetterLoading,
        error: coverLetterError,
        result: coverLetterResult,
        clearResult: clearCoverLetterResult
    } = useCoverLetter();

    // Version management
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const {
        versions,
        isLoadingVersions,
        saveVersion,
        isSaving,
        restoreVersion,
        isRestoring,
        deleteLatestVersion,
        isDeleting,
        latestVersionNumber,
        activeVersionNumber,
    } = useResumeVersions();

    useEffect(() => {
        aiService.loadFromStorage();
        setIsAIEnabled(aiService.isConfigured() && aiService.isEnabled());
    }, []);

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const handleOpenAnalyzer = () => {
        setShowAnalyzer(true);
    };

    const handleCloseAnalyzer = () => {
        setShowAnalyzer(false);
        clearResult();
    };

    const handleOpenLinkedIn = () => {
        setShowLinkedIn(true);
    };

    const handleCloseLinkedIn = () => {
        setShowLinkedIn(false);
        clearLinkedInResult();
    };

    const handleOpenCoverLetter = () => {
        setShowCoverLetter(true);
    };

    const handleCloseCoverLetter = () => {
        setShowCoverLetter(false);
        clearCoverLetterResult();
    };

    return (
        <TooltipProvider>
            <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <h2 className="font-semibold text-sm flex items-center gap-2 text-foreground/90 tracking-tight">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="hidden sm:inline">Resume Builder</span>
                    </h2>
                </div>

                <div className="flex items-center gap-1">
                    {/* AI Buttons */}
                    {isAIEnabled && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleOpenAnalyzer}
                                        disabled={isLoading}
                                        className="gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-3.5 h-3.5" />
                                        )}
                                        <span className="hidden sm:inline">AI Analyze</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Get AI-powered resume feedback</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleOpenLinkedIn}
                                        disabled={linkedInLoading}
                                        className="gap-2 bg-[#0A66C2]/5 border-[#0A66C2]/20 text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]"
                                    >
                                        {linkedInLoading ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Linkedin className="w-3.5 h-3.5" />
                                        )}
                                        <span className="hidden sm:inline">LinkedIn</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Generate optimized LinkedIn profile</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleOpenCoverLetter}
                                        disabled={coverLetterLoading}
                                        className="gap-2 bg-rose-500/5 border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                                    >
                                        {coverLetterLoading ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Heart className="w-3.5 h-3.5" />
                                        )}
                                        <span className="hidden sm:inline">Cover Letter</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Generate personalized cover letter</p>
                                </TooltipContent>
                            </Tooltip>

                            <div className="h-4 w-px bg-border mx-2" />
                        </>
                    )}

                    {/* Undo/Redo group */}
                    <div className="flex items-center gap-0.5 mr-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => undo()}
                                    disabled={!canUndo}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                >
                                    <Undo2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Undo <kbd className="ml-1 text-xs opacity-60">⌘Z</kbd></p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => redo()}
                                    disabled={!canRedo}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                >
                                    <Redo2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Redo <kbd className="ml-1 text-xs opacity-60">⌘⇧Z</kbd></p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="h-4 w-px bg-border" />

                    {/* Reset button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onReset}
                                className="gap-2 ml-2 text-muted-foreground hover:text-destructive"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Reset</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Reset all content</p>
                        </TooltipContent>
                    </Tooltip>

                    <div className="h-4 w-px bg-border" />

                    {/* Save and History buttons */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowVersionHistory(true)}
                                className="gap-2 text-muted-foreground hover:text-foreground"
                            >
                                <History className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">History</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>View version history</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={saveVersion}
                                disabled={isSaving}
                                className="gap-2"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Save className="w-3.5 h-3.5" />
                                )}
                                <span className="hidden sm:inline">Save</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Save version {latestVersionNumber + 1}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </header>

            {/* AI Analyzer Modal */}
            {showAnalyzer && (
                <ResumeAnalyzer
                    result={result}
                    isLoading={isLoading}
                    error={error}
                    onClose={handleCloseAnalyzer}
                    onAnalyze={analyzeResume}
                />
            )}

            {/* LinkedIn Optimizer Modal */}
            {showLinkedIn && (
                <LinkedInOptimizer
                    result={linkedInResult}
                    isLoading={linkedInLoading}
                    error={linkedInError}
                    onClose={handleCloseLinkedIn}
                    onOptimize={optimizeLinkedIn}
                />
            )}

            {/* Cover Letter Generator Modal */}
            {showCoverLetter && (
                <CoverLetterGenerator
                    result={coverLetterResult}
                    isLoading={coverLetterLoading}
                    error={coverLetterError}
                    onClose={handleCloseCoverLetter}
                    onGenerate={generateCoverLetter}
                />
            )}

            {/* Version History Modal */}
            {showVersionHistory && (
                <VersionHistoryPanel
                    versions={versions}
                    isLoading={isLoadingVersions}
                    isRestoring={isRestoring}
                    isDeleting={isDeleting}
                    currentVersionNumber={activeVersionNumber}
                    onClose={() => setShowVersionHistory(false)}
                    onRestore={restoreVersion}
                    onDelete={deleteLatestVersion}
                />
            )}
        </TooltipProvider>
    );
}
