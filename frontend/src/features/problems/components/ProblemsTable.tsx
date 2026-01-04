import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  CheckSquare, Square, ChevronUp, ChevronDown, ChevronsUpDown,
  CheckCircle2, Circle, MoreHorizontal, Edit, Trash2, ChevronDown as ChevronDownIcon, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/design-system/components/Skeleton';
import { EmptyState, Button, StatusBadge, getDifficultyVariant } from '@/design-system/components';
import { EmptyProblemsIllustration } from '@/design-system/illustrations';
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

const ROW_HEIGHT = 52; // Fixed row height for virtualization

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
  const [activeMenu, setActiveMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [hoveredTagTooltip, setHoveredTagTooltip] = useState<{ id: string, x: number, y: number, tags: string[], position: 'top' | 'bottom' } | null>(null);
  const lastSelectedId = useRef<string | null>(null);

  // Setup virtualizer
  const virtualizer = useVirtualizer({
    count: problems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5, // Render 5 extra rows above/below viewport for smooth scrolling
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Auto-load more when scrolling near the end - using scroll event for reliability
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      // Load more when within 200px of the bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

      if (isNearBottom && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    // Check on mount in case we start near bottom
    handleScroll();

    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, onLoadMore]);

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (activeMenu?.id === id) {
      setActiveMenu(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setActiveMenu({ id, x: rect.right, y: rect.bottom });
    }
  };

  const handleModify = (id: string) => {
    navigate(`/problems/edit/${id}`);
    setActiveMenu(null);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setActiveMenu(null);
  };

  const isAllSelected = problems.length > 0 && selectedIds.size === problems.length;

  // Column grid template for consistent alignment - matches original table proportions
  const gridTemplate = "40px minmax(200px, 1fr) 100px minmax(200px, 1.5fr) 100px 50px";

  const renderRow = (problem: Problem, style: React.CSSProperties) => (
    <div
      key={problem.id}
      onClick={() => navigate(`/problems/${problem.slug}`)}
      className={cn(
        "grid items-center border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer text-sm",
        selectedIds.has(problem.id) && "bg-primary/5 hover:bg-primary/10"
      )}
      style={{ ...style, display: 'grid', gridTemplateColumns: gridTemplate }}
    >
      {/* Checkbox */}
      <div className="px-4 py-3 flex items-center">
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
      </div>

      {/* Title */}
      <div className="px-4 py-3 font-medium text-foreground hover:text-primary transition-colors">
        <div className="truncate" title={problem.title}>
          {problem.title}
        </div>
      </div>

      {/* Difficulty */}
      <div className="px-4 py-3">
        <StatusBadge
          status={problem.difficulty}
          variant={getDifficultyVariant(problem.difficulty)}
        />
      </div>

      {/* Tags */}
      <div className="px-4 py-3">
        <div className="flex items-center flex-wrap gap-1.5">
          {problem.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border">
              {tag}
            </span>
          ))}
          {problem.tags.length > 3 && (
            <span
              className="relative inline-block text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border cursor-help"
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
      </div>

      {/* Status */}
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

      {/* Actions */}
      <div className="px-4 py-3 text-right">
        <button
          onClick={(e) => handleMenuClick(e, problem.id)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Calculate container height to snap to row multiples for clean display
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const updateHeight = () => {
      // Available height calculation (viewport - header - spacing)
      const available = window.innerHeight - 350;
      // Snap to nearest row height to avoid partial rows
      const rows = Math.floor(available / ROW_HEIGHT);
      // Ensure minimum height
      const snapped = Math.max(rows * ROW_HEIGHT, 400);
      setContainerHeight(snapped);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

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
            className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid animate-pulse" style={{ gridTemplateColumns: gridTemplate }}>
              <div className="px-4 py-3"><Skeleton className="w-4 h-4 rounded" /></div>
              <div className="px-4 py-3"><Skeleton className="h-4 w-32 rounded" /></div>
              <div className="px-4 py-3"><Skeleton className="h-4 w-16 rounded-full" /></div>
              <div className="px-4 py-3"><Skeleton className="h-4 w-24 rounded" /></div>
              <div className="px-4 py-3"><Skeleton className="h-4 w-20 rounded" /></div>
              <div className="px-4 py-3"></div>
            </div>
          ))}
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
          className="overflow-auto"
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
              return renderRow(problem, {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              });
            })}
          </div>
        </div>
      )
      }

      {/* Loading More Indicator */}
      {
        isLoadingMore && (
          <div className="flex justify-center py-4 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading more...
            </div>
          </div>
        )
      }

      {/* Manual Load More Button (fallback if auto-load doesn't trigger) */}
      {
        !isLoading && !isLoadingMore && hasMore && problems.length > 0 && (
          <div className="flex justify-center py-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onLoadMore}
              size="sm"
            >
              <ChevronDownIcon className="w-4 h-4" />
              Load More
            </Button>
          </div>
        )
      }

      {/* Portal for Menu */}
      {
        activeMenu && createPortal(
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
                onClick={() => handleModify(activeMenu.id)}
              >
                <Edit className="w-3.5 h-3.5" />
                Modify
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
                onClick={() => handleDelete(activeMenu.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </motion.div>
          </div>,
          document.body
        )
      }

      {/* Tag Tooltip Portal */}
      {
        hoveredTagTooltip && createPortal(
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
        )
      }
    </div >
  );
}
