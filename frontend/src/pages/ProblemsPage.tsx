import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import AddToListModal from '@/components/lists/AddToListModal';
import { useProblems } from '@/features/problems/hooks/useProblems';
import { ProblemsToolbar } from '@/features/problems/components/ProblemsToolbar';
import { ProblemsTable } from '@/features/problems/components/ProblemsTable';

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
    bulkDelete
  } = useProblems();

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
            const problem = problems.find(p => p.id === id);
            if (problem) setDeleteConfirmation({ id, title: problem.title });
          }}
          onLoadMore={loadMore}
          onClearFilters={() => {
            setSearchQuery('');
            setFilterDifficulties([]);
            setFilterStatus([]);
            setFilterTags([]);
          }}
        />
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

      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={() => setIsAddToListModalOpen(false)}
        selectedProblemIds={Array.from(selectedIds)}
      />
    </div>
  );
}
