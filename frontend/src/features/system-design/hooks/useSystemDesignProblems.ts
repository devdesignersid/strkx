import { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { systemDesignApi } from '@/services/api/system-design.service';
import type { SystemDesignProblem } from '@/types/system-design';

export type SortKey = 'title' | 'difficulty' | 'status' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export function useSystemDesignProblems() {
    const queryClient = useQueryClient();

    // Filtering & Sorting State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDifficulties, setFilterDifficulties] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'createdAt',
        direction: 'desc'
    });

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const LIMIT = 20;

    // Build params
    const queryParams = useMemo(() => ({
        limit: LIMIT,
        search: searchQuery || undefined,
        difficulty: filterDifficulties.length ? filterDifficulties.join(',') : undefined,
        // Status filtering to be implemented fully on backend, passing for now
        status: filterStatus.length ? filterStatus.join(',') : undefined,
        tags: filterTags.length ? filterTags.join(',') : undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
    }), [searchQuery, filterDifficulties, filterStatus, filterTags, sortConfig]);

    // Fetch Problems with Infinite Query
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch
    } = useInfiniteQuery({
        queryKey: ['system-design-problems', queryParams],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await systemDesignApi.getAllProblems({
                ...queryParams,
                page: pageParam
            });
            // Backend returns { data: { problems: [], meta: {} } } usually, or just { problems: [], meta: {} }
            // Adjust based on actual API response structure. 
            // In ProblemsService it returns { data: { problems: ..., meta: ... } } (axios response structure handling in service?)
            // systemDesignApi.getAllProblems now returns response.data which is { statusCode, data: { problems, meta }, ... } 

            // Let's assume the API returns the standard structure where res.data contains { problems, meta }
            const { problems, meta } = res.data;
            const hasMore = meta ? meta.page < meta.totalPages : false;
            return { problems, hasMore };
        },
        getNextPageParam: (lastPage, pages) => {
            return lastPage.hasMore ? pages.length + 1 : undefined;
        },
        initialPageParam: 1,
    });

    const problems = useMemo(() => {
        return data?.pages.flatMap(page => page.problems) ?? [];
    }, [data]);

    // Filter & Sort Logic is now server-side, references to filteredProblems should use problems
    const filteredProblems = problems;


    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => systemDesignApi.deleteProblem(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['system-design-problems'] });
            const previousProblems = queryClient.getQueryData(['system-design-problems']);

            // Optimistic update for infinite query structure is complex, invalidation is safer
            return { previousProblems };
        },
        onError: (_err, _id, context) => {
            if (context?.previousProblems) {
                // Restoration might be tricky with infinite query
                queryClient.invalidateQueries({ queryKey: ['system-design-problems'] });
            }
            toast.error('Failed to delete problem');
        },
        onSuccess: () => {
            toast.success('Problem deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['system-design-problems'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });

    // Bulk Delete Mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) =>
            Promise.all(ids.map(id => systemDesignApi.deleteProblem(id))),
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: ['system-design-problems'] });
            return { count: ids.length };
        },
        onError: (_err, _ids, _context) => {
            queryClient.invalidateQueries({ queryKey: ['system-design-problems'] });
            toast.error('Failed to delete some problems');
        },
        onSuccess: () => {
            setSelectedIds(new Set());
            toast.success('Problems deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['system-design-problems'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });

    const loadMore = async () => {
        if (!isFetchingNextPage && hasNextPage) {
            await fetchNextPage();
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
        if (selectedIds.size === filteredProblems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProblems.map((p: SystemDesignProblem) => p.id)));
        }
    };

    const toggleSelectOne = (id: string, shiftKey: boolean, lastSelectedId: string | null) => {
        const newSelected = new Set(selectedIds);

        if (shiftKey && lastSelectedId) {
            const currentIndex = filteredProblems.findIndex((p: SystemDesignProblem) => p.id === id);
            const lastIndex = filteredProblems.findIndex((p: SystemDesignProblem) => p.id === lastSelectedId);

            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);

            const range = filteredProblems.slice(start, end + 1);
            range.forEach((p: SystemDesignProblem) => newSelected.add(p.id));
        } else {
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
        }

        setSelectedIds(newSelected);
    };

    const deleteProblem = async (id: string) => {
        await deleteMutation.mutateAsync(id);
    };

    const bulkDelete = async () => {
        if (selectedIds.size === 0) return;
        // Confirmation is handled by UI
        await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
    };

    return {
        problems: filteredProblems,
        isLoading,
        isLoadingMore: isFetchingNextPage,
        hasMore: hasNextPage ?? false,
        loadMore,
        error: error ? 'Failed to load problems' : null,
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
        deleteProblem,
        bulkDelete,
        isDeleting: deleteMutation.isPending,
        isBulkDeleting: bulkDeleteMutation.isPending,
        refreshProblems: refetch
    };
}
