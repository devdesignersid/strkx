import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Brain, Filter, List as ListIcon, Hash, Search, ChevronDown, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { DIFFICULTY_LEVELS, PROBLEM_STATUSES, MOCK_INTERVIEW_CONSTANTS } from '@/config/constants';
import { cn } from '@/lib/utils';
import { Button, Input, Label } from '@/design-system/components';
import { listsService } from '@/services/api/lists.service';
import { interviewService } from '@/services/api/interview.service';

interface List {
  id: string;
  name: string;
  codingProblemCount?: number;
  systemDesignProblemCount?: number;
}

const MockInterviewSetup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState<List[]>([]);

  // Form State
  const [difficulty, setDifficulty] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [tags] = useState<string>(''); // Comma separated
  const [questionCount, setQuestionCount] = useState<number>(2);
  const [listSearch, setListSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingLists, setLoadingLists] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  // Fetch lists with pagination and search
  const fetchLists = async (pageNum: number, search: string, reset: boolean = false) => {
    if (loadingLists) return;
    setLoadingLists(true);
    try {
      const data = await listsService.findAll({
        page: pageNum,
        limit: 10,
        search: search
      });

      const newLists = data.data || data;

      if (reset) {
        setLists(newLists);
      } else {
        setLists(prev => [...prev, ...newLists]);
      }

      setHasMore(newLists.length === 10); // Assuming limit is 10
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch lists', err);
    } finally {
      setLoadingLists(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLists(1, listSearch, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [listSearch]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loadingLists) {
      fetchLists(page + 1, listSearch);
    }
  };

  const displayLists = lists;

  const handleListSelect = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    if (selectedLists.includes(listId)) {
      setSelectedLists(prev => prev.filter(id => id !== listId));
    } else {
      setSelectedLists(prev => [...prev, listId]);
      // Check for system design questions
      if (list.systemDesignProblemCount && list.systemDesignProblemCount > 0) {
        toast.warning(
          `"${list.name}" contains system design questions which will be skipped.`,
          { duration: 4000, icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> }
        );
      }
    }
    setListSearch(''); // Clear search on select
  };

  const removeList = (listId: string) => {
    setSelectedLists(prev => prev.filter(id => id !== listId));
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(t => t);

      // Only send filters that have values
      const payload: any = {
        questionCount,
        includeSystemDesign: false // Explicitly false for now as per UI
      };

      if (difficulty.length > 0) payload.difficulty = difficulty;
      if (status.length > 0) payload.status = status;
      if (selectedLists.length > 0) payload.lists = selectedLists;
      if (tagList.length > 0) payload.tags = tagList;

      const response = await interviewService.createSession(payload);

      // Backend wraps response in a "data" object via TransformInterceptor
      const session = response.data || response;

      // Validate session response
      if (!session || !session.id) {
        console.error('Invalid session response:', response);
        toast.error({
          title: 'Session Creation Failed',
          description: 'The server returned an invalid session. Please try again.'
        });
        setLoading(false);
        return;
      }

      navigate(`/mock-interview/session/${session.id}`);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || TOAST_MESSAGES.INTERVIEW.START_FAILED.description;
      toast.error({
        title: TOAST_MESSAGES.INTERVIEW.START_FAILED.title,
        description: message
      });
      setLoading(false);
    }
  };

  const toggleSelection = (item: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(item)) {
      setter(current.filter(i => i !== item));
    } else {
      setter([...current, item]);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full space-y-8"
      >
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(62,207,142,0.2)]">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Mock Interview Mode
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Simulate a real technical interview environment. Strict timing, no AI assistance, and realistic pressure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuration Cards */}
          <div className="space-y-6">
            {/* Difficulty */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/20 transition-colors">
              <Label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                <Filter className="w-4 h-4 text-primary" /> Difficulty
              </Label>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_LEVELS.map(diff => (
                  <Button
                    key={diff}
                    variant={difficulty.includes(diff) ? "default" : "secondary"}
                    onClick={() => toggleSelection(diff, difficulty, setDifficulty)}
                    className={cn(
                      "transition-all",
                      difficulty.includes(diff)
                        ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {diff}
                  </Button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/20 transition-colors">
              <Label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-primary" /> Status
              </Label>
              <div className="flex flex-wrap gap-2">
                {PROBLEM_STATUSES.map(s => (
                  <Button
                    key={s}
                    variant={status.includes(s) ? "default" : "secondary"}
                    onClick={() => toggleSelection(s, status, setStatus)}
                    className={cn(
                      "transition-all",
                      status.includes(s)
                        ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Lists */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/20 transition-colors h-fit z-20 relative">
              <Label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                <ListIcon className="w-4 h-4 text-primary" /> Lists (Optional)
              </Label>

              <div className="space-y-3" ref={setDropdownRef}>
                {/* Selected Tags */}
                {selectedLists.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedLists.map(listId => {
                      const list = lists.find(l => l.id === listId);
                      if (!list) return null;
                      return (
                        <motion.div
                          key={list.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium"
                        >
                          <span>{list.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeList(list.id); }}
                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Input & Dropdown Container */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder={selectedLists.length > 0 ? "Add more lists..." : "Select lists..."}
                      value={listSearch}
                      onChange={(e) => {
                        setListSearch(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="pl-9 pr-10"
                    />
                    <ChevronDown
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform pointer-events-none",
                        isDropdownOpen && "rotate-180"
                      )}
                    />
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[280px] flex flex-col"
                    >
                      <div
                        className="overflow-y-auto custom-scrollbar p-2 space-y-1"
                        onScroll={handleScroll}
                      >
                        {displayLists.length > 0 ? (
                          displayLists.map(list => {
                            const isSelected = selectedLists.includes(list.id);
                            return (
                              <button
                                key={list.id}
                                onClick={() => handleListSelect(list.id)}
                                className={cn(
                                  "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group",
                                  isSelected
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-secondary text-foreground"
                                )}
                              >
                                <div className="flex flex-col overflow-hidden">
                                  <span className="font-medium truncate">{list.name}</span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{list.codingProblemCount} problems</span>
                                    {list.systemDesignProblemCount !== undefined && list.systemDesignProblemCount > 0 && (
                                      <span className="flex items-center gap-1 text-yellow-500/80">
                                        <AlertTriangle className="w-3 h-3" />
                                        {list.systemDesignProblemCount} excluded
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            {loadingLists ? "Loading..." : (listSearch ? "No lists found" : "No lists available")}
                          </div>
                        )}
                        {loadingLists && displayLists.length > 0 && (
                          <div className="text-center py-2 text-xs text-muted-foreground">Loading more...</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Question Count */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/20 transition-colors">
              <Label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                <Hash className="w-4 h-4 text-primary" /> Questions & Duration
              </Label>
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-lg border border-white/5">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{questionCount}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Questions</div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{questionCount * MOCK_INTERVIEW_CONSTANTS.MINUTES_PER_QUESTION}m</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Duration</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min={MOCK_INTERVIEW_CONSTANTS.MIN_QUESTION_COUNT}
                    max={MOCK_INTERVIEW_CONSTANTS.MAX_QUESTION_COUNT}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>{MOCK_INTERVIEW_CONSTANTS.MIN_QUESTION_COUNT}</span>
                    <span>{MOCK_INTERVIEW_CONSTANTS.MAX_QUESTION_COUNT}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Start Button */}
        <div className="flex justify-center pt-8">
          <Button
            onClick={handleStart}
            disabled={loading}
            size="lg"
            className={cn(
              "group relative px-8 py-6 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all overflow-hidden"
            )}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center gap-3">
              {loading ? (
                <>Starting Interview...</>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Start Interview Session
                </>
              )}
            </span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default MockInterviewSetup;
