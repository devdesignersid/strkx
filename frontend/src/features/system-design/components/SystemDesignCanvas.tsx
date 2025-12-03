import { RotateCcw, Maximize2, Minimize2, Focus, PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExcalidrawWrapper from './ExcalidrawWrapper';
import { Button } from '@/design-system/components';

interface SystemDesignCanvasProps {
    excalidrawData: any;
    onChange: (elements: any, appState: any) => void;
    isTimerRunning: boolean;
    timeLeft: number;
    onToggleTimer: () => void;
    onResetTimer: () => void;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
    formatTime: (seconds: number) => string;
    isFocusMode: boolean;
    onToggleFocusMode: () => void;
    onResetCanvas: () => void;
    onCollapse: () => void;
}

export function SystemDesignCanvas({
    excalidrawData,
    onChange,
    isTimerRunning,
    timeLeft,
    onToggleTimer,
    onResetTimer,
    onToggleFullscreen,
    isFullscreen,
    formatTime,
    isFocusMode,
    onToggleFocusMode,
    onResetCanvas,
    onCollapse,
}: SystemDesignCanvasProps) {
    return (
        <div className="flex flex-col h-full bg-[#151515]">
            {/* Canvas Header - matches CodeEditor header */}
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
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onResetTimer}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
                        title="Reset Timer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleFocusMode}
                        className={cn(
                            "h-7 w-7 transition-colors",
                            isFocusMode
                                ? "text-green-400 bg-green-400/10 hover:bg-green-400/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                        title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                    >
                        <Focus className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onResetCanvas}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
                        title="Reset Canvas"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleFullscreen}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>

                    <div className="w-px h-4 bg-white/10 mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCollapse}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
                        title="Collapse Canvas"
                    >
                        <PanelRightClose className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Excalidraw Canvas */}
            <div className="flex-1 relative min-h-0">
                <ExcalidrawWrapper
                    initialData={excalidrawData}
                    onChange={onChange}
                />
            </div>
        </div>
    );
}
