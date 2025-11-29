import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Plus, Trash2, Save, ArrowLeft, Loader2, ChevronDown, Bold, Italic, List, Code, Link as LinkIcon, Heading1, Heading2, Wand2 } from 'lucide-react';
import { aiService } from '../lib/ai/aiService';
import { PROMPTS } from '../lib/ai/prompts';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { Modal } from '../components/ui/Modal';

export default function CreateProblemPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
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
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      axios.get(`http://localhost:3000/problems/id/${id}`, { withCredentials: true })
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

  useEffect(() => {
      aiService.loadFromStorage();
      setIsAIEnabled(aiService.isEnabled());
  }, []);

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

  const handleAIGenerate = async () => {
    if (!formData.title) {
        toast.error('Please enter a title first to generate a problem.');
        return;
    }

    if (!aiService.isConfigured()) {
        toast.error('AI is not configured. Please go to Settings to configure it.');
        return;
    }

    setIsGenerating(true);
    try {
        const prompt = PROMPTS.PROBLEM_GENERATION.replace('{topic}', formData.title);
        const response = await aiService.generateCompletion(prompt);

        // Clean up response if it contains markdown code blocks
        const jsonStr = response.replace(/```json\n?|\n?```/g, '');
        const generated = JSON.parse(jsonStr);

        setFormData(prev => ({
            ...prev,
            difficulty: generated.difficulty || prev.difficulty,
            description: generated.description ? generated.description.replace(/\\n/g, '\n') : prev.description,
            tags: Array.isArray(generated.tags) ? generated.tags.join(', ') : prev.tags,
            starterCode: generated.starterCode ? generated.starterCode.replace(/\\n/g, '\n') : prev.starterCode,
            // We could also set constraints if we had a field for it, or append to description
        }));

        if (generated.examples && Array.isArray(generated.examples)) {
             // Map examples to test cases
             const newTestCases = generated.examples.map((ex: any) => {
                 // Sanitize input/output to remove variable names if present (e.g. "nums = [...]" -> "[...]")
                 const cleanInput = String(ex.input).replace(/^[a-zA-Z0-9_]+\s*=\s*/, '');
                 const cleanOutput = String(ex.output).replace(/^[a-zA-Z0-9_]+\s*=\s*/, '');
                 return {
                     input: cleanInput,
                     expectedOutput: cleanOutput
                 };
             });
             setTestCases(newTestCases);

             // Also append to description as standard LeetCode format
             let exampleText = '\n\n### Examples\n';
             generated.examples.forEach((ex: any, i: number) => {
                 exampleText += `\n\n**Example ${i + 1}:**\n\n`;
                 exampleText += `**Input:** \`${ex.input}\`\n\n`;
                 exampleText += `**Output:** \`${ex.output}\`\n\n`;
                 if (ex.explanation) exampleText += `**Explanation:** ${ex.explanation}\n\n`;
             });

             setFormData(prev => ({
                 ...prev,
                 description: prev.description + exampleText
             }));
        }

        if (generated.constraints && Array.isArray(generated.constraints)) {
            let constraintText = '\n\n### Constraints\n';
            generated.constraints.forEach((c: string) => {
                constraintText += `- ${c}\n`;
            });
             setFormData(prev => ({
                 ...prev,
                 description: prev.description + constraintText
             }));
        }

        toast.success('Problem generated successfully!');
    } catch (error) {
        console.error('AI Generation failed:', error);
        toast.error('Failed to generate problem. Please try again.');
    } finally {
        setIsGenerating(false);
    }
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
        await axios.patch(`http://localhost:3000/problems/${id}`, payload, { withCredentials: true });
      } else {
        await axios.post('http://localhost:3000/problems', payload, { withCredentials: true });
      }
      navigate('/problems');
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} problem:`, error);
      setErrorMessage(`Failed to ${isEditMode ? 'update' : 'create'} problem. Please check your input and try again.`);
      setErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden h-full">
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

      <div className="flex-1 overflow-y-auto w-full">
        <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
        {/* Basic Info */}
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full bg-secondary/30 border border-white/5 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="E.g. Two Sum"
              />
            </div>
            {isAIEnabled && (
                <div className="flex items-end pb-0.5">
                    <button
                        onClick={handleAIGenerate}
                        disabled={isGenerating || !formData.title}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        Auto-Complete with AI
                    </button>
                </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Slug</label>
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
              <label className="text-sm font-medium text-foreground">Difficulty</label>
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
              <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-secondary/30 border border-white/5 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="E.g. Array, Hash Table"
              />
            </div>
          </div>
        </section>
        {/* Description */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Description</label>
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
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{formData.description}</ReactMarkdown>
            </div>
          </div>
        </section>

        {/* Starter Code */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-foreground">Starter Code</label>
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
            <label className="text-sm font-medium text-foreground">Test Cases</label>
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
                    <label className="text-xs font-medium text-foreground/80">Input</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors resize-none h-20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">Expected Output</label>
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


      <Modal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Error"
        description={errorMessage}
        footer={
          <button
            onClick={() => setErrorModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            Close
          </button>
        }
      />
    </div>
  );
}
