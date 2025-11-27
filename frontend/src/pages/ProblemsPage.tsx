import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createPortal } from 'react-dom';
import {
  Search, Plus, CheckCircle2, Circle,
  ChevronUp, ChevronDown, Filter,
  CheckSquare, Square, MoreHorizontal,
  Trash2, Edit, X, Check, ChevronsUpDown, FolderPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import AddToListModal from '@/components/lists/AddToListModal';
import { motion, AnimatePresence } from 'framer-motion';

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  status: 'Solved' | 'Todo' | 'Attempted';
  acceptance: number;
}

type SortKey = 'title' | 'difficulty' | 'status' | 'acceptance';
type SortDirection = 'asc' | 'desc';

export default function ProblemsPage() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterDifficulties, setFilterDifficulties] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [hoveredTagTooltip, setHoveredTagTooltip] = useState<{id: string, x: number, y: number, tags: string[], position: 'top' | 'bottom'} | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'title',
    direction: 'asc'
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; title: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeMenu, setActiveMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const lastSelectedId = useRef<string | null>(null);

  // Pagination for API-based lazy loading
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    setIsLoading(true);
    // Fetch first page
    axios.get(`http://localhost:3000/problems?page=1&limit=${LIMIT}`)
      .then(res => {
        const { problems: fetchedProblems, hasMore: more } = res.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enriched = fetchedProblems.map((p: any) => ({
            ...p,
            acceptance: p.acceptance || Math.floor(Math.random() * 60) + 20
        }));
        setProblems(enriched);
        setHasMore(more);
        setCurrentPage(1);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter & Sort Logic
  const processedProblems = useMemo(() => {
    let result = [...problems];

    // 1. Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q));
    }

    if (filterDifficulties.length > 0) {
      result = result.filter(p => filterDifficulties.includes(p.difficulty));
    }

    if (filterStatus.length > 0) {
      result = result.filter(p => filterStatus.includes(p.status));
    }

    if (filterTags.length > 0) {
      result = result.filter(p => filterTags.every(t => p.tags.includes(t)));
    }

    // 2. Sort
    result.sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key];
      let valB = b[key];

      // Custom sort for difficulty
      if (key === 'difficulty') {
        const map: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
        valA = map[String(a.difficulty).toLowerCase()] ?? 99;
        valB = map[String(b.difficulty).toLowerCase()] ?? 99;
      }

      // Custom sort for status (Todo < Attempted < Solved)
      if (key === 'status') {
          const map: Record<string, number> = { todo: 1, attempted: 2, solved: 3 };
          valA = map[String(a.status).toLowerCase()] ?? 0;
          valB = map[String(b.status).toLowerCase()] ?? 0;
      }

      if (valA === valB) return 0;
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;

      const comparison = valA > valB ? 1 : -1;
      return direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [problems, searchQuery, filterDifficulties, filterStatus, filterTags, sortConfig]);

  // Load more function for pagination
  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const res = await axios.get(`http://localhost:3000/problems?page=${nextPage}&limit=${LIMIT}`);
      const { problems: fetchedProblems, hasMore: more } = res.data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enriched = fetchedProblems.map((p: any) => ({
        ...p,
        acceptance: p.acceptance || Math.floor(Math.random() * 60) + 20
      }));

      setProblems(prev => [...prev, ...enriched]);
      setHasMore(more);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more problems:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handlers
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

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);

    if (e.shiftKey && lastSelectedId.current) {
        const start = processedProblems.findIndex(p => p.id === lastSelectedId.current);
        const end = processedProblems.findIndex(p => p.id === id);
        // Ensure we found both
        if (start !== -1 && end !== -1) {
            const [lower, upper] = start < end ? [start, end] : [end, start];
            for (let i = lower; i <= upper; i++) {
                newSet.add(processedProblems[i].id);
            }
        } else {
             if (newSet.has(id)) newSet.delete(id);
             else newSet.add(id);
        }
    } else {
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        lastSelectedId.current = id;
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
    const problem = problems.find(p => p.id === id);
    if (problem) {
      navigate(`/problems/edit/${id}`);
    }
    setActiveMenu(null);
  };

  const handleDelete = (id: string) => {
    const problem = problems.find(p => p.id === id);
    if (problem) {
      setDeleteConfirmation({ id, title: problem.title });
    }
    setActiveMenu(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    console.log('Deleting problem:', deleteConfirmation);

    try {
      await axios.delete(`http://localhost:3000/problems/${deleteConfirmation.id}`);
      setProblems(problems.filter(p => p.id !== deleteConfirmation.id));
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Failed to delete problem:', err);
      setDeleteConfirmation(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(`Delete ${selectedIds.size} selected problem(s)?`);
    if (!confirmed) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          axios.delete(`http://localhost:3000/problems/${id}`)
        )
      );
      setProblems(problems.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to delete problems:', err);
    }
  };

  const isAllSelected = processedProblems.length > 0 && selectedIds.size === processedProblems.length;

  return (
    <div className="h-full overflow-y-auto bg-background text-foreground font-sans">
      <div className="py-8 mx-auto max-w-7xl px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
            <p className="text-muted-foreground mt-1">Sharpen your coding skills with our collection of challenges.</p>
          </div>
          <button
            onClick={() => navigate('/problems/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Problem
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-end md:items-center">
          <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
             {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search problems..."
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
                    onClick={() => navigate(`/problems/${problem.slug}`)}
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
          {!isLoading && hasMore && (
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
              title="No problems found"
              description="Try adjusting your filters or search query."
              action={{
                label: "Clear all filters",
                onClick: () => { setSearchQuery(''); setFilterDifficulties([]); setFilterStatus([]); setFilterTags([]); }
              }}
              className="py-12"
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirmation(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card border border-border rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Delete Problem</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Are you sure you want to delete <span className="font-medium text-foreground">"{deleteConfirmation.title}"</span>? This action cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setDeleteConfirmation(null)}
                      className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        confirmDelete();
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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
                        onClick={() => setIsAddToListModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-md transition-colors text-sm font-medium"
                    >
                        <FolderPlus className="w-4 h-4" />
                        Add to List
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-sm font-medium text-muted-foreground"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
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

      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={() => setIsAddToListModalOpen(false)}
        selectedProblemIds={Array.from(selectedIds)}
      />
    </div>
  );
}

