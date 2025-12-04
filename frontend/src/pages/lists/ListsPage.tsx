import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Folder, Trash2, Clock, Loader2 } from 'lucide-react';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { Skeleton } from '@/design-system/components/Skeleton';
import { Modal, Input, Button, Card, PageHeader, ProgressBar, Textarea, EmptyState } from '@/design-system/components';
import { EmptyListsIllustration } from '@/design-system/illustrations';
import { useLists, useCreateList, useDeleteList } from '@/hooks/useLists';

interface List {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  _count: { problems: number };
  solvedCount: number;
  problems: { problem: { tags: string[] } }[];
}

export default function ListsPage() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; listId: string | null; listName: string }>({
    open: false,
    listId: null,
    listName: ''
  });

  const { data: listsData, isLoading } = useLists();
  const createListMutation = useCreateList();
  const deleteListMutation = useDeleteList();

  const lists = listsData?.data || [];

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsSubmitting(true);
    try {
      await createListMutation.mutateAsync({
        name: newListName,
        description: newListDesc
      });
      setIsCreateModalOpen(false);
      setNewListName('');
      setNewListDesc('');
      toast.success(TOAST_MESSAGES.LISTS.CREATED);
    } catch (error) {
      console.error('Failed to create list:', error);
      toast.error(TOAST_MESSAGES.LISTS.CREATE_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteList = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setDeleteConfirmModal({ open: true, listId: id, listName: name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmModal.listId) return;

    try {
      await deleteListMutation.mutateAsync(deleteConfirmModal.listId);
      toast.success(TOAST_MESSAGES.LISTS.DELETED);
    } catch (error) {
      console.error('Failed to delete list:', error);
      toast.error(TOAST_MESSAGES.LISTS.DELETE_FAILED);
    } finally {
      setDeleteConfirmModal({ open: false, listId: null, listName: '' });
    }
  };

  const filteredLists = lists.filter((list: List) =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-8 space-y-8">
      {/* Header */}
      <PageHeader
        title="My Lists"
        description="Organize your interview preparation"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New List
          </Button>
        </div>
      </PageHeader>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredLists.length === 0 ? (
        <EmptyState
          illustration={<EmptyListsIllustration className="w-full h-full" />}
          title="No lists found"
          description="Create your first list to start organizing problems."
          className="py-12 border border-dashed border-border rounded-xl bg-secondary/5"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map((list: List) => (
            <motion.div
              key={list.id}
              layoutId={list.id}
              onClick={() => navigate(`/lists/${list.id}`)}
              className="group relative"
            >
              <Card className="h-full p-5 cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1 bg-secondary/30 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      {new Date(list.updatedAt).toLocaleDateString()}
                    </div>
                    <button
                      onClick={(e) => handleDeleteList(e, list.id, list.name)}
                      className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete List"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{list.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                  {list.description || "No description"}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <ProgressBar
                    value={list.solvedCount}
                    max={list._count.problems}
                    showLabel
                    label="Progress"
                    colorClass="bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs font-medium text-muted-foreground">
                    {list._count.problems} problems
                  </span>

                  {/* Tags Preview */}
                  <div className="flex -space-x-2">
                    {Array.from(new Set((list.problems || []).flatMap((p: any) => p.problem?.tags || []))).slice(0, 3).map((tag: any, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-secondary border border-card flex items-center justify-center text-[8px] font-bold text-muted-foreground" title={tag}>
                        {tag[0]}
                      </div>
                    ))}
                    {(list.problems || []).flatMap((p: any) => p.problem?.tags || []).length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-secondary border border-card flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                        +
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create List Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New List"
        description="Create a new list to organize your problems."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateList}
              disabled={!newListName.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create List
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">List Name</label>
            <Input
              autoFocus
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="E.g. Blind 75"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Description (Optional)</label>
            <Textarea
              value={newListDesc}
              onChange={(e) => setNewListDesc(e.target.value)}
              placeholder="What is this list about?"
              className="h-24 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmModal.open}
        onClose={() => setDeleteConfirmModal({ open: false, listId: null, listName: '' })}
        title="Delete List"
        description={`Are you sure you want to delete "${deleteConfirmModal.listName}"? This action cannot be undone.`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmModal({ open: false, listId: null, listName: '' })}
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
    </div>
  );
}
