import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { problemsService } from '@/services/api/problems.service';
import { toast, TOAST_MESSAGES } from '@/lib/toast';

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

export const useProblems = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulties, setFilterDifficulties] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'title',
    direction: 'asc'
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['problems', page, searchQuery, filterDifficulties, filterStatus, filterTags, sortConfig],
    queryFn: async () => {
      const params = {
        page,
        limit: LIMIT,
        search: searchQuery,
        difficulty: filterDifficulties.join(','),
        status: filterStatus.join(','),
        tags: filterTags.join(','),
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };
      const response = await problemsService.findAll(params);
      return response;
    },
    placeholderData: (previousData) => previousData,
  });

  const problems = data?.data?.problems || [];
  const meta = data?.data?.meta;
  const hasMore = meta ? meta.page < meta.totalPages : false;

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const loadMore = () => {
    if (!isFetching && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === problems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(problems.map((p: Problem) => p.id)));
    }
  };

  const toggleSelectOne = (id: string, shiftKey: boolean, lastSelectedId: string | null) => {
    const newSet = new Set(selectedIds);

    if (shiftKey && lastSelectedId) {
      const start = problems.findIndex((p: Problem) => p.id === lastSelectedId);
      const end = problems.findIndex((p: Problem) => p.id === id);

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => problemsService.delete(id), // Assuming delete method exists
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      toast.success(TOAST_MESSAGES.PROBLEM.DELETED);
    },
    onError: () => {
      toast.error(TOAST_MESSAGES.PROBLEM.DELETE_FAILED);
    }
  });

  const deleteProblem = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(id => problemsService.delete(id)) // Assuming delete method exists
      );
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      setSelectedIds(new Set());
      toast.success({
        title: TOAST_MESSAGES.PROBLEM.BULK_DELETED.title,
        description: `Deleted ${selectedIds.size} problems`
      });
    } catch (err) {
      console.error('Failed to delete problems:', err);
      toast.error(TOAST_MESSAGES.PROBLEM.BULK_DELETE_FAILED);
    }
  };

  return {
    problems,
    isLoading,
    isLoadingMore: isFetching,
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
    bulkDelete,
    refetch
  };
};

export const useProblem = (slug: string) => {
  return useQuery({
    queryKey: ['problem', slug],
    queryFn: () => problemsService.findOne(slug),
    enabled: !!slug,
  });
};

export const useCreateProblem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: problemsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
  });
};
