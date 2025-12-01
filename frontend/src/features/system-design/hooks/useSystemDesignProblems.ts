import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { systemDesignApi } from '../api/systemDesignApi';
import type { SystemDesignProblem } from '@/types/system-design';

export type SortKey = 'title' | 'difficulty' | 'status' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export function useSystemDesignProblems() {
    const [problems, setProblems] = useState<SystemDesignProblem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    // Fetch Problems
    const fetchProblems = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await systemDesignApi.getAllProblems();
            setProblems(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch problems:', err);
            setError('Failed to load problems');
            toast.error('Failed to load problems');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProblems();
    }, [fetchProblems]);

    // Delete Problem
    const deleteProblem = async (id: string) => {
        try {
            await systemDesignApi.deleteProblem(id);
            setProblems(prev => prev.filter(p => p.id !== id));
            toast.success('Problem deleted successfully');
        } catch (err) {
            console.error('Failed to delete problem:', err);
            toast.error('Failed to delete problem');
        }
    };

    // Bulk Delete
    const bulkDelete = async () => {
        if (selectedIds.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedIds.size} problems?`)) return;

        try {
            await Promise.all(Array.from(selectedIds).map(id => systemDesignApi.deleteProblem(id)));
            setProblems(prev => prev.filter(p => !selectedIds.has(p.id)));
            setSelectedIds(new Set());
            toast.success('Problems deleted successfully');
        } catch (err) {
            console.error('Failed to delete problems:', err);
            toast.error('Failed to delete some problems');
        }
    };

    // Filter & Sort Logic
    const filteredProblems = useMemo(() => {
        return problems.filter(problem => {
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
        }).sort((a, b) => {
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
            setSelectedIds(new Set(filteredProblems.map(p => p.id)));
        }
    };

    const toggleSelectOne = (id: string, shiftKey: boolean, lastSelectedId: string | null) => {
        const newSelected = new Set(selectedIds);

        if (shiftKey && lastSelectedId) {
            const currentIndex = filteredProblems.findIndex(p => p.id === id);
            const lastIndex = filteredProblems.findIndex(p => p.id === lastSelectedId);

            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);

            const range = filteredProblems.slice(start, end + 1);
            range.forEach(p => newSelected.add(p.id));
        } else {
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
        }

        setSelectedIds(newSelected);
    };

    return {
        problems: filteredProblems,
        isLoading,
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
        deleteProblem,
        bulkDelete,
        refreshProblems: fetchProblems
    };
}
