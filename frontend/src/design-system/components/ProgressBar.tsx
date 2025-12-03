import { cn } from '@/lib/utils';

interface ProgressBarProps {
    value: number;
    max?: number;
    className?: string;
    colorClass?: string;
    showLabel?: boolean;
    label?: string;
}

export function ProgressBar({
    value,
    max = 100,
    className,
    colorClass = "bg-primary",
    showLabel = false,
    label
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={cn("w-full", className)}>
            {showLabel && (
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{label || "Progress"}</span>
                    <span className={percentage === 100 ? "text-green-500 font-medium" : ""}>
                        {value} / {max}
                    </span>
                </div>
            )}
            <div
                className="h-1.5 w-full bg-secondary rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={label || "Progress"}
            >
                <div
                    className={cn("h-full rounded-full transition-all duration-500 ease-out", colorClass)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
