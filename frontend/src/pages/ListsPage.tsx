import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, Search, Folder, Trash2, Clock, List as ListIcon, Loader2 } from 'lucide-react';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { API_URL } from '@/config';

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
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/lists`, { withCredentials: true });
      setLists(res.data.data);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
      toast.error(TOAST_MESSAGES.LISTS.LOAD_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/lists`, {
        name: newListName,
        description: newListDesc
      }, { withCredentials: true });
      setLists([res.data.data, ...lists]);
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
      await axios.delete(`${API_URL}/lists/${deleteConfirmModal.listId}`, { withCredentials: true });
      setLists(lists.filter(l => l.id !== deleteConfirmModal.listId));
      toast.success(TOAST_MESSAGES.LISTS.DELETED);
    } catch (error) {
      console.error('Failed to delete list:', error);
      toast.error(TOAST_MESSAGES.LISTS.DELETE_FAILED);
    } finally {
      setDeleteConfirmModal({ open: false, listId: null, listName: '' });
    }
  };

  const filteredLists = lists.filter(list =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Lists</h1>
          <p className="text-muted-foreground text-sm mt-1">Organize your interview preparation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-secondary/30 border border-white/5 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors w-64"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New List
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-xl bg-secondary/5">
          <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
            <ListIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No lists found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Create your first list to start organizing problems.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map(list => (
            <motion.div
              key={list.id}
              layoutId={list.id}
              onClick={() => navigate(`/lists/${list.id}`)}
              className="group relative bg-card border border-white/5 hover:border-primary/20 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
            >
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
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Progress</span>
                  <span className={list.solvedCount === list._count.problems && list._count.problems > 0 ? "text-green-500 font-medium" : ""}>
                    {list.solvedCount} / {list._count.problems}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${list._count.problems > 0 ? (list.solvedCount / list._count.problems) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-xs font-medium text-muted-foreground">
                  {list._count.problems} problems
                </span>

                {/* Tags Preview */}
                <div className="flex -space-x-2">
                  {Array.from(new Set((list.problems || []).flatMap(p => p.problem?.tags || []))).slice(0, 3).map((tag, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-secondary border border-card flex items-center justify-center text-[8px] font-bold text-muted-foreground" title={tag}>
                      {tag[0]}
                    </div>
                  ))}
                  {(list.problems || []).flatMap(p => p.problem?.tags || []).length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-secondary border border-card flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                      +
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create List Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1e1e1e] border border-white/10 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-white/5 bg-[#252526] flex justify-between items-center">
              <h2 className="text-lg font-semibold">Create New List</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateList} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">List Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="E.g. Blind 75"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Description (Optional)</label>
                <textarea
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="What is this list about?"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none h-24"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim() || isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create List
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmModal.open}
        onClose={() => setDeleteConfirmModal({ open: false, listId: null, listName: '' })}
        title="Delete List"
        description={`Are you sure you want to delete "${deleteConfirmModal.listName}"? This action cannot be undone.`}
        footer={
          <>
            <button
              onClick={() => setDeleteConfirmModal({ open: false, listId: null, listName: '' })}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg hover:bg-destructive/90 transition-colors"
            >
              Delete
            </button>
          </>
        }
      />
    </div>
  );
}
