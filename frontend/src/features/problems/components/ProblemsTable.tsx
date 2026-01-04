import { useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  CheckSquare, Square, ChevronUp, ChevronDown, ChevronsUpDown, X
} from 'lucide-react';
import { Skeleton } from '@/design-system/components/Skeleton';
import { EmptyState } from '@/design-system/components';
import { EmptyProblemsIllustration } from '@/design-system/illustrations';
import { useTableSnapHeight } from '@/hooks/useTableSnapHeight';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { TagTooltip } from '@/components/shared/TagTooltip';
import { RowActionMenu } from '@/components/shared/RowActionMenu';
import { ProblemRow } from './ProblemRow';
import type { Problem, SortKey, SortDirection } from '@/features/problems/hooks/useProblems';

interface ProblemsTableProps {
  problems: Problem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  sortConfig: { key: SortKey; direction: SortDirection };
  onSort: (key: SortKey) => void;
  selectedIds: Set<string>;
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: string, shiftKey: boolean, lastSelectedId: string | null) => void;
  onDelete: (id: string) => void;
  onLoadMore: () => void;
  onClearFilters: () => void;
  hasFilters?: boolean;
}

const ROW_HEIGHT = 52;

export function ProblemsTable({
  problems,
  isLoading,
  isLoadingMore,
  hasMore,
  sortConfig,
  onSort,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectOne,
  onDelete,
  onLoadMore,
  onClearFilters,
  hasFilters = false
}: ProblemsTableProps) {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);

  // Shared hooks for height and scroll
  const containerHeight = useTableSnapHeight(ROW_HEIGHT);
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

  // Stable Handlers for Memoization
  const handleMenuOpen = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (activeMenu?.id === id) {
      setActiveMenu(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      // Adjust position if content would be clipped
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

  const handleModify = (id: string) => {
    navigate(`/problems/edit/${id}`);
    setActiveMenu(null);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setActiveMenu(null);
  };

  const isAllSelected = problems.length > 0 && selectedIds.size === problems.length;
  const gridTemplate = "40px minmax(200px, 1fr) 100px minmax(200px, 1.5fr) 100px 50px";

  // Memoize skeleton rows to avoid re-creation
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
          <button
            onClick={onToggleSelectAll}
            className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors transition-transform active:scale-95"
          >
            {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
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
          illustration={<EmptyProblemsIllustration className="w-full h-full" />}
          title="No problems found"
          description={hasFilters ? "Try adjusting your filters or search query." : "Create your first problem to get started."}
          action={hasFilters ? {
            label: "Clear all filters",
            onClick: onClearFilters,
            icon: X
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
                <ProblemRow
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

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading more...
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
          onModify={handleModify}
          onDelete={handleDelete}
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
