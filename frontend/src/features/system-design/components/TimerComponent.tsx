import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Square } from 'lucide-react';

interface TimerComponentProps {
    duration: number; // in minutes
    onTimeUp?: () => void;
    onTimeChange?: (seconds: number) => void;
}

export default function TimerComponent({
    duration,
    onTimeUp,
    onTimeChange,
}: TimerComponentProps) {
    const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds
    const [isRunning, setIsRunning] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining((prev) => {
                    const newTime = prev - 1;
                    if (newTime <= 0) {
                        setIsRunning(false);
                        onTimeUp?.();
                        return 0;
                    }
                    return newTime;
                });
                setTimeSpent((prev) => prev + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isRunning, timeRemaining, onTimeUp]);

    // Report time spent
    useEffect(() => {
        onTimeChange?.(timeSpent);
    }, [timeSpent, onTimeChange]);

    const handleStartPause = useCallback(() => {
        setIsRunning((prev) => !prev);
    }, []);

    const handleReset = useCallback(() => {
        setTimeRemaining(duration * 60);
        setTimeSpent(0);
        setIsRunning(false);
    }, [duration]);

    const handleStop = useCallback(() => {
        setIsRunning(false);
    }, []);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Determine if we're in warning zone (< 5 minutes)
    const isWarning = timeRemaining > 0 && timeRemaining < 300;

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-md">
            <div
                className={`text-lg font-mono tabular-nums ${isWarning
                        ? 'text-orange-400 animate-pulse'
                        : timeRemaining === 0
                            ? 'text-red-400'
                            : 'text-foreground'
                    }`}
            >
                {formatTime(timeRemaining)}
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={handleStartPause}
                    className="p-1.5 rounded hover:bg-secondary transition-colors"
                    title={isRunning ? 'Pause' : 'Start'}
                >
                    {isRunning ? (
                        <Pause className="w-4 h-4" />
                    ) : (
                        <Play className="w-4 h-4" />
                    )}
                </button>

                <button
                    onClick={handleStop}
                    className="p-1.5 rounded hover:bg-secondary transition-colors"
                    title="Stop"
                    disabled={!isRunning}
                >
                    <Square className="w-4 h-4" />
                </button>

                <button
                    onClick={handleReset}
                    className="p-1.5 rounded hover:bg-secondary transition-colors"
                    title="Reset"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            <div className="text-xs text-muted-foreground">
                Spent: {formatTime(timeSpent)}
            </div>
        </div>
    );
}
