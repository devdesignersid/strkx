/**
 * Modal to preview extracted skills before applying to resume
 */

import { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/design-system/components/Button';
import { X, Check, Trash2 } from 'lucide-react';
import type { SkillCategory } from '../../types/schema';

interface SkillPreviewModalProps {
    categories: SkillCategory[];
    onApply: (categories: SkillCategory[]) => void;
    onCancel: () => void;
}

export const SkillPreviewModal = memo(({ categories, onApply, onCancel }: SkillPreviewModalProps) => {
    const [editedCategories, setEditedCategories] = useState<SkillCategory[]>(categories);

    const removeSkill = (categoryId: string, skill: string) => {
        setEditedCategories(prev =>
            prev.map(cat =>
                cat.id === categoryId
                    ? { ...cat, skills: cat.skills.filter(s => s !== skill) }
                    : cat
            ).filter(cat => cat.skills.length > 0) // Remove empty categories
        );
    };

    const removeCategory = (categoryId: string) => {
        setEditedCategories(prev => prev.filter(cat => cat.id !== categoryId));
    };

    const totalSkills = editedCategories.reduce((sum, cat) => sum + cat.skills.length, 0);

    // Use createPortal to render at document.body level, above all other content
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Extracted Skills</h2>
                        <p className="text-sm text-muted-foreground">
                            {totalSkills} skill{totalSkills !== 1 ? 's' : ''} found in {editedCategories.length} categor{editedCategories.length !== 1 ? 'ies' : 'y'}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {editedCategories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No skills remaining. Cancel to keep existing skills.</p>
                        </div>
                    ) : (
                        editedCategories.map(cat => (
                            <div key={cat.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeCategory(cat.id)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {cat.skills.map(skill => (
                                        <span
                                            key={skill}
                                            className="inline-flex items-center h-7 bg-primary/10 text-primary pl-3 pr-2 rounded-md text-sm font-medium border border-primary/20 group hover:bg-primary/15 transition-colors"
                                        >
                                            {skill}
                                            <button
                                                className="ml-2 opacity-60 hover:opacity-100 transition-opacity text-primary/60 hover:text-destructive flex items-center justify-center"
                                                onClick={() => removeSkill(cat.id, skill)}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-muted/30">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onApply(editedCategories)}
                        disabled={editedCategories.length === 0}
                        className="gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Apply {totalSkills} Skill{totalSkills !== 1 ? 's' : ''}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
});

SkillPreviewModal.displayName = 'SkillPreviewModal';
