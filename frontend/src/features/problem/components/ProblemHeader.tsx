import { FileText, Play, Send, Loader2, PanelLeftOpen, PanelBottomOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Problem } from '@/types/problem';
import { Button } from '@/design-system/components';

interface ProblemHeaderProps {
  problem: Problem;
  isRunning: boolean;
  executionMode: 'run' | 'submit' | null;
  onRun: (mode: 'run' | 'submit') => void;
  canSubmit: boolean;
  isDescriptionCollapsed?: boolean;
  isConsoleCollapsed?: boolean;
  onToggleDescription?: () => void;
  onToggleConsole?: () => void;
}

export function ProblemHeader({
  problem,
  isRunning,
  executionMode,
  onRun,
  canSubmit,
  isDescriptionCollapsed,
  isConsoleCollapsed,
  onToggleDescription,
  onToggleConsole
}: ProblemHeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-10 relative">
      <div className="flex items-center space-x-6">
        <h2 className="font-semibold text-sm flex items-center gap-2 text-foreground/90 tracking-tight">
          <FileText className="w-4 h-4 text-primary" />
          {problem.title}
        </h2>
      </div>

      <div className="flex items-center space-x-3">
        {isDescriptionCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDescription}
            className="h-8 w-8 p-0"
            title="Show Description"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </Button>
        )}
        {isConsoleCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleConsole}
            className="h-8 w-8 p-0"
            title="Show Console"
          >
            <PanelBottomOpen className="w-4 h-4" />
          </Button>
        )}
        <div className="h-4 w-px bg-border mx-2" />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onRun('run')}
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning && executionMode === 'run' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          Run
        </Button>
        <Button
          size="sm"
          onClick={() => onRun('submit')}
          disabled={isRunning || !canSubmit}
          title={!canSubmit ? "Run your code and pass all test cases first" : "Submit your solution"}
          className={cn(
            "gap-2",
            "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] border border-primary/20"
          )}
        >
          {isRunning && executionMode === 'submit' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Submit
        </Button>
      </div>
    </header>
  );
}
