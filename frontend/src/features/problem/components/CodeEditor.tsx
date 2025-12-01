import React, { useMemo, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Loader2, RotateCcw, Lightbulb, Sparkles, Maximize2, Minimize2, Keyboard, Focus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  onRun
}: CodeEditorProps) {

  const editorOptions = useMemo(() => ({
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
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
        'editor.background': '#1e1e1e',
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
            <span className={cn("text-xs font-mono font-medium tabular-nums", timeLeft < 300 ? "text-red-400" : "text-foreground")}>
              {formatTime(timeLeft)}
            </span>
            <button
              onClick={onToggleTimer}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                isTimerRunning ? "bg-green-500 animate-pulse" : "bg-red-500"
              )}
            />
          </div>
          <button
            onClick={onResetTimer}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isAIEnabled && (
            <>
              <button
                onClick={onGetHint}
                disabled={isRequestingHint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/20 transition-colors disabled:opacity-50"
              >
                {isRequestingHint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                Hint
              </button>
              <button
                onClick={onCompleteCode}
                disabled={isCompletingCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 border border-purple-400/20 transition-colors disabled:opacity-50"
              >
                {isCompletingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Complete
              </button>
            </>
          )}
          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            onClick={onToggleAutocomplete}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              autocompleteEnabled
                ? "text-blue-400 bg-blue-400/10 hover:bg-blue-400/20"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
            title={autocompleteEnabled ? "Disable Autocomplete" : "Enable Autocomplete"}
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleFocusMode}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isFocusMode
                ? "text-green-400 bg-green-400/10 hover:bg-green-400/20"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
            title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            <Focus className="w-4 h-4" />
          </button>

          <button
            onClick={onResetCode}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
            title="Reset Code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
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
