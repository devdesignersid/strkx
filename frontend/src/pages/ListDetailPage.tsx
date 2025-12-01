import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { createPortal } from 'react-dom';
import {
  Search, CheckCircle2, Circle,
  ChevronUp, ChevronDown, Filter,
  CheckSquare, Square, MoreHorizontal,
  X, Check, ChevronsUpDown, FolderMinus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { API_URL } from '@/config';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  status: 'Solved' | 'Todo' | 'Attempted';
  acceptance: number;
  type?: 'coding' | 'system-design';
}

interface ListDetail {
  id: string;
  name: string;
  description: string | null;
  problems: { problem: Problem }[];
}

type SortKey = 'title' | 'difficulty' | 'status' | 'acceptance';
type SortDirection = 'asc' | 'desc';

export default function ListDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<ListDetail | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterDifficulties, setFilterDifficulties] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [hoveredTagTooltip, setHoveredTagTooltip] = useState<{ id: string, x: number, y: number, tags: string[], position: 'top' | 'bottom' } | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'title',
    direction: 'asc'
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeMenu, setActiveMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const lastSelectedId = useRef<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const LIMIT = 20;

  // Fetch List Details
  const fetchListDetails = async (page: number, isReset: boolean = false) => {
    if (isReset) setIsLoading(true);

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', LIMIT.toString());
    if (searchQuery) params.append('search', searchQuery);
    if (filterDifficulties.length) params.append('difficulty', filterDifficulties.join(','));
    if (filterStatus.length) params.append('status', filterStatus.join(','));
    if (filterTags.length) params.append('tags', filterTags.join(','));
    params.append('sort', sortConfig.key);
    params.append('order', sortConfig.direction);

    try {
      const res = await axios.get(`${API_URL}/lists/${id}?${params.toString()}`, { withCredentials: true });
      setList(res.data.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const extractedProblems = res.data.data.problems.map((p: any) => ({
        ...p.problem,
        // Mock acceptance if missing
        acceptance: p.problem.acceptance || Math.floor(Math.random() * 60) + 20,
      }));

      if (isReset) {
        setProblems(extractedProblems);
        setCurrentPage(1);
      } else {
        setProblems(prev => [...prev, ...extractedProblems]);
        setCurrentPage(page);
      }
      setHasMore(res.data.data.hasMore);
    } catch (error) {
      console.error('Failed to fetch list details:', error);
      toast.error(TOAST_MESSAGES.LISTS.LOAD_DETAILS_FAILED);
      if (isReset) navigate('/lists');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (id) {
      const timer = setTimeout(() => {
        fetchListDetails(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [id, searchQuery, filterDifficulties, filterStatus, filterTags, sortConfig]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchListDetails(currentPage + 1, false);
  };

  // Use problems directly
  const processedProblems = problems;

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === processedProblems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedProblems.map(p => p.id)));
    }
  };

  const toggleSelectOne = (problemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);

    if (e.shiftKey && lastSelectedId.current) {
      const start = processedProblems.findIndex(p => p.id === lastSelectedId.current);
      const end = processedProblems.findIndex(p => p.id === problemId);
      if (start !== -1 && end !== -1) {
        const [lower, upper] = start < end ? [start, end] : [end, start];
        for (let i = lower; i <= upper; i++) {
          newSet.add(processedProblems[i].id);
        }
      } else {
        if (newSet.has(problemId)) newSet.delete(problemId);
        else newSet.add(problemId);
      }
    } else {
      if (newSet.has(problemId)) newSet.delete(problemId);
      else newSet.add(problemId);
      lastSelectedId.current = problemId;
    }
    setSelectedIds(newSet);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!filterTags.includes(tagInput.trim())) {
        setFilterTags([...filterTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleMenuClick = (e: React.MouseEvent, problemId: string) => {
    e.stopPropagation();
    if (activeMenu?.id === problemId) {
      setActiveMenu(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setActiveMenu({ id: problemId, x: rect.right, y: rect.bottom });
    }
  };

  const handleRemoveFromList = async (problemIdsToRemove: string[]) => {
    if (!id) return;
    try {
      await axios.delete(`${API_URL}/lists/${id}/problems`, {
        withCredentials: true,
        data: { problemIds: problemIdsToRemove }
      });
      setProblems(problems.filter(p => !problemIdsToRemove.includes(p.id)));
      setSelectedIds(new Set());
      toast.success({
        title: TOAST_MESSAGES.LISTS.PROBLEM_REMOVED.title,
        description: `Removed ${problemIdsToRemove.length} problem(s) from list`
      });
    } catch (error) {
      console.error('Failed to remove problems:', error);
      toast.error(TOAST_MESSAGES.LISTS.REMOVE_FAILED);
    }
  };

  const isAllSelected = processedProblems.length > 0 && selectedIds.size === processedProblems.length;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-8">
          <Breadcrumb items={[
            { label: 'Problem Lists', path: '/lists' },
            { label: list?.name || 'Loading...' }
          ]} />
          {/* Header */}
          <div className="mb-8">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">{list?.name}</h1>
                <p className="text-muted-foreground">{list?.description || "No description"}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="bg-secondary/30 px-2 py-1 rounded-md border border-white/5">
                    {problems.length} problems
                  </span>
                  <span>
                    Updated {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-end md:items-center">
            <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search in list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Unified Filter */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                    isFilterOpen || filterDifficulties.length > 0 || filterStatus.length > 0 || filterTags.length > 0
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {(filterDifficulties.length + filterStatus.length + filterTags.length) > 0 && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {filterDifficulties.length + filterStatus.length + filterTags.length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-4"
                    >
                      {/* Reuse filter UI from ProblemsPage - keeping it simple here */}
                      <div className="space-y-4">
                        {/* Difficulty */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Difficulty</h4>
                          <div className="space-y-1.5">
                            {['Easy', 'Medium', 'Hard'].map(diff => (
                              <div key={diff} className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:opacity-80" onClick={() => setFilterDifficulties(prev => prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff])}>
                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", filterDifficulties.includes(diff) ? "bg-primary border-primary text-primary-foreground" : "border-border bg-secondary")}>
                                  {filterDifficulties.includes(diff) && <Check className="w-3 h-3" />}
                                </div>
                                {diff}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="h-px bg-border" />
                        {/* Status */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Status</h4>
                          <div className="space-y-1.5">
                            {['Todo', 'Solved', 'Attempted'].map(status => (
                              <div key={status} className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:opacity-80" onClick={() => setFilterStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])}>
                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", filterStatus.includes(status) ? "bg-primary border-primary text-primary-foreground" : "border-border bg-secondary")}>
                                  {filterStatus.includes(status) && <Check className="w-3 h-3" />}
                                </div>
                                {status}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="h-px bg-border" />
                        {/* Tags */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Tags</h4>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {filterTags.map(tag => (
                              <span key={tag} className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {tag}
                                <button onClick={() => setFilterTags(prev => prev.filter(t => t !== tag))} className="hover:text-primary/70">
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Add tag..."
                            className="w-full bg-secondary/50 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/30 text-muted-foreground font-medium border-b border-border">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-foreground transition-colors group select-none"
                      onClick={() => handleSort('title')}
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
                      onClick={() => handleSort('difficulty')}
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
                      onClick={() => handleSort('status')}
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
                    processedProblems.map((problem) => (
                      <tr
                        key={problem.id}
                        onClick={() => navigate(problem.type === 'system-design' ? `/system-design/${problem.slug}` : `/problems/${problem.slug}`)}
                        className={cn(
                          "group hover:bg-secondary/30 transition-colors cursor-pointer",
                          selectedIds.has(problem.id) && "bg-primary/5 hover:bg-primary/10"
                        )}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => toggleSelectOne(problem.id, e)}
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
                                  const showAbove = spaceBelow < 200; // If less than 200px below, show above

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
                            {problem.status === 'Solved' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : problem.status === 'Attempted' ? (
                              <Circle className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground/30" />
                            )}
                            <span className="text-xs text-muted-foreground">{problem.status}</span>
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

            {/* Load More Button */}
            {!isLoading && hasMore && problems.length > 0 && (
              <div className="flex justify-center py-6">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}

            {!isLoading && processedProblems.length === 0 && (
              <EmptyState
                icon={Filter}
                title="No problems in this list"
                description="Add problems from the main Problems page."
                action={{
                  label: "Browse Problems",
                  onClick: () => navigate('/problems')
                }}
                className="py-12"
              />
            )}
          </div>
        </div>

        {/* Floating Action Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-white/10 rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 z-50"
            >
              <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {selectedIds.size}
                </div>
                <span className="text-sm font-medium">Selected</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRemoveFromList(Array.from(selectedIds))}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-sm font-medium text-muted-foreground"
                >
                  <FolderMinus className="w-4 h-4" />
                  Remove from List
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-md transition-colors text-sm font-medium text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                left: activeMenu.x - 128 // Align right edge (w-32 = 128px)
              }}
              className="w-32 bg-card border border-border rounded-lg shadow-xl overflow-hidden row-action-menu-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
                onClick={() => {
                  handleRemoveFromList([activeMenu.id]);
                  setActiveMenu(null);
                }}
              >
                <FolderMinus className="w-3.5 h-3.5" />
                Remove
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
    </div>
  );
}
