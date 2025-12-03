import { Send, Loader2, PanelLeftOpen, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/design-system/components';

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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleDescription}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        title="Show Description"
                    >
                        <PanelLeftOpen className="w-4 h-4" />
                    </Button>
                )}



                <Button
                    onClick={() => onSubmit(false)}
                    disabled={isSubmitting}
                    className={cn(
                        "gap-2 transition-all duration-200",
                        "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] border border-primary/20"
                    )}
                >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {currentQuestionIndex === totalQuestions - 1 ? 'Submit' : 'Submit & Next'}
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExit}
                    className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Exit Interview"
                >
                    <LogOut className="w-4 h-4" />
                    Exit
                </Button>
            </div>
        </header>
    );
}
