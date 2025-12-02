import { Send, Loader2, PanelLeftOpen, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MockInterviewHeaderProps {
    currentQuestionIndex: number;
    totalQuestions: number;
    isSubmitting: boolean;
    onSubmit: (auto: boolean) => void;
    isDescriptionCollapsed?: boolean;

    onToggleDescription?: () => void;
    onExit: () => void;
}

export function MockInterviewHeader({
    currentQuestionIndex,
    totalQuestions,
    isSubmitting,
    onSubmit,
    isDescriptionCollapsed,

    onToggleDescription,
    onExit
}: MockInterviewHeaderProps) {
    return (
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-10 relative">
            <div className="flex items-center gap-4">

                <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-md border border-primary/20 font-medium tracking-wide">
                    MOCK INTERVIEW
                </span>
                <span className="text-sm text-muted-foreground">
                    Question <span className="text-foreground font-medium">{currentQuestionIndex + 1}</span> of {totalQuestions}
                </span>
            </div>



            <div className="flex items-center space-x-3">
                {isDescriptionCollapsed && (
                    <button
                        onClick={onToggleDescription}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Show Description"
                    >
                        <PanelLeftOpen className="w-4 h-4" />
                    </button>
                )}



                <button
                    onClick={() => onSubmit(false)}
                    disabled={isSubmitting}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                        "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] border border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {currentQuestionIndex === totalQuestions - 1 ? 'Submit' : 'Submit & Next'}
                </button>

                <button
                    onClick={onExit}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Exit Interview"
                >
                    <LogOut className="w-4 h-4" />
                    Exit
                </button>
            </div>
        </header>
    );
}
