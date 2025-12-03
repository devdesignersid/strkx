import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

    // Fetch Problems with React Query
    const { data: problems = [], isLoading, error } = useQuery({
        queryKey: ['system-design-problems'],
        queryFn: () => systemDesignApi.getAllProblems(),
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => systemDesignApi.deleteProblem(id),
        onMutate: async (id) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['system-design-problems'] });
            const previousProblems = queryClient.getQueryData(['system-design-problems']);

            queryClient.setQueryData(['system-design-problems'], (old: SystemDesignProblem[] = []) =>
                old.filter(p => p.id !== id)
            );

            return { previousProblems };
        },
        onError: (_err, _id, context) => {
            // Rollback on error
            if (context?.previousProblems) {
                queryClient.setQueryData(['system-design-problems'], context.previousProblems);
            }
            toast.error('Failed to delete problem');
        },
        onSuccess: () => {
            toast.success('Problem deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['system-design-problems'] });
        }
    });

    // Bulk Delete Mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) =>
            Promise.all(ids.map(id => systemDesignApi.deleteProblem(id))),
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: ['system-design-problems'] });
            const previousProblems = queryClient.getQueryData(['system-design-problems']);

            queryClient.setQueryData(['system-design-problems'], (old: SystemDesignProblem[] = []) =>
                old.filter(p => !ids.includes(p.id))
            );

            return { previousProblems, count: ids.length };
        },
        onError: (_err, _ids, context) => {
            if (context?.previousProblems) {
                queryClient.setQueryData(['system-design-problems'], context.previousProblems);
            }
            toast.error('Failed to delete some problems');
        },
        onSuccess: () => {
            setSelectedIds(new Set());
            toast.success('Problems deleted successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['system-design-problems'] });
        }
    });

    // Filter & Sort Logic
    const filteredProblems = useMemo(() => {
        return problems.filter((problem: SystemDesignProblem) => {
            // Search
            if (searchQuery && !problem.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Difficulty
            if (filterDifficulties.length > 0 && !filterDifficulties.includes(problem.difficulty)) {
                return false;
            }

            // Tags
            if (filterTags.length > 0 && !filterTags.some(tag => problem.tags.includes(tag))) {
                return false;
            }

            // Status (Mock logic for now as status isn't fully integrated in list view yet)
            // In a real app, we'd check user's submission status for this problem
            if (filterStatus.length > 0) {
                // TODO: Implement status filtering based on user submissions
            }

            return true;
        }).sort((a: SystemDesignProblem, b: SystemDesignProblem) => {
            const aValue = sortConfig.key === 'status' ? (a.status || '') : a[sortConfig.key];
            const bValue = sortConfig.key === 'status' ? (b.status || '') : b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [problems, searchQuery, filterDifficulties, filterTags, filterStatus, sortConfig]);

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

        if (!confirm(`Are you sure you want to delete ${selectedIds.size} problems?`)) return;

        await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
    };

    return {
        problems: filteredProblems,
        isLoading,
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
        refreshProblems: () => queryClient.invalidateQueries({ queryKey: ['system-design-problems'] })
    };
}
