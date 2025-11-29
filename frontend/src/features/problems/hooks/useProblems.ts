import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  status: 'Solved' | 'Todo' | 'Attempted';
  acceptance: number;
}

export type SortKey = 'title' | 'difficulty' | 'status' | 'acceptance';
export type SortDirection = 'asc' | 'desc';

export function useProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulties, setFilterDifficulties] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'title',
    direction: 'asc'
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const LIMIT = 20;

  const fetchProblems = useCallback(async (page: number, isReset: boolean = false) => {
    if (isReset) setIsLoading(true);
    setIsLoadingMore(true);

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
      const res = await axios.get(`http://localhost:3000/problems?${params.toString()}`, { withCredentials: true });
      const { problems: fetchedProblems, hasMore: more } = res.data;

      const enriched = fetchedProblems.map((p: any) => ({
          ...p,
          acceptance: p.acceptance || Math.floor(Math.random() * 60) + 20
      }));

      if (isReset) {
        setProblems(enriched);
        setCurrentPage(1);
      } else {
        setProblems(prev => [...prev, ...enriched]);
        setCurrentPage(page);
      }
      setHasMore(more);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch problems');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, filterDifficulties, filterStatus, filterTags, sortConfig]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProblems(1, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProblems]);

  // Refetch problems when page becomes visible (e.g., navigating back from problem page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProblems(1, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchProblems]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    await fetchProblems(currentPage + 1, false);
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === problems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(problems.map(p => p.id)));
    }
  };

  const toggleSelectOne = (id: string, shiftKey: boolean, lastSelectedId: string | null) => {
    const newSet = new Set(selectedIds);

    if (shiftKey && lastSelectedId) {
        const start = problems.findIndex(p => p.id === lastSelectedId);
        const end = problems.findIndex(p => p.id === id);

        if (start !== -1 && end !== -1) {
            const [lower, upper] = start < end ? [start, end] : [end, start];
            for (let i = lower; i <= upper; i++) {
                newSet.add(problems[i].id);
            }
        } else {
             if (newSet.has(id)) newSet.delete(id);
             else newSet.add(id);
        }
    } else {
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const deleteProblem = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/problems/${id}`, { withCredentials: true });
      setProblems(problems.filter(p => p.id !== id));
      toast.success('Problem deleted');
    } catch (err) {
      console.error('Failed to delete problem:', err);
      toast.error('Failed to delete problem');
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          axios.delete(`http://localhost:3000/problems/${id}`, { withCredentials: true })
        )
      );
      setProblems(problems.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      toast.success(`Deleted ${selectedIds.size} problems`);
    } catch (err) {
      console.error('Failed to delete problems:', err);
      toast.error('Failed to delete some problems');
    }
  };

  return {
    problems,
    isLoading,
    isLoadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    filterDifficulties,
    setFilterDifficulties,
    filterStatus,
    setFilterStatus,
    filterTags,
    setFilterTags,
    sortConfig,
    handleSort,
    selectedIds,
    setSelectedIds,
    toggleSelectAll,
    toggleSelectOne,
    loadMore,
    deleteProblem,
    bulkDelete
  };
}
