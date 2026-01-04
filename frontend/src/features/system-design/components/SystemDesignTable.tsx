import { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EmptyCanvasIllustration } from '@/design-system/illustrations';
import {
    CheckSquare, Square, ChevronUp, ChevronDown, ChevronsUpDown, Filter
} from 'lucide-react';
import { Skeleton } from '@/design-system/components/Skeleton';
import { EmptyState } from '@/design-system/components';
import { useTableSnapHeight } from '@/hooks/useTableSnapHeight';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { TagTooltip } from '@/components/shared/TagTooltip';
import { RowActionMenu } from '@/components/shared/RowActionMenu';
import { SystemDesignRow } from './SystemDesignRow';
import type { SystemDesignProblem } from '@/types/system-design';
import type { SortKey, SortDirection } from '../hooks/useSystemDesignProblems';

interface SystemDesignTableProps {
    problems: SystemDesignProblem[];
    isLoading: boolean;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    sortConfig: { key: SortKey; direction: SortDirection };
    onSort: (key: SortKey) => void;
    selectedIds: Set<string>;
    onToggleSelectAll: () => void;
    onToggleSelectOne: (id: string, shiftKey: boolean, lastSelectedId: string | null) => void;
    onDelete: (id: string) => void;
    onModify: (problem: SystemDesignProblem) => void;
    onClearFilters: () => void;
    hasFilters?: boolean;
}

const ROW_HEIGHT = 52;

export function SystemDesignTable({
    problems,
    isLoading,
    isLoadingMore = false,
    hasMore = false,
    onLoadMore = () => { },
    sortConfig,
    onSort,
    selectedIds,
    onToggleSelectAll,
    onToggleSelectOne,
    onDelete,
    onModify,
    onClearFilters,
    hasFilters = false
}: SystemDesignTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    // Shared hook for height
    const containerHeight = useTableSnapHeight(ROW_HEIGHT);

    // Infinite Scroll
    useInfiniteScroll(parentRef, hasMore, isLoadingMore, onLoadMore, 50);

    // Local state
    const [activeMenu, setActiveMenu] = useState<{ id: string; x: number; y: number } | null>(null);
    const [hoveredTagTooltip, setHoveredTagTooltip] = useState<{ id: string, x: number, y: number, tags: string[], position: 'top' | 'bottom' } | null>(null);
    const lastSelectedId = useRef<string | null>(null);

    // Virtualizer
    const virtualizer = useVirtualizer({
        count: problems.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
    });

    const virtualItems = virtualizer.getVirtualItems();

    // Stable Handlers
    const handleMenuOpen = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (activeMenu?.id === id) {
            setActiveMenu(null);
        } else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const y = spaceBelow < 200 ? rect.top : rect.bottom;
            setActiveMenu({ id, x: rect.right, y });
        }
    }, [activeMenu]);

    const handleTagHover = useCallback((id: string, e: React.MouseEvent, tags: string[]) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const showAbove = spaceBelow < 200;

        setHoveredTagTooltip({
            id,
            x: rect.left + (rect.width / 2),
            y: showAbove ? rect.top : rect.bottom,
            tags,
            position: showAbove ? 'top' : 'bottom'
        });
    }, []);

    const handleTagLeave = useCallback(() => {
        setHoveredTagTooltip(null);
    }, []);

    const handleToggleSelect = useCallback((id: string, shiftKey: boolean) => {
        onToggleSelectOne(id, shiftKey, lastSelectedId.current);
        lastSelectedId.current = id;
    }, [onToggleSelectOne]);

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
    const gridTemplate = "40px minmax(200px, 1fr) 100px minmax(200px, 1.5fr) 100px 50px";

    // Memoize skeleton rows
    const skeletonRows = useMemo(() => [...Array(5)].map((_, i) => (
        <div key={i} className="grid animate-pulse" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="px-4 py-3"><Skeleton className="w-4 h-4 rounded" /></div>
            <div className="px-4 py-3"><Skeleton className="h-4 w-32 rounded" /></div>
            <div className="px-4 py-3"><Skeleton className="h-4 w-16 rounded-full" /></div>
            <div className="px-4 py-3"><Skeleton className="h-4 w-24 rounded" /></div>
            <div className="px-4 py-3"><Skeleton className="h-4 w-20 rounded" /></div>
            <div className="px-4 py-3"></div>
        </div>
    )), [gridTemplate]);

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Sticky Header */}
            <div
                className="grid bg-secondary/30 text-muted-foreground font-medium text-sm border-b border-border"
                style={{ gridTemplateColumns: gridTemplate }}
            >
                <div className="px-4 py-3">
                    <Button
                        variant="ghost"
                        onClick={onToggleSelectAll}
                        className="flex items-center justify-center h-auto w-auto p-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors transition-transform active:scale-95"
                    >
                        {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </Button>
                </div>
                <div
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
                </div>
                <div
                    className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none"
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
                </div>
                <div className="px-4 py-3">Tags</div>
                <div
                    className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none"
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
                </div>
                <div className="px-4 py-3"></div>
            </div>

            {/* Virtualized List */}
            {isLoading ? (
                <div className="divide-y divide-border">
                    {skeletonRows}
                </div>
            ) : problems.length === 0 ? (
                <EmptyState
                    illustration={<EmptyCanvasIllustration className="w-full h-full" />}
                    title="No system design problems yet"
                    description={hasFilters ? "Try adjusting your filters or search query." : "Start building your practice library by creating your first system design problem."}
                    action={hasFilters ? {
                        label: "Clear filters",
                        onClick: onClearFilters,
                        icon: Filter
                    } : undefined}
                    className="py-12"
                />
            ) : (
                <div
                    ref={parentRef}
                    className="overflow-auto scroll-smooth"
                    style={{ height: containerHeight }}
                >
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualItems.map((virtualRow) => {
                            const problem = problems[virtualRow.index];
                            return (
                                <SystemDesignRow
                                    key={problem.id}
                                    problem={problem}
                                    isSelected={selectedIds.has(problem.id)}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    onToggleSelect={handleToggleSelect}
                                    onMenuOpen={handleMenuOpen}
                                    onTagHover={handleTagHover}
                                    onTagLeave={handleTagLeave}
                                    gridTemplate={gridTemplate}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Shared Row Action Menu */}
            {activeMenu && (
                <RowActionMenu
                    id={activeMenu.id}
                    x={activeMenu.x}
                    y={activeMenu.y}
                    onClose={() => setActiveMenu(null)}
                    onModify={handleModifyClick}
                    onDelete={handleDeleteClick}
                />
            )}

            {/* Shared Tag Tooltip */}
            {hoveredTagTooltip && (
                <TagTooltip
                    id={hoveredTagTooltip.id}
                    x={hoveredTagTooltip.x}
                    y={hoveredTagTooltip.y}
                    tags={hoveredTagTooltip.tags}
                    position={hoveredTagTooltip.position}
                />
            )}
        </div>
    );
}
