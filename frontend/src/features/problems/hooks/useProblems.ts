import { useState, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export type SortKey = 'title' | 'difficulty' | 'status' | 'acceptance' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export function useProblems() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulties, setFilterDifficulties] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'createdAt',
    direction: 'desc'
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const LIMIT = 20;

  // Build query params
  const queryParams = useMemo(() => ({
    limit: LIMIT,
    search: searchQuery || undefined,
    difficulty: filterDifficulties.length ? filterDifficulties.join(',') : undefined,
    status: filterStatus.length ? filterStatus.join(',') : undefined,
    tags: filterTags.length ? filterTags.join(',') : undefined,
    sortBy: sortConfig.key,
    sortOrder: sortConfig.direction
  }), [searchQuery, filterDifficulties, filterStatus, filterTags, sortConfig]);

  // Infinite query for problems
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['problems', queryParams],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await problemsService.findAll({
        ...queryParams,
        page: pageParam
      });

      const { problems: fetchedProblems, hasMore } = res.data;
      const enriched = fetchedProblems.map((p: any) => ({
        ...p,
        acceptance: p.acceptance || Math.floor(Math.random() * 60) + 20
      }));

      return { problems: enriched, hasMore };
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten all pages into single array
  const problems = useMemo(() => {
    return data?.pages.flatMap(page => page.problems) ?? [];
  }, [data]);

  // Delete single problem mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => problemsService.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['problems'] });

      // Snapshot previous value
      const previousProblems = queryClient.getQueryData(['problems', queryParams]);

      // Optimistically update cache
      queryClient.setQueryData(['problems', queryParams], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            problems: page.problems.filter((p: Problem) => p.id !== id)
          }))
        };
      });

      return { previousProblems };
    },
    onError: (err, _id, context) => {
      // Rollback on error
      if (context?.previousProblems) {
        queryClient.setQueryData(['problems', queryParams], context.previousProblems);
      }
      console.error('Failed to delete problem:', err);
      toast.error(TOAST_MESSAGES.PROBLEM.DELETE_FAILED);
    },
    onSuccess: () => {
      toast.success(TOAST_MESSAGES.PROBLEM.DELETED);
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id => problemsService.delete(id))),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['problems'] });
      const previousProblems = queryClient.getQueryData(['problems', queryParams]);

      queryClient.setQueryData(['problems', queryParams], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            problems: page.problems.filter((p: Problem) => !ids.includes(p.id))
          }))
        };
      });

      return { previousProblems, count: ids.length };
    },
    onError: (err, _ids, context) => {
      if (context?.previousProblems) {
        queryClient.setQueryData(['problems', queryParams], context.previousProblems);
      }
      console.error('Failed to delete problems:', err);
      toast.error(TOAST_MESSAGES.PROBLEM.BULK_DELETE_FAILED);
    },
    onSuccess: (_data, _ids, context) => {
      toast.success({
        title: TOAST_MESSAGES.PROBLEM.BULK_DELETED.title,
        description: `Deleted ${context?.count} problems`
      });
      setSelectedIds(new Set());
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

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

  const loadMore = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const deleteProblem = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
  };

  return {
    problems,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    error,
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
