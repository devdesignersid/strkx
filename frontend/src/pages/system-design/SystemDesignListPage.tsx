import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button, Modal, PageHeader } from '@/design-system/components';

import { useSystemDesignProblems } from '@/features/system-design/hooks/useSystemDesignProblems';
import { SystemDesignToolbar } from '@/features/system-design/components/SystemDesignToolbar';
import { SystemDesignTable } from '@/features/system-design/components/SystemDesignTable';
import AddToListModal from '@/features/lists/components/AddToListModal';
import type { SystemDesignProblem } from '@/types/system-design';

export default function SystemDesignListPage() {
    const navigate = useNavigate();
    const {
        problems,
        isLoading,
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
        bulkDelete
    } = useSystemDesignProblems();

    const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; title: string } | null>(null);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    const handleCreate = () => {
        navigate('/system-design/new');
    };

    const handleModify = (problem: SystemDesignProblem) => {
        navigate(`/system-design/edit/${problem.id}`);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        await deleteProblem(deleteConfirmation.id);
        setDeleteConfirmation(null);
    };

    return (
        <div className="h-full overflow-y-auto bg-background text-foreground font-sans">
            <div className="py-8 mx-auto max-w-7xl px-8">
                {/* Header */}
                <PageHeader
                    title="System Design Problems"
                    description="Practice system design interviews with interactive diagrams."
                >
                    <Button onClick={handleCreate} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create Problem
                    </Button>
                </PageHeader>

                <SystemDesignToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filterDifficulties={filterDifficulties}
                    setFilterDifficulties={setFilterDifficulties}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    filterTags={filterTags}
                    setFilterTags={setFilterTags}
                    selectedCount={selectedIds.size}
                    onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
                    onClearSelection={() => setSelectedIds(new Set())}
                    onAddToList={() => setIsAddToListModalOpen(true)}
                />

                <SystemDesignTable
                    problems={problems}
                    isLoading={isLoading}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    selectedIds={selectedIds}
                    onToggleSelectAll={toggleSelectAll}
                    onToggleSelectOne={toggleSelectOne}
                    onDelete={(id) => {
                        const problem = problems.find((p: any) => p.id === id);
                        if (problem) setDeleteConfirmation({ id, title: problem.title });
                    }}
                    onModify={handleModify}
                    onClearFilters={() => {
                        setSearchQuery('');
                        setFilterDifficulties([]);
                        setFilterStatus([]);
                        setFilterTags([]);
                    }}
                    hasFilters={searchQuery !== '' || filterDifficulties.length > 0 || filterStatus.length > 0 || filterTags.length > 0}
                />
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirmation}
                onClose={() => setDeleteConfirmation(null)}
                title="Delete Problem"
                description={`Are you sure you want to delete "${deleteConfirmation?.title}"? This action cannot be undone.`}
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirmation(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            Delete
                        </Button>
                    </>
                }
            />

            {/* Bulk Delete Modal */}
            <Modal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                title="Delete Multiple Problems"
                description={`Are you sure you want to delete ${selectedIds.size} problems? This action cannot be undone.`}
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => setIsBulkDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setIsBulkDeleteModalOpen(false);
                                bulkDelete();
                            }}
                        >
                            Delete {selectedIds.size} Problems
                        </Button>
                    </>
                }
            />

            <AddToListModal
                isOpen={isAddToListModalOpen}
                onClose={() => setIsAddToListModalOpen(false)}
                selectedProblemIds={Array.from(selectedIds)}
            />
        </div>
    );
}
