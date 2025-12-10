import { FileText, RotateCcw, ArrowLeft, Undo2, Redo2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/design-system/components';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/design-system/components/Tooltip';
import { Link } from 'react-router-dom';
import { useResumeStore } from '../hooks/useResumeStore';
import { useResumeAnalysis } from '../hooks/useResumeAnalysis';
import { useEffect, useState } from 'react';
import { ResumeAnalyzer } from './analyzer/ResumeAnalyzer';
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
    const [isAIEnabled, setIsAIEnabled] = useState(false);
    const { analyzeResume, isLoading, error, result, clearResult } = useResumeAnalysis();

    useEffect(() => {
        aiService.loadFromStorage();
        setIsAIEnabled(aiService.isConfigured());
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
                    {/* AI Analyze button */}
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
        </TooltipProvider>
    );
}
