import React, { useMemo, useCallback, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Loader2, RotateCcw, Lightbulb, Sparkles, Maximize2, Minimize2, Keyboard, Focus, StickyNote, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/design-system/components';
import { toast } from '@/lib/toast';

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  onMount: OnMount;
  isTimerRunning: boolean;
  timeLeft: number;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onResetCode: () => void;
  onGetHint: () => void;
  onCompleteCode: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isRequestingHint: boolean;
  isCompletingCode: boolean;
  autocompleteEnabled: boolean;
  onToggleAutocomplete: () => void;
  isAIEnabled: boolean;
  formatTime: (seconds: number) => string;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;

  onRun: () => void;
  timerReadOnly?: boolean;
  hideAI?: boolean;
  hideAutocomplete?: boolean;
  hideDividers?: boolean;
  isScratchpadOpen?: boolean;
  onToggleScratchpad?: () => void;
}

// Inner component to isolate Editor from timer re-renders
const InnerEditor = React.memo(({
  initialCode,
  onChange,
  onMount,
  handleEditorWillMount,
  editorOptions
}: {
  initialCode: string;
  onChange: (value: string | undefined) => void;
  onMount: OnMount;
  handleEditorWillMount: (monaco: typeof import('monaco-editor')) => void;
  editorOptions: any;
}) => {
  return (
    <Editor
      height="100%"
      defaultLanguage="javascript"
      theme="vscode-dark"
      defaultValue={initialCode}
      onChange={onChange}
      onMount={onMount}
      beforeMount={handleEditorWillMount}
      options={editorOptions}
      loading={<div className="text-muted-foreground text-sm">Loading editor...</div>}
    />
  );
});

InnerEditor.displayName = 'InnerEditor';

export function CodeEditor({
  code,
  onChange,
  onMount,
  isTimerRunning,
  timeLeft,
  onToggleTimer,
  onResetTimer,
  onResetCode,
  onGetHint,
  onCompleteCode,
  onToggleFullscreen,
  isFullscreen,
  isRequestingHint,
  isCompletingCode,
  autocompleteEnabled,
  onToggleAutocomplete,
  isAIEnabled,
  formatTime,
  isFocusMode,
  onToggleFocusMode,

  onRun,
  timerReadOnly = false,
  hideAI = false,
  hideAutocomplete = false,
  hideDividers = false,
  isScratchpadOpen = false,
  onToggleScratchpad
}: CodeEditorProps) {

  const [hasCopied, setHasCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setHasCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      toast.error('Failed to copy code');
    }
  }, [code]);

  const editorOptions = useMemo(() => ({
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    fontFamily: "'SF Mono', Menlo, monospace",
    fontLigatures: true,
    cursorBlinking: 'smooth' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    smoothScrolling: true,
    contextmenu: true,
    quickSuggestions: autocompleteEnabled,
    suggestOnTriggerCharacters: autocompleteEnabled,
    snippetSuggestions: (autocompleteEnabled ? 'inline' : 'none') as 'inline' | 'none' | 'bottom' | 'top',
    wordBasedSuggestions: (autocompleteEnabled ? 'currentDocument' : 'off') as 'currentDocument' | 'off' | 'matchingDocuments' | 'allDocuments',
    acceptSuggestionOnCommitCharacter: false,
    acceptSuggestionOnEnter: 'off' as const,
    tabCompletion: 'off' as const,
    formatOnType: false,
    formatOnPaste: false,
    // Performance optimizations
    renderWhitespace: 'none',
    renderControlCharacters: false,
    renderLineHighlight: 'line' as const,
    occurrencesHighlight: false,
    renderValidationDecorations: 'off' as const,
    codeLens: false,
    folding: false,
    foldingHighlight: false,
    linkedEditing: false,
    selectionHighlight: false,
  }), [autocompleteEnabled]);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    // Add keyboard shortcut for Run (Cmd+Enter / Ctrl+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });

    // Call the original onMount prop
    onMount(editor, monaco);
  }, [onMount, onRun]);

  const handleEditorWillMount = useCallback((monaco: typeof import('monaco-editor')) => {
    monaco.editor.defineTheme('vscode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955' },
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'string', foreground: 'b5cea8' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'class', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'variable', foreground: '9cdcfe' },
        { token: 'identifier', foreground: '9cdcfe' },
      ],
      colors: {
        'editor.background': '#1e1e1e', // Keep specific editor background
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2f3337',
        'editorCursor.foreground': '#d4d4d4',
        'editorWhitespace.foreground': '#404040',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      }
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/5">
            <span className={cn("text-xs font-mono font-medium tabular-nums", timeLeft < 300 ? "text-destructive" : "text-foreground")}>
              {formatTime(timeLeft)}
            </span>
            {!timerReadOnly && (
              <>
                <button
                  onClick={onToggleTimer}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    isTimerRunning ? "bg-green-500 animate-pulse" : "bg-destructive"
                  )}
                />
                <button
                  onClick={onResetTimer}
                  className="p-0.5 rounded hover:bg-white/10 transition-colors"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAIEnabled && !hideAI && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onGetHint}
                disabled={isRequestingHint}
                className="gap-1.5 text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 border-yellow-400/20"
              >
                {isRequestingHint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                Hint
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCompleteCode}
                disabled={isCompletingCode}
                className="gap-1.5 text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 border-purple-400/20"
              >
                {isCompletingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Complete
              </Button>
            </>
          )}
          {!hideDividers && <div className="w-px h-4 bg-white/10 mx-1" />}

          {!hideAutocomplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAutocomplete}
              className={cn(
                "h-8 w-8 p-0",
                autocompleteEnabled && "text-blue-400 bg-blue-400/10 hover:bg-blue-400/20"
              )}
              title={autocompleteEnabled ? "Disable Autocomplete" : "Enable Autocomplete"}
            >
              <Keyboard className="w-4 h-4" />
            </Button>
          )}

          {onToggleScratchpad && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleScratchpad}
              className={cn(
                "h-8 w-8 p-0",
                isScratchpadOpen && "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
              )}
              title="Scratchpad"
            >
              <StickyNote className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFocusMode}
            className={cn(
              "h-8 w-8 p-0",
              isFocusMode && "text-green-400 bg-green-400/10 hover:bg-green-400/20"
            )}
            title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            <Focus className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className={cn(
              "h-8 w-8 p-0",
              hasCopied && "text-green-400"
            )}
            title="Copy Code"
          >
            {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onResetCode}
            className="h-8 w-8 p-0"
            title="Reset Code"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            className="h-8 w-8 p-0"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative group min-h-0">
        <InnerEditor
          initialCode={code}
          onChange={onChange}
          onMount={handleEditorDidMount}
          handleEditorWillMount={handleEditorWillMount}
          editorOptions={editorOptions}
        />
      </div>
    </div>
  );
}
