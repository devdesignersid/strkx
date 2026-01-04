import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Square, MoreHorizontal, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, getDifficultyVariant } from '@/design-system/components';
import type { Problem } from '@/features/problems/hooks/useProblems';

interface ProblemRowProps {
    problem: Problem;
    style: React.CSSProperties;
    isSelected: boolean;
    onToggleSelect: (id: string, shiftKey: boolean) => void;
    onMenuOpen: (e: React.MouseEvent, id: string) => void;
    onTagHover: (id: string, e: React.MouseEvent, tags: string[]) => void;
    onTagLeave: () => void;
    gridTemplate: string;
}

export const ProblemRow = memo(({
    problem,
    style,
    isSelected,
    onToggleSelect,
    onMenuOpen,
    onTagHover,
    onTagLeave,
    gridTemplate
}: ProblemRowProps) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/problems/${problem.slug}`)}
            className={cn(
                "grid items-center border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer text-sm group",
                isSelected && "bg-primary/5 hover:bg-primary/10"
            )}
            style={{
                ...style,
                display: 'grid',
                gridTemplateColumns: gridTemplate
            }}
        >
            <div className="px-4 py-3 flex items-center">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(problem.id, e.shiftKey);
                    }}
                    className={cn(
                        "flex items-center justify-center transition-colors hover:scale-110 active:scale-95",
                        isSelected ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                >
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
            </div>

            <div className="px-4 py-3 font-medium text-foreground group-hover:text-primary transition-colors">
                <div className="truncate" title={problem.title}>
                    {problem.title}
                </div>
            </div>

            <div className="px-4 py-3">
                <StatusBadge
                    status={problem.difficulty}
                    variant={getDifficultyVariant(problem.difficulty)}
                />
            </div>

            <div className="px-4 py-3">
                <div className="flex items-center flex-wrap gap-1.5">
                    {problem.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border">
                            {tag}
                        </span>
                    ))}
                    {problem.tags.length > 3 && (
                        <span
                            className="relative inline-block text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border cursor-help hover:bg-secondary transition-colors"
                            onMouseEnter={(e) => onTagHover(problem.id, e, problem.tags.slice(3))}
                            onMouseLeave={onTagLeave}
                        >
                            +{problem.tags.length - 3}
                        </span>
                    )}
                </div>
            </div>

            <div className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <StatusBadge
                        status={problem.status}
                        icon={problem.status === 'Solved' ? CheckCircle2 : problem.status === 'Attempted' ? Circle : Circle}
                        variant={problem.status === 'Solved' ? 'success' : problem.status === 'Attempted' ? 'warning' : 'neutral'}
                        className="border-none bg-transparent p-0"
                    />
                </div>
            </div>

            <div className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => onMenuOpen(e, problem.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.problem === next.problem &&
        prev.isSelected === next.isSelected &&
        prev.style.transform === next.style.transform // Only re-render if position changes (scrolling) or selection
    );
});
