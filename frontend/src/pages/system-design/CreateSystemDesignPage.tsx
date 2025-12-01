import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Save, ArrowLeft, Loader2, ChevronDown, Bold, Italic, List, Code, Link as LinkIcon, Heading1, Heading2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { systemDesignApi } from '@/features/system-design/api/systemDesignApi';
import { aiService } from '@/lib/ai/aiService';
import { Modal } from '@/components/ui/Modal';

export default function CreateSystemDesignPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAIEnabled, setIsAIEnabled] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
        tags: '',
        description: '## Problem Description\n\nDesign a system that...',
        defaultDuration: 45,
    });

    const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch problem data when editing
    useEffect(() => {
        if (isEditMode && id) {
            setIsLoading(true);
            systemDesignApi.getProblem(id)
                .then(problem => {
                    setFormData({
                        title: problem.title || '',
                        slug: problem.slug || '',
                        difficulty: problem.difficulty || 'Medium',
                        tags: Array.isArray(problem.tags) ? problem.tags.join(', ') : '',
                        description: problem.description || '',
                        defaultDuration: problem.defaultDuration || 45,
                    });
                })
                .catch(err => {
                    console.error('Failed to fetch problem:', err);
                    toast.error('Failed to load problem');
                    navigate('/system-design');
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
        // Simple slug generation
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setFormData({ ...formData, title, slug });
    };

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

    const handleAIGenerate = async () => {
        if (!formData.title) {
            toast.error('Please enter a title first');
            return;
        }

        if (!aiService.isConfigured()) {
            toast.error('AI API Key is missing. Please configure it in Settings.');
            return;
        }

        setIsGenerating(true);
        try {
            // Use a prompt tailored for System Design
            const prompt = `Generate a system design interview problem for "${formData.title}".
        Return a JSON object with the following structure:
        {
            "difficulty": "Easy" | "Medium" | "Hard",
            "description": "Markdown description of the problem...",
            "tags": ["tag1", "tag2"],
            "constraints": ["constraint1", "constraint2"]
        }
        The description should include:
        1. Functional Requirements
        2. Non-Functional Requirements
        3. Out of Scope (optional)
        `;

            const response = await aiService.generateCompletion(prompt);

            // Clean up response if it contains markdown code blocks
            const jsonStr = response.replace(/```json\n?|\n?```/g, '');
            const generated = JSON.parse(jsonStr);

            setFormData(prev => ({
                ...prev,
                difficulty: generated.difficulty || prev.difficulty,
                description: generated.description ? generated.description.replace(/\\n/g, '\n') : prev.description,
                tags: Array.isArray(generated.tags) ? generated.tags.join(', ') : prev.tags,
            }));

            if (generated.constraints && Array.isArray(generated.constraints)) {
                let constraintText = '\n\n### Constraints & Assumptions\n';
                generated.constraints.forEach((c: string) => {
                    constraintText += `- ${c}\n`;
                });
                setFormData(prev => ({
                    ...prev,
                    description: prev.description + constraintText
                }));
            }

            toast.success('Problem generated successfully');
        } catch (error) {
            console.error('AI Generation failed:', error);
            toast.error('Failed to generate problem using AI');
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
                // Ensure difficulty is one of the valid types
                difficulty: formData.difficulty as 'Easy' | 'Medium' | 'Hard',
            };

            if (isEditMode && id) {
                await systemDesignApi.updateProblem(id, payload);
                toast.success('Problem updated successfully');
            } else {
                await systemDesignApi.createProblem(payload);
                toast.success('Problem created successfully');
            }
            navigate('/system-design');
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
                    <button onClick={() => navigate('/system-design')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <h1 className="font-semibold text-lg">{isEditMode ? 'Edit System Design Problem' : 'Create System Design Problem'}</h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/system-design')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-transparent text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !formData.title}
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
                                    placeholder="E.g. Design Twitter"
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

                        <div className="grid grid-cols-3 gap-6">
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
                                                        setFormData({ ...formData, difficulty: diff as any });
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
                                <label className="text-sm font-medium text-foreground">Duration (mins)</label>
                                <input
                                    type="number"
                                    value={formData.defaultDuration}
                                    onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 0 })}
                                    min={1}
                                    className="w-full bg-secondary/30 border border-white/5 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full bg-secondary/30 border border-white/5 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                    placeholder="E.g. Scalability, Database"
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
                        <div className="grid grid-cols-2 gap-4 h-[500px]">
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
