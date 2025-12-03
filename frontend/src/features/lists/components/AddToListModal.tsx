import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Loader2, FolderPlus } from 'lucide-react';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { listsService } from '@/services/api/lists.service';
import { TruncatedText } from '@/components/ui/truncated-text';

interface List {
  id: string;
  name: string;
  _count: { problems: number };
  problemIds?: string[];
}

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProblemIds: string[];
}

export default function AddToListModal({ isOpen, onClose, selectedProblemIds }: AddToListModalProps) {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLists();
      setSelectedListIds(new Set());
      setNewListName('');
      setIsCreating(false);
    }
  }, [isOpen]);

  const fetchLists = async () => {
    setIsLoading(true);
    try {
      const res = await listsService.findAll({ limit: 100 }); // Fetch enough lists
      setLists(res.data);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
      toast.error(TOAST_MESSAGES.LISTS.LOAD_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await listsService.create({ name: newListName });
      setLists([res.data, ...lists]);
      setNewListName('');
      setIsCreating(false);
      // Auto-select the new list
      setSelectedListIds(prev => new Set(prev).add(res.data.id));
      toast.success(TOAST_MESSAGES.LISTS.CREATED);
    } catch (error) {
      console.error('Failed to create list:', error);
      toast.error(TOAST_MESSAGES.LISTS.CREATE_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (selectedListIds.size === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      // Add problems to each selected list
      // We do this in parallel
      await Promise.all(Array.from(selectedListIds).map(listId =>
        listsService.addProblem(listId, selectedProblemIds)
      ));

      toast.success({
        title: TOAST_MESSAGES.LISTS.PROBLEM_ADDED.title,
        description: `Added ${selectedProblemIds.length} problems to ${selectedListIds.size} lists`
      });
      onClose();
    } catch (error) {
      console.error('Failed to add to lists:', error);
      toast.error(TOAST_MESSAGES.LISTS.ADD_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleListSelection = (id: string) => {
    const newSet = new Set(selectedListIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedListIds(newSet);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#252526]">
              <h2 className="text-sm font-semibold text-foreground">Add to List</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Create New List Input */}
              {isCreating ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <input
                    autoFocus
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                    placeholder="List Name (e.g. Blind 75)"
                    className="flex-1 bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    onClick={handleCreateList}
                    disabled={!newListName.trim() || isSubmitting}
                    className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="p-2 text-muted-foreground hover:bg-white/5 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 hover:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Create New List</span>
                </button>
              )}

              {/* Lists List */}
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : lists.length === 0 && !isCreating ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No lists found. Create one to get started!
                  </div>
                ) : (
                  lists.map(list => {
                    const isAlreadyAdded = selectedProblemIds.every(id => list.problemIds?.includes(id));
                    const isSelected = selectedListIds.has(list.id);

                    return (
                      <div
                        key={list.id}
                        onClick={() => !isAlreadyAdded && toggleListSelection(list.id)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all border border-transparent",
                          isAlreadyAdded
                            ? "opacity-50 cursor-not-allowed bg-white/5"
                            : "cursor-pointer",
                          isSelected && !isAlreadyAdded
                            ? "bg-primary/10 border-primary/20"
                            : !isAlreadyAdded && "hover:bg-white/5 border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                            isSelected && !isAlreadyAdded ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
                          )}>
                            <FolderPlus className="w-4 h-4" />
                          </div>
                          <div>
                            <TruncatedText
                              text={list.name}
                              className={cn(
                                "text-sm font-medium",
                                isSelected && !isAlreadyAdded ? "text-primary" : "text-foreground"
                              )}
                            />
                            <div className="text-[10px] text-muted-foreground">
                              {list._count.problems} problems
                            </div>
                          </div>
                        </div>
                        {isAlreadyAdded ? (
                          <span className="text-[10px] font-medium text-muted-foreground bg-white/10 px-2 py-0.5 rounded">
                            Added
                          </span>
                        ) : isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-primary"
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-[#252526] flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting || selectedListIds.size === 0}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
