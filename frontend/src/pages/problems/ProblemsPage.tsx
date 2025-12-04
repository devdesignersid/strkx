import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';

import AddToListModal from '@/features/lists/components/AddToListModal';
import { useProblems } from '@/hooks/useProblems';
import { ProblemsToolbar } from '@/features/problems/components/ProblemsToolbar';
import { ProblemsTable } from '@/features/problems/components/ProblemsTable';
import { Modal, Button, PageHeader } from '@/design-system/components';

export default function ProblemsPage() {
  const navigate = useNavigate();
  const {
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
    bulkDelete,
    refetch
  } = useProblems();

  const location = useLocation();

  useEffect(() => {
    if (location.state?.refresh) {
      refetch();
      // Clear state to avoid infinite refetch if we were to depend on it, 
      // but react-router state persists until navigation.
      // We can replace history to clear it, but simple refetch is fine as it's idempotent-ish.
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, refetch, navigate, location.pathname]);

  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; title: string } | null>(null);

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
          title="Problems"
          description="Sharpen your coding skills with our collection of challenges."
        >
          <Button
            onClick={() => navigate('/problems/new')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Problem
          </Button>
        </PageHeader>

        <ProblemsToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterDifficulties={filterDifficulties}
          setFilterDifficulties={setFilterDifficulties}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterTags={filterTags}
          setFilterTags={setFilterTags}
          selectedCount={selectedIds.size}
          onBulkDelete={bulkDelete}
          onClearSelection={() => setSelectedIds(new Set())}
          onAddToList={() => setIsAddToListModalOpen(true)}
        />

        <ProblemsTable
          problems={problems}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          sortConfig={sortConfig}
          onSort={handleSort}
          selectedIds={selectedIds}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectOne={toggleSelectOne}
          onDelete={(id) => {
            const problem = problems.find((p: any) => p.id === id);
            if (problem) setDeleteConfirmation({ id, title: problem.title });
          }}
          onLoadMore={loadMore}
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

      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={() => setIsAddToListModalOpen(false)}
        selectedProblemIds={Array.from(selectedIds)}
      />
    </div>
  );
}
