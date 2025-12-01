import { FileText, Maximize2, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import type { SystemDesignProblem } from '@/types/system-design';

interface SystemDesignHeaderProps {
    problem: SystemDesignProblem;
    onSubmit: () => void;
    isLeftPanelCollapsed: boolean;
    onToggleLeftPanel: () => void;
    isRightPanelCollapsed: boolean;
    onToggleRightPanel: () => void;
    onResetLayout: () => void;
}

export function SystemDesignHeader({
    problem,
    onSubmit,
    isLeftPanelCollapsed,
    onToggleLeftPanel,
    isRightPanelCollapsed,
    onToggleRightPanel,
    onResetLayout,
}: SystemDesignHeaderProps) {
    return (
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-10 relative">
            <div className="flex items-center space-x-6">
                <h2 className="font-semibold text-sm flex items-center gap-2 text-foreground/90 tracking-tight">
                    <FileText className="w-4 h-4 text-primary" />
                    {problem.title}
                </h2>
            </div>

            <div className="flex items-center space-x-3">
                {isLeftPanelCollapsed && (
                    <button
                        onClick={onToggleLeftPanel}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Show Sidebar"
                    >
                        <PanelLeftOpen className="w-4 h-4" />
                    </button>
                )}

                {isRightPanelCollapsed && (
                    <button
                        onClick={onToggleRightPanel}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Show Canvas"
                    >
                        <PanelRightOpen className="w-4 h-4" />
                    </button>
                )}

                {(isLeftPanelCollapsed || isRightPanelCollapsed) && (
                    <button
                        onClick={onResetLayout}
                        className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                        title="Reset Layout"
                    >
                        <Maximize2 className="w-4 h-4 rotate-45" />
                    </button>
                )}

                <button
                    onClick={onSubmit}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors"
                >
                    Submit
                </button>
            </div>
        </header>
    );
}
