import { useState, memo, useCallback, useEffect } from 'react';
import { useSkillCategories, useSetDraft } from '../../../hooks/useResumeStore';
import { useSkillExtraction } from '../../../hooks/useSkillExtraction';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/Input';
import { Label } from '@/design-system/components/Label';
import { Plus, X, Trash2, Wrench, Sparkles, Loader2 } from 'lucide-react';
import EmptyState from '@/design-system/components/EmptyState';
import { SkillPreviewModal } from '../SkillPreviewModal';
import { aiService } from '@/lib/ai/aiService';
import type { SkillCategory } from '../../../types/schema';
import { toast } from 'sonner';

export const SkillsForm = memo(() => {
    // Use granular selectors
    const categories = useSkillCategories() || [];
    const setDraft = useSetDraft();

    // AI state - load from storage on mount
    const [isAIEnabled, setIsAIEnabled] = useState(false);
    useEffect(() => {
        aiService.loadFromStorage();
        setIsAIEnabled(aiService.isConfigured() && aiService.isEnabled());
    }, []);

    // AI extraction
    const { extractSkills, isLoading, error } = useSkillExtraction();
    const [previewCategories, setPreviewCategories] = useState<SkillCategory[] | null>(null);

    // State for new category creation
    const [newCategoryName, setNewCategoryName] = useState('');

    // State for new skills (mapped by category ID)
    const [skillInputs, setSkillInputs] = useState<Record<string, string>>({});

    const handleAutoPopulate = useCallback(async () => {
        const result = await extractSkills();
        if (result && result.length > 0) {
            setPreviewCategories(result);
        } else if (!result) {
            // Error already set in hook, show toast
            toast.error('Failed to extract skills. Check your AI configuration.');
        } else {
            toast.warning('No skills found in your work experience.');
        }
    }, [extractSkills]);

    const handleApplySkills = useCallback((newCategories: SkillCategory[]) => {
        setDraft(prev => ({
            ...prev,
            content: {
                ...prev.content,
                skillCategories: newCategories
            }
        }));
        setPreviewCategories(null);
        toast.success(`Applied ${newCategories.reduce((sum, c) => sum + c.skills.length, 0)} skills`);
    }, [setDraft]);

    const handleCancelPreview = useCallback(() => {
        setPreviewCategories(null);
    }, []);

    const addCategory = useCallback(() => {
        if (!newCategoryName.trim()) return;
        setDraft(prev => ({
            ...prev,
            content: {
                ...prev.content,
                skillCategories: [
                    ...(prev.content.skillCategories || []),
                    { id: crypto.randomUUID(), name: newCategoryName.trim(), skills: [] }
                ]
            }
        }));
        setNewCategoryName('');
    }, [newCategoryName, setDraft]);

    const removeCategory = useCallback((id: string) => {
        setDraft(prev => ({
            ...prev,
            content: {
                ...prev.content,
                skillCategories: (prev.content.skillCategories || []).filter(c => c.id !== id)
            }
        }));
    }, [setDraft]);

    const updateCategoryName = useCallback((id: string, name: string) => {
        setDraft(prev => ({
            ...prev,
            content: {
                ...prev.content,
                skillCategories: (prev.content.skillCategories || []).map(c =>
                    c.id === id ? { ...c, name } : c
                )
            }
        }));
    }, [setDraft]);

    const addSkill = useCallback((categoryId: string) => {
        const val = skillInputs[categoryId];
        if (!val?.trim()) return;

        setDraft(prev => ({
            ...prev,
            content: {
                ...prev.content,
                skillCategories: (prev.content.skillCategories || []).map(c =>
                    c.id === categoryId
                        ? { ...c, skills: [...c.skills, val.trim()] }
                        : c
                )
            }
        }));

        setSkillInputs(prev => ({ ...prev, [categoryId]: '' }));
    }, [skillInputs, setDraft]);

    const removeSkill = useCallback((categoryId: string, skill: string) => {
        setDraft(prev => ({
            ...prev,
            content: {
                ...prev.content,
                skillCategories: (prev.content.skillCategories || []).map(c =>
                    c.id === categoryId
                        ? { ...c, skills: c.skills.filter(s => s !== skill) }
                        : c
                )
            }
        }));
    }, [setDraft]);



    return (
        <div className="space-y-6 p-1">
            <div className="flex justify-between items-center border-b border-border py-3">
                <h3 className="font-semibold text-lg text-foreground">Skills</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoPopulate}
                    disabled={isLoading || !isAIEnabled}
                    className="gap-2 text-xs"
                    title={!isAIEnabled ? 'Configure AI in Settings first' : 'Extract skills from Work Experience'}
                >
                    {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Auto-Populate
                </Button>
            </div>

            {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Add Category Form */}
            <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                    <Label>New Skill Category</Label>
                    <Input
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Languages, Frameworks, Tools"
                        onKeyDown={e => e.key === 'Enter' && addCategory()}
                    />
                </div>
                <Button onClick={addCategory} disabled={!newCategoryName.trim()} size="sm" variant="outline" className="h-9">
                    <Plus className="w-4 h-4" /> Add
                </Button>
            </div>

            {/* Existing Categories */}
            <div className="space-y-6">
                {categories.map(cat => (
                    <div key={cat.id} className="border border-border rounded-lg p-4 bg-card shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center gap-4">
                            <Input
                                value={cat.name}
                                onChange={e => updateCategoryName(cat.id, e.target.value)}
                                className="font-semibold text-base"
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeCategory(cat.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Skills List */}
                        <div className="flex flex-wrap gap-2">
                            {cat.skills.map(skill => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center h-7 bg-primary/10 text-primary pl-3 pr-2 rounded-md text-sm font-medium border border-primary/20 group hover:bg-primary/15 transition-colors"
                                >
                                    {skill}
                                    <button
                                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary/60 hover:text-destructive flex items-center justify-center"
                                        onClick={() => removeSkill(cat.id, skill)}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Add Skill Input */}
                        <div className="flex gap-2">
                            <Input
                                value={skillInputs[cat.id] || ''}
                                onChange={e => setSkillInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && addSkill(cat.id)}
                                placeholder={`Add skill...`}
                                className="flex-1"
                            />
                            <Button onClick={() => addSkill(cat.id)} disabled={!skillInputs[cat.id]?.trim()} size="sm" variant="outline" className="h-9">
                                <Plus className="w-4 h-4" /> Add
                            </Button>
                        </div>
                    </div>
                ))}

                {categories.length === 0 && (
                    <EmptyState
                        icon={Wrench}
                        title="No skill categories"
                        description="Add categories like 'Languages' or 'Frameworks' to organize your skills."
                        className="py-12 border-2 border-dashed border-border rounded-lg"
                    />
                )}
            </div>

            {/* Preview Modal */}
            {previewCategories && (
                <SkillPreviewModal
                    categories={previewCategories}
                    onApply={handleApplySkills}
                    onCancel={handleCancelPreview}
                />
            )}
        </div>
    );
});

SkillsForm.displayName = 'SkillsForm';
