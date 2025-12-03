import { Terminal as TerminalIcon, CheckCircle2, XCircle, PanelBottomClose } from 'lucide-react';
import type { ExecutionResult } from '@/types/problem';
import { cn } from '@/lib/utils';
import { Button } from '@/design-system/components';

interface ConsolePanelProps {
  output: ExecutionResult | null;
  isRunning: boolean;
  onCollapse: () => void;
}

export function ConsolePanel({ output, isRunning, onCollapse }: ConsolePanelProps) {
  return (
    <div className="flex flex-col h-full bg-card border-t border-border">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Console</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCollapse}
          className="h-8 w-8 p-0"
        >
          <PanelBottomClose className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {!output && !isRunning && (
          <div className="text-muted-foreground">Run your code to see output here.</div>
        )}
        {isRunning && (
          <div className="text-muted-foreground animate-pulse pb-4">Running code...</div>
        )}
        {output && (
          <div className="space-y-4">
            <div className={cn(
              "p-3 rounded-lg border",
              output.passed
                ? "bg-green-500/10 border-green-500/20 text-green-500"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            )}>
              <div className="flex items-center gap-2 font-medium mb-1">
                {output.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {output.passed ? 'All Test Cases Passed' : 'Test Cases Failed'}
              </div>
              {output.error && (
                <div className="text-xs mt-1 opacity-90 whitespace-pre-wrap">{output.error}</div>
              )}
            </div>

            <div className="space-y-2">
              {output.results.map((result, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    {result.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-destructive" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">Test Case {i + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-1">Input</span>
                      <code className="bg-black/30 px-2 py-1 rounded block">{result.input}</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Expected Output</span>
                      <code className="bg-black/30 px-2 py-1 rounded block">{result.expectedOutput}</code>
                    </div>
                  </div>
                  {!result.passed && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <span className="text-muted-foreground block mb-1 text-xs">Actual Output</span>
                      <code className="bg-destructive/10 text-destructive px-2 py-1 rounded block text-xs">
                        {result.actualOutput === undefined ? 'undefined' : (result.actualOutput === null ? 'null' : (result.actualOutput === '' ? 'Empty String' : result.actualOutput))}
                      </code>
                      {result.error && (
                        <div className="mt-2 text-destructive text-xs bg-destructive/10 px-2 py-1 rounded border border-destructive/20">
                          <span className="font-semibold mr-1">Error:</span>
                          {result.error}
                        </div>
                      )}
                    </div>
                  )}
                  {result.logs && result.logs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground">
                        <TerminalIcon className="w-3 h-3" />
                        <span>Console Output</span>
                      </div>
                      <div className="bg-black/50 border border-white/5 px-3 py-2 rounded-md block text-xs font-mono text-white/90 space-y-1 overflow-x-auto">
                        {result.logs.map((log, j) => (
                          <div key={j} className="whitespace-pre-wrap break-all">{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
