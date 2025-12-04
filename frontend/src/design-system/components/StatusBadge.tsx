import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatusBadgeProps {
    status: string;
    icon?: LucideIcon;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'easy' | 'medium' | 'hard' | 'system-design';
    className?: string;
}

const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    neutral: "bg-secondary text-muted-foreground border-border",
    // Difficulty variants for consistent usage across problems
    easy: "bg-green-500/10 text-green-500 border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    hard: "bg-red-500/10 text-red-500 border-red-500/20",
    "system-design": "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export function StatusBadge({ status, icon: Icon, variant = 'default', className }: StatusBadgeProps) {
    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
            variants[variant],
            className
        )}>
            {Icon && <Icon className="w-3 h-3" />}
            <span className="capitalize">{status}</span>
        </div>
    );
}

// Helper to convert difficulty string to variant
export function getDifficultyVariant(difficulty: string): StatusBadgeProps['variant'] {
    const normalized = difficulty.toLowerCase().replace(/\s+/g, '-');
    if (normalized === 'easy') return 'easy';
    if (normalized === 'medium') return 'medium';
    if (normalized === 'hard') return 'hard';
    if (normalized === 'system-design') return 'system-design';
    return 'neutral';
}
