import { Suspense } from 'react';
import { useDebounceSave } from './hooks/useDebounceSave';
import { LivePreview } from './components/preview/LivePreview';
import { ResumeHeader } from './components/ResumeHeader';
import { StudioLayout } from './components/layout/StudioLayout';
import { ControlDeck } from './components/layout/ControlDeck';
import { ResumeErrorBoundary } from './components/ResumeErrorBoundary';
import { LoadingThunder } from '@/design-system/components';

export const ResumeLayout = () => {
    // Activate auto-save
    useDebounceSave(600);

    const handleReset = async () => {
        if (confirm('Are you sure you want to reset your resume? This action cannot be undone.')) {
            // Clear persisted storage and reload
            await localStorage.removeItem('strkx-resume-storage');
            // Also clear IndexedDB
            const { del } = await import('idb-keyval');
            await del('strkx-resume-storage');
            window.location.reload();
        }
    };

    return (
        <ResumeErrorBoundary>
            <div className="h-full flex flex-col bg-background overflow-hidden relative">
                <ResumeHeader
                    onReset={handleReset}
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
        </ResumeErrorBoundary>
    );
};

