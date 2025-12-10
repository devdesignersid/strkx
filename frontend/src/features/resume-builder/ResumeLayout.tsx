import { Suspense, useState } from 'react';
import { useDebounceSave } from './hooks/useDebounceSave';
import { LivePreview } from './components/preview/LivePreview';
import { ResumeHeader } from './components/ResumeHeader';
import { StudioLayout } from './components/layout/StudioLayout';
import { ControlDeck } from './components/layout/ControlDeck';
import { ResumeErrorBoundary } from './components/ResumeErrorBoundary';
import { LoadingThunder, Button } from '@/design-system/components';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export const ResumeLayout = () => {
    // Activate auto-save
    useDebounceSave(600);

    const [showResetModal, setShowResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleResetClick = () => {
        setShowResetModal(true);
    };

    const handleResetConfirm = async () => {
        setIsResetting(true);
        try {
            // Clear persisted storage and reload
            await localStorage.removeItem('strkx-resume-storage');
            // Also clear IndexedDB
            const { del } = await import('idb-keyval');
            await del('strkx-resume-storage');
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset:', error);
            setIsResetting(false);
            setShowResetModal(false);
        }
    };

    return (
        <ResumeErrorBoundary>
            <div className="h-full flex flex-col bg-background overflow-hidden relative">
                <ResumeHeader
                    onReset={handleResetClick}
                />

                <div className="flex-1 overflow-hidden relative">
                    <Suspense fallback={
                        <div className="w-full h-full flex items-center justify-center">
                            <LoadingThunder size="lg" className="text-primary" />
                        </div>
                    }>
                        <StudioLayout
                            controlDeck={<ControlDeck />}
                            liveCanvas={
                                <div className="w-full h-full flex items-center justify-center transition-all duration-500">
                                    <LivePreview />
                                </div>
                            }
                        />
                    </Suspense>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetModal && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">Reset Resume</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowResetModal(false)}
                                className="h-8 w-8"
                                disabled={isResetting}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="p-5">
                            <p className="text-muted-foreground">
                                Are you sure you want to reset your resume? This will clear all content and design settings.
                            </p>
                            <p className="text-destructive text-sm mt-2 font-medium">
                                This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-muted/30">
                            <Button
                                variant="ghost"
                                onClick={() => setShowResetModal(false)}
                                disabled={isResetting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleResetConfirm}
                                disabled={isResetting}
                            >
                                {isResetting ? 'Resetting...' : 'Reset Resume'}
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </ResumeErrorBoundary>
    );
};


