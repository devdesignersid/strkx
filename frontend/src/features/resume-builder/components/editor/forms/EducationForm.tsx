import { memo, useCallback } from 'react';
import { useEducation, useSetDraft } from '../../../hooks/useResumeStore';
import { Button } from '@/design-system/components/Button';
import { RichTextEditor } from '../RichTextEditor';
import { Input } from '@/design-system/components/Input';
import { Label } from '@/design-system/components/Label';
import { Plus, Trash2, GripVertical, AlertCircle, GraduationCap } from 'lucide-react';
import EmptyState from '@/design-system/components/EmptyState';
import { Reorder, useDragControls } from 'framer-motion';
import type { ResumeEducation } from '../../../types/schema';

interface EducationItemProps {
    item: ResumeEducation;
    index: number;
    updateItem: (index: number, key: string, val: any) => void;
    removeItem: (index: number) => void;
}

const EducationItem = memo(({ item, index, updateItem, removeItem }: EducationItemProps) => {
    const controls = useDragControls();

    return (
        <Reorder.Item value={item} dragListener={false} dragControls={controls} className="relative">
            <div className="border border-border rounded-lg p-5 bg-card shadow-sm space-y-4 relative group transition-all hover:border-primary/30 hover:shadow-md">
                <div className="absolute right-4 top-4 pl-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gradient-to-l from-card via-card to-transparent">
                    <div
                        onPointerDown={(e) => controls.start(e)}
                        className="cursor-grab active:cursor-grabbing p-2 text-muted-foreground hover:text-foreground touch-none"
                    >
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeItem(index)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Institution</Label>
                        <Input
                            value={item.institution}
                            onChange={e => updateItem(index, 'institution', e.target.value)}
                            placeholder="University Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Degree</Label>
                        <Input
                            value={item.degree}
                            onChange={e => updateItem(index, 'degree', e.target.value)}
                            placeholder="Bachelor's, Master's, etc."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Field of Study</Label>
                        <Input
                            value={item.field}
                            onChange={e => updateItem(index, 'field', e.target.value)}
                            placeholder="Computer Science"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex justify-between">
                            <span>Graduation Year (Optional)</span>
                            <span className="text-xs text-muted-foreground font-normal">YYYY</span>
                        </Label>
                        <Input
                            value={item.graduationYear || item.endDate || ''}
                            onChange={e => updateItem(index, 'graduationYear', e.target.value)}
                            placeholder="2024"
                        />
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Omit to avoid age bias (recommended for non-recent grads)
                        </p>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                    <Label>Additional Details (Honors, GPA, etc.)</Label>
                    <RichTextEditor
                        value={item.description || ''}
                        onChange={(val: string) => updateItem(index, 'description', val)}
                        placeholder="• Graduated Cum Laude..."
                    />
                </div>
            </div>
        </Reorder.Item>
    );
});

EducationItem.displayName = 'EducationItem';

export const EducationForm = memo(() => {
    // Use granular selectors
    const education = useEducation();
    const setDraft = useSetDraft();

    const updateItem = useCallback((index: number, key: string, val: any) => {
        setDraft(prev => {
            const newItems = [...prev.content.education];
            newItems[index] = { ...newItems[index], [key]: val };
            return { ...prev, content: { ...prev.content, education: newItems } };
        });
    }, [setDraft]);

    const addItem = useCallback(() => {
        setDraft(prev => ({
            ...prev,
            content: {
                ...prev.content,
                education: [
                    ...prev.content.education,
                    {
                        id: crypto.randomUUID(),
                        institution: '',
                        degree: '',
                        field: '',
                        graduationYear: '',
                        description: ''
                    }
                ]
            }
        }));
    }, [setDraft]);

    const removeItem = useCallback((index: number) => {
        setDraft(prev => {
            const newItems = [...prev.content.education];
            newItems.splice(index, 1);
            return { ...prev, content: { ...prev.content, education: newItems } };
        });
    }, [setDraft]);

    const handleReorder = useCallback((newOrder: ResumeEducation[]) => {
        setDraft(prev => ({ ...prev, content: { ...prev.content, education: newOrder } }));
    }, [setDraft]);

    return (
        <div className="space-y-6 p-1">
            <div className="flex justify-between items-center border-b border-border py-3">
                <h3 className="font-semibold text-lg text-foreground">Education</h3>
                <Button onClick={addItem} size="sm" variant="outline" className="h-8">
                    <Plus className="w-4 h-4" /> Add Education
                </Button>
            </div>

            <div className="space-y-4">
                <Reorder.Group axis="y" values={education} onReorder={handleReorder} className="space-y-4">
                    {education.map((item, index) => (
                        <EducationItem
                            key={item.id}
                            item={item}
                            index={index}
                            updateItem={updateItem}
                            removeItem={removeItem}
                        />
                    ))}
                </Reorder.Group>
                {education.length === 0 && (
                    <EmptyState
                        icon={GraduationCap}
                        title="No education added"
                        description="Add your educational background."
                        className="py-12 border-2 border-dashed border-border rounded-lg"
                    />
                )}
            </div>
        </div>
    );
});

EducationForm.displayName = 'EducationForm';

