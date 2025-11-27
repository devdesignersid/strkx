import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plus, Trash2, Save, ArrowLeft, Loader2, ChevronDown, Bold, Italic, List, Code, Link as LinkIcon, Heading1, Heading2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function CreateProblemPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    difficulty: 'Medium',
    tags: '',
    description: '## Problem Description\n\nWrite a function that...',
    starterCode: '// Write your code here\n',
  });

  const [testCases, setTestCases] = useState([
    { input: '', expectedOutput: '' }
  ]);

  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('description-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.description;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}${prefix}${selection}${suffix}${after}`;
    setFormData({ ...formData, description: newText });

    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Fetch problem data when editing
  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      // Use the GET endpoint that accepts ID parameter
      axios.get(`http://localhost:3000/problems/id/${id}`)
        .then(res => {
          const problem = res.data;
          setFormData({
            title: problem.title || '',
            slug: problem.slug || '',
            difficulty: problem.difficulty || 'Medium',
            tags: Array.isArray(problem.tags) ? problem.tags.join(', ') : '',
            description: problem.description || '',
            starterCode: problem.starterCode || '',
          });
          if (problem.testCases && problem.testCases.length > 0) {
            setTestCases(problem.testCases.map((tc: {input: string, expectedOutput: string}) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput
            })));
          }
        })
        .catch(err => {
          console.error('Failed to fetch problem:', err);
          navigate('/problems');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditMode, navigate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData({ ...formData, title, slug });
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '' }]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: 'input' | 'expectedOutput', value: string) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        testCases,
      };

      if (isEditMode && id) {
        await axios.patch(`http://localhost:3000/problems/${id}`, payload);
      } else {
        await axios.post('http://localhost:3000/problems', payload);
      }
      navigate('/problems');
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} problem:`, error);
      alert(`Failed to ${isEditMode ? 'update' : 'create'} problem`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="h-14 border-b border-white/5 bg-card/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/problems')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="font-semibold text-lg">{isEditMode ? 'Edit Problem' : 'Create New Problem'}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/problems')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-transparent text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditMode ? 'Update Problem' : 'Save Problem'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-8">
        {/* Basic Info */}
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full bg-secondary/30 border border-white/5 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Two Sum"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-secondary/30 border border-white/5 rounded-md px-3 py-2 text-sm font-mono text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Difficulty</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDifficultyOpen(!isDifficultyOpen)}
                  className="w-full bg-secondary/30 border border-white/5 rounded-md px-3 py-2 text-sm flex items-center justify-between hover:bg-secondary/50 transition-colors"
                >
                  <span className={clsx(
                    formData.difficulty === 'Easy' && "text-green-500",
                    formData.difficulty === 'Medium' && "text-yellow-500",
                    formData.difficulty === 'Hard' && "text-red-500"
                  )}>
                    {formData.difficulty}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>

                {isDifficultyOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-xl z-50 overflow-hidden">
                    {['Easy', 'Medium', 'Hard'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, difficulty: diff });
                          setIsDifficultyOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors flex items-center gap-2"
                      >
                         <div className={clsx(
                           "w-2 h-2 rounded-full",
                           diff === 'Easy' && "bg-green-500",
                           diff === 'Medium' && "bg-yellow-500",
                           diff === 'Hard' && "bg-red-500"
                         )} />
                         {diff}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-secondary/30 border border-white/5 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Array, Hash Table"
              />
            </div>
          </div>
        </section>
        {/* Description */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <div className="flex items-center gap-1 bg-secondary/30 rounded-md p-1 border border-white/5">
              <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="Bold">
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="Italic">
                <Italic className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button onClick={() => insertMarkdown('# ')} className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="Heading 1">
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => insertMarkdown('## ')} className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="Heading 2">
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button onClick={() => insertMarkdown('- ')} className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="List">
                <List className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => insertMarkdown('```\n', '\n```')} className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="Code Block">
                <Code className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => insertMarkdown('[', '](url)')} className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground" title="Link">
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 h-[400px]">
            <textarea
              id="description-editor"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-full bg-secondary/30 border border-white/5 rounded-md p-4 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors resize-none"
              placeholder="Type your problem description here..."
            />
            <div className="h-full bg-card/30 border border-white/5 rounded-md p-4 overflow-y-auto prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{formData.description}</ReactMarkdown>
            </div>
          </div>
        </section>

        {/* Starter Code */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Starter Code</label>
          <div className="h-[300px] border border-white/5 rounded-md overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={formData.starterCode}
              onChange={(value) => setFormData({ ...formData, starterCode: value || '' })}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 16 },
              }}
            />
          </div>
        </section>

        {/* Test Cases */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">Test Cases</label>
            <button
              onClick={addTestCase}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Test Case
            </button>
          </div>
          <div className="space-y-4">
            {testCases.map((tc, i) => (
              <div key={i} className="bg-secondary/20 border border-white/5 rounded-md p-4 space-y-3 relative group">
                <button
                  onClick={() => removeTestCase(i)}
                  className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Input</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors resize-none h-20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Expected Output</label>
                    <textarea
                      value={tc.expectedOutput}
                      onChange={(e) => updateTestCase(i, 'expectedOutput', e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors resize-none h-20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
