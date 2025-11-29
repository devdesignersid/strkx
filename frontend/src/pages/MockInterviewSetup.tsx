import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Brain, Filter, List as ListIcon, Hash } from 'lucide-react';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { API_URL } from '@/config';

interface List {
  id: string;
  name: string;
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

  useEffect(() => {
    // Fetch lists for filter
    fetch(`${API_URL}/lists`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setLists(data))
      .catch(err => console.error('Failed to fetch lists', err));
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(t => t);

      const res = await fetch(`${API_URL}/interview-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          difficulty,
          status,
          lists: selectedLists,
          tags: tagList,
          questionCount
        })
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error({
            title: TOAST_MESSAGES.INTERVIEW.START_FAILED.title,
            description: err.message || TOAST_MESSAGES.INTERVIEW.START_FAILED.description
        });
        setLoading(false);
        return;
      }

      const session = await res.json();
      navigate(`/mock-interview/session/${session.id}`);
    } catch (error) {
      console.error(error);
      toast.error(TOAST_MESSAGES.GENERAL.ERROR);
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
    <div className="min-h-full p-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4 ring-1 ring-primary/20">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Mock Interview Mode
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Simulate a real technical interview environment. Strict timing, no AI assistance, and realistic pressure.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 space-y-8 shadow-lg">

          {/* Difficulty */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Filter className="w-4 h-4 text-primary" /> Difficulty
            </label>
            <div className="flex gap-3">
              {['Easy', 'Medium', 'Hard'].map(diff => (
                <button
                  key={diff}
                  onClick={() => toggleSelection(diff, difficulty, setDifficulty)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    difficulty.includes(diff)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="w-4 h-4 text-primary" /> Status
            </label>
            <div className="flex gap-3">
              {['Todo', 'Attempted', 'Solved'].map(s => (
                <button
                  key={s}
                  onClick={() => toggleSelection(s, status, setStatus)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    status.includes(s)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Lists */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ListIcon className="w-4 h-4 text-primary" /> Lists (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {lists.map(list => (
                <button
                  key={list.id}
                  onClick={() => toggleSelection(list.id, selectedLists, setSelectedLists)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedLists.includes(list.id)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {list.name}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Hash className="w-4 h-4 text-primary" /> Number of Questions
            </label>
            <div className="p-6 bg-secondary/30 rounded-xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{questionCount}</span>
                    <span className="text-sm text-muted-foreground">Estimated duration: <span className="text-foreground font-medium">{questionCount * 20} mins</span></span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="5"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Preparing Session...
              </span>
            ) : (
              <>
                Start Interview <Play className="w-5 h-5 fill-current" />
              </>
            )}
          </button>

        </div>
      </motion.div>
    </div>
  );
};

export default MockInterviewSetup;
