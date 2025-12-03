import { useRef, useState } from 'react';
import { Search, Filter, Check, X, FolderPlus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input, Button } from '@/design-system/components';

interface ProblemsToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterDifficulties: string[];
  setFilterDifficulties: (diffs: string[]) => void;
  filterStatus: string[];
  setFilterStatus: (status: string[]) => void;
  filterTags: string[];
  setFilterTags: (tags: string[]) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onAddToList: () => void;
}

export function ProblemsToolbar({
  searchQuery,
  setSearchQuery,
  filterDifficulties,
  setFilterDifficulties,
  filterStatus,
  setFilterStatus,
  filterTags,
  setFilterTags,
  selectedCount,
  onBulkDelete,
  onClearSelection,
  onAddToList
}: ProblemsToolbarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!filterTags.includes(tagInput.trim())) {
        setFilterTags([...filterTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const activeFiltersCount = filterDifficulties.length + filterStatus.length + filterTags.length;

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-end md:items-center">
      <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Unified Filter */}
        <div className="relative" ref={filterRef}>
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "gap-2",
              isFilterOpen || activeFiltersCount > 0
                ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>

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
                        <div key={diff} className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:opacity-80" onClick={() => setFilterDifficulties(filterDifficulties.includes(diff) ? filterDifficulties.filter(d => d !== diff) : [...filterDifficulties, diff])}>
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
                        <div key={status} className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:opacity-80" onClick={() => setFilterStatus(filterStatus.includes(status) ? filterStatus.filter(s => s !== status) : [...filterStatus, status])}>
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
                          <button onClick={() => setFilterTags(filterTags.filter(t => t !== tag))} className="hover:text-primary/70">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      type="text"
                      placeholder="Add tag..."
                      className="h-8 text-xs"
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

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 z-50"
          >
            <div className="flex items-center gap-3 border-r border-border pr-6">
              <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {selectedCount}
              </div>
              <span className="text-sm font-medium">Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onAddToList}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary rounded-md transition-colors text-sm font-medium"
              >
                <FolderPlus className="w-4 h-4" />
                Add to List
              </button>
              <button
                onClick={onBulkDelete}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-sm font-medium text-muted-foreground"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={onClearSelection}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary rounded-md transition-colors text-sm font-medium text-muted-foreground"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
