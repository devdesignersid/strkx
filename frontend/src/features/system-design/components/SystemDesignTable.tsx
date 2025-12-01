import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
    CheckSquare, Square, ChevronUp, ChevronDown, ChevronsUpDown,
    Circle, MoreHorizontal, Edit, Trash2, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import type { SystemDesignProblem } from '@/types/system-design';
import type { SortKey, SortDirection } from '../hooks/useSystemDesignProblems';

interface SystemDesignTableProps {
    problems: SystemDesignProblem[];
    isLoading: boolean;
    sortConfig: { key: SortKey; direction: SortDirection };
    onSort: (key: SortKey) => void;
    selectedIds: Set<string>;
    onToggleSelectAll: () => void;
    onToggleSelectOne: (id: string, shiftKey: boolean, lastSelectedId: string | null) => void;
    onDelete: (id: string) => void;
    onModify: (problem: SystemDesignProblem) => void;
    onClearFilters: () => void;
}

export function SystemDesignTable({
    problems,
    isLoading,
    sortConfig,
    onSort,
    selectedIds,
    onToggleSelectAll,
    onToggleSelectOne,
    onDelete,
    onModify,
    onClearFilters
}: SystemDesignTableProps) {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState<{ id: string; x: number; y: number } | null>(null);
    const [hoveredTagTooltip, setHoveredTagTooltip] = useState<{ id: string, x: number, y: number, tags: string[], position: 'top' | 'bottom' } | null>(null);
    const lastSelectedId = useState<{ current: string | null }>({ current: null })[0];

    const handleMenuClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (activeMenu?.id === id) {
            setActiveMenu(null);
        } else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setActiveMenu({ id, x: rect.right, y: rect.bottom });
        }
    };

    const handleModifyClick = (id: string) => {
        const problem = problems.find(p => p.id === id);
        if (problem) {
            onModify(problem);
        }
        setActiveMenu(null);
    };

    const handleDeleteClick = (id: string) => {
        onDelete(id);
        setActiveMenu(null);
    };

    const isAllSelected = problems.length > 0 && selectedIds.size === problems.length;

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/30 text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <button
                                    onClick={onToggleSelectAll}
                                    className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                </button>
                            </th>
                            <th
                                className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none"
                                onClick={() => onSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    Title
                                    {sortConfig.key === 'title' ? (
                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                    ) : (
                                        <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none w-32"
                                onClick={() => onSort('difficulty')}
                            >
                                <div className="flex items-center gap-1">
                                    Difficulty
                                    {sortConfig.key === 'difficulty' ? (
                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                    ) : (
                                        <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    )}
                                </div>
                            </th>
                            <th className="px-4 py-3">Tags</th>
                            <th
                                className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none w-32"
                                onClick={() => onSort('status')}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    {sortConfig.key === 'status' ? (
                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                    ) : (
                                        <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    )}
                                </div>
                            </th>
                            <th className="px-4 py-3 w-16 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-4 py-3"><Skeleton className="w-4 h-4 rounded" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-32 rounded" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 rounded-full" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-24 rounded" /></td>
                                    <td className="px-4 py-3"><Skeleton className="h-4 w-20 rounded" /></td>
                                    <td className="px-4 py-3"></td>
                                </tr>
                            ))
                        ) : (
                            problems.map((problem) => (
                                <tr
                                    key={problem.id}
                                    onClick={() => navigate(`/system-design/${problem.id}`)}
                                    className={cn(
                                        "group hover:bg-secondary/30 transition-colors cursor-pointer",
                                        selectedIds.has(problem.id) && "bg-primary/5 hover:bg-primary/10"
                                    )}
                                >
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleSelectOne(problem.id, e.shiftKey, lastSelectedId.current);
                                                lastSelectedId.current = problem.id;
                                            }}
                                            className={cn(
                                                "flex items-center justify-center transition-colors",
                                                selectedIds.has(problem.id) ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
                                            )}
                                        >
                                            {selectedIds.has(problem.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-foreground group-hover:text-primary transition-colors">
                                        {problem.title}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                            problem.difficulty === 'Easy' && "bg-green-500/10 text-green-500 border-green-500/20",
                                            problem.difficulty === 'Medium' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                                            problem.difficulty === 'Hard' && "bg-red-500/10 text-red-500 border-red-500/20",
                                        )}>
                                            {problem.difficulty}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center flex-wrap gap-1.5">
                                            {problem.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-white/5">
                                                    {tag}
                                                </span>
                                            ))}
                                            {problem.tags.length > 3 && (
                                                <span
                                                    className="relative inline-block text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-white/5 cursor-help"
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const viewportHeight = window.innerHeight;
                                                        const spaceBelow = viewportHeight - rect.bottom;
                                                        const showAbove = spaceBelow < 200;

                                                        setHoveredTagTooltip({
                                                            id: problem.id,
                                                            x: rect.left + (rect.width / 2),
                                                            y: showAbove ? rect.top : rect.bottom,
                                                            tags: problem.tags.slice(3),
                                                            position: showAbove ? 'top' : 'bottom'
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHoveredTagTooltip(null)}
                                                >
                                                    +{problem.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {/* TODO: Integrate real status */}
                                            <Circle className="w-4 h-4 text-muted-foreground/30" />
                                            <span className="text-xs text-muted-foreground">Todo</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right relative">
                                        <button
                                            onClick={(e) => handleMenuClick(e, problem.id)}
                                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors row-action-menu-trigger"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && problems.length === 0 && (
                <EmptyState
                    icon={Filter}
                    title="No problems found"
                    description="Try adjusting your filters or search query."
                    action={{
                        label: "Clear all filters",
                        onClick: onClearFilters
                    }}
                    className="py-12"
                />
            )}

            {/* Portal for Menu */}
            {activeMenu && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-start justify-start"
                    onClick={() => setActiveMenu(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            top: activeMenu.y + 5,
                            left: activeMenu.x - 128
                        }}
                        className="w-32 bg-card border border-border rounded-lg shadow-xl overflow-hidden row-action-menu-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors text-left"
                            onClick={() => handleModifyClick(activeMenu.id)}
                        >
                            <Edit className="w-3.5 h-3.5" />
                            Modify
                        </button>
                        <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
                            onClick={() => handleDeleteClick(activeMenu.id)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* Tag Tooltip Portal */}
            {hoveredTagTooltip && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: hoveredTagTooltip.x,
                        top: hoveredTagTooltip.y,
                        transform: `translate(-50%, ${hoveredTagTooltip.position === 'top' ? '-100%' : '0'})`,
                        marginTop: hoveredTagTooltip.position === 'bottom' ? '8px' : '-8px',
                    }}
                >
                    <div className="bg-popover border border-border rounded-md shadow-xl px-3 py-2 text-xs text-popover-foreground w-max max-w-md">
                        {Array.from({ length: Math.ceil(hoveredTagTooltip.tags.length / 4) }).map((_, i) => (
                            <div key={i} className="whitespace-nowrap">
                                {hoveredTagTooltip.tags.slice(i * 4, (i + 1) * 4).join(', ')}
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
