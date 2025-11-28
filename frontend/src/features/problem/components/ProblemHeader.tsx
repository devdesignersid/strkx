import { FileText, Play, Send, Loader2, PanelLeftOpen, PanelBottomOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Problem } from '@/types/problem';

interface ProblemHeaderProps {
  problem: Problem;
  isRunning: boolean;
  onRun: (mode: 'run' | 'submit') => void;
  isDescriptionCollapsed?: boolean;
  isConsoleCollapsed?: boolean;
  onToggleDescription?: () => void;
  onToggleConsole?: () => void;
}

export function ProblemHeader({
  problem,
  isRunning,
  onRun,
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
          <button
            onClick={onToggleDescription}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Show Description"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
        {isConsoleCollapsed && (
          <button
            onClick={onToggleConsole}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Show Console"
          >
            <PanelBottomOpen className="w-4 h-4" />
          </button>
        )}
        <div className="h-4 w-px bg-border mx-2" />
        <button
          onClick={() => onRun('run')}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200",
            "bg-secondary/50 text-foreground hover:bg-secondary hover:shadow-lg border border-white/5 disabled:opacity-50"
          )}
        >
          {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          Run
        </button>
        <button
          onClick={() => onRun('submit')}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200",
            "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] border border-primary/20 disabled:opacity-50"
          )}
        >
          <Send className="w-3.5 h-3.5" />
          Submit
        </button>
      </div>
    </header>
  );
}
