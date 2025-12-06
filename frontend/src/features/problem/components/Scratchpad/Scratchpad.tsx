import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Type, Pencil, Trash2, Undo2, Minus, Plus, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/design-system/components';
import { modalBackdrop, modalContent } from '@/design-system/animations';
import { TextPad } from './TextPad';
import { DrawPad } from './DrawPad';
import { useScratchpad } from './useScratchpad';

interface ScratchpadProps {
    problemId: string;
    isOpen: boolean;
    onClose: () => void;
}

type Mode = 'text' | 'draw';

export function Scratchpad({ problemId, isOpen, onClose }: ScratchpadProps) {
    const {
        state,
        setTextHtml,
        pushStrokePath,
        undoStrokePath,
        wipe,
        wipeDrawing,
        forceSave,
        cacheLinkPreview,
    } = useScratchpad(problemId);

    const [mode, setMode] = useState<Mode>('text');
    const [strokeSize, setStrokeSize] = useState(3);
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Focus management and keyboard handling
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            document.body.style.overflow = 'hidden';

            // Focus modal after animation
            setTimeout(() => {
                modalRef.current?.focus();
            }, 100);
        } else {
            document.body.style.overflow = '';
            previousActiveElement.current?.focus();
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
            // Ctrl/Cmd + S to force save
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                forceSave();
            }
            // Ctrl/Cmd + Z to undo (only in draw mode)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && mode === 'draw') {
                e.preventDefault();
                undoStrokePath();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, forceSave, undoStrokePath, mode]);

    // Focus trap
    const handleTabKey = useCallback((e: React.KeyboardEvent) => {
        if (e.key !== 'Tab' || !modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        }
    }, []);

    // Export to PNG
    const handleExport = useCallback(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('[aria-label="Drawing canvas"]');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `scratchpad-${problemId}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, [problemId]);

    // Handle clear based on mode
    const handleClear = useCallback(() => {
        if (mode === 'draw') {
            wipeDrawing();
        } else {
            wipe();
        }
    }, [mode, wipe, wipeDrawing]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        variants={modalBackdrop}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <motion.div
                        ref={modalRef}
                        variants={modalContent}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="relative w-[90vw] max-w-4xl h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Scratchpad"
                        tabIndex={-1}
                        onKeyDown={handleTabKey}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header / Toolbar */}
                        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
                            <div className="flex items-center gap-2">
                                {/* Mode Toggle */}
                                <div className="flex items-center bg-muted/50 rounded-lg p-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setMode('text')}
                                        className={cn(
                                            'h-8 px-3 gap-1.5 rounded-md',
                                            mode === 'text' && 'bg-background shadow-sm'
                                        )}
                                        aria-pressed={mode === 'text'}
                                    >
                                        <Type className="w-4 h-4" />
                                        Text
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setMode('draw')}
                                        className={cn(
                                            'h-8 px-3 gap-1.5 rounded-md',
                                            mode === 'draw' && 'bg-background shadow-sm'
                                        )}
                                        aria-pressed={mode === 'draw'}
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Draw
                                    </Button>
                                </div>

                                {/* Drawing controls (only in draw mode) */}
                                {mode === 'draw' && (
                                    <>
                                        <div className="w-px h-6 bg-border mx-2" />
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setStrokeSize(Math.max(1, strokeSize - 1))}
                                                className="h-8 w-8 p-0"
                                                title="Decrease brush size"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </Button>
                                            <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">
                                                {strokeSize}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setStrokeSize(Math.min(20, strokeSize + 1))}
                                                className="h-8 w-8 p-0"
                                                title="Increase brush size"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {mode === 'draw' && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={undoStrokePath}
                                            disabled={!state.strokePaths?.length}
                                            className="h-8 w-8 p-0"
                                            title="Undo last stroke (⌘Z)"
                                        >
                                            <Undo2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleExport}
                                            disabled={!state.strokePaths?.length}
                                            className="h-8 w-8 p-0"
                                            title="Export as PNG"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClear}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    title={mode === 'draw' ? 'Clear drawing' : 'Clear all'}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>

                                <div className="w-px h-6 bg-border mx-1" />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="h-8 w-8 p-0"
                                    aria-label="Close scratchpad"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </header>

                        {/* Main Content */}
                        <main className="flex-1 min-h-0 bg-background/50">
                            {mode === 'text' ? (
                                <TextPad
                                    html={state.textHtml || ''}
                                    onChange={setTextHtml}
                                    placeholder="Start typing your notes... Paste URLs to see previews. (⌘B bold, ⌘I italic)"
                                    linkPreviews={state.linkPreviews}
                                    onLinkPreviewFetched={cacheLinkPreview}
                                />
                            ) : (
                                <DrawPad
                                    strokePaths={state.strokePaths || []}
                                    onStrokePath={pushStrokePath}
                                    strokeSize={strokeSize}
                                />
                            )}
                        </main>

                        {/* Footer */}
                        <footer className="px-4 py-2 border-t border-border bg-card/50 text-xs text-muted-foreground shrink-0">
                            <span>
                                Last saved: {new Date(state.lastUpdated).toLocaleTimeString()}
                            </span>
                        </footer>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
