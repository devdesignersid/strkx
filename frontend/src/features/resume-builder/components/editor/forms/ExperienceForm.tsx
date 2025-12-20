import { memo, useCallback } from 'react';
import { useExperience, useSetDraft } from '../../../hooks/useResumeStore';
import { RichTextEditor } from '../RichTextEditor';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/Input';
import { Label } from '@/design-system/components/Label';
import { Checkbox } from '@/design-system/components/Checkbox';
import EmptyState from '@/design-system/components/EmptyState';
import { Plus, Trash2, GripVertical, Briefcase } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';
import type { ResumeExperience } from '../../../types/schema';

interface ExperienceItemProps {
    item: ResumeExperience;
    index: number;
    updateItem: (index: number, key: string, val: any) => void;
    removeItem: (index: number) => void;
}

const ExperienceItem = memo(({ item, index, updateItem, removeItem }: ExperienceItemProps) => {
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
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(index)}
                        title="Delete position"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Company</Label>
                        <Input
                            value={item.company}
                            onChange={e => updateItem(index, 'company', e.target.value)}
                            placeholder="Company Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={item.position}
                            onChange={e => updateItem(index, 'position', e.target.value)}
                            placeholder="Job Title"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                            value={item.location || ''}
                            onChange={e => updateItem(index, 'location', e.target.value)}
                            placeholder="City, State"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                            value={item.startDate}
                            onChange={e => updateItem(index, 'startDate', e.target.value)}
                            placeholder="MM/YYYY"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <div className="flex gap-2">
                            <Input
                                value={item.endDate}
                                onChange={e => updateItem(index, 'endDate', e.target.value)}
                                placeholder={item.isCurrent ? "Present" : "MM/YYYY"}
                                disabled={item.isCurrent}
                            />
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={item.isCurrent}
                                    onCheckedChange={(checked) => updateItem(index, 'isCurrent', checked === true)}
                                    id={`current-${item.id}`}
                                />
                                <Label htmlFor={`current-${item.id}`} className="font-normal cursor-pointer">Current</Label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <RichTextEditor
                        value={item.description || ''}
                        onChange={(val: string) => updateItem(index, 'description', val)}
                        placeholder="• Led a team of 5 developers..."
                    />
                    <p className="text-xs text-muted-foreground">Detailed descriptions with metrics (e.g., 'Increased sales by 20%') score higher.</p>
                </div>
            </div>
        </Reorder.Item>
    );
});

ExperienceItem.displayName = 'ExperienceItem';

export const ExperienceForm = memo(() => {
    // Use granular selectors
    const experience = useExperience();
    const setDraft = useSetDraft();

    const updateItem = useCallback((index: number, key: string, val: any) => {
        setDraft(prev => {
            const newExp = [...prev.content.experience];
            newExp[index] = { ...newExp[index], [key]: val };
            return { ...prev, content: { ...prev.content, experience: newExp } };
        });
    }, [setDraft]);

    const addItem = useCallback(() => {
        setDraft(prev => ({
            ...prev,
            content: {
                ...prev.content,
                experience: [
                    ...prev.content.experience,
                    {
                        id: crypto.randomUUID(),
                        company: '',
                        position: '',
                        startDate: '',
                        endDate: '',
                        isCurrent: false,
                        location: '',
                        description: ''
                    }
                ]
            }
        }));
    }, [setDraft]);

    const removeItem = useCallback((index: number) => {
        setDraft(prev => {
            const newExp = [...prev.content.experience];
            newExp.splice(index, 1);
            return { ...prev, content: { ...prev.content, experience: newExp } };
        });
    }, [setDraft]);

    const handleReorder = useCallback((newOrder: ResumeExperience[]) => {
        setDraft(prev => ({ ...prev, content: { ...prev.content, experience: newOrder } }));
    }, [setDraft]);

    return (
        <div className="space-y-6 p-1">
            <div className="flex justify-between items-center border-b border-border py-3">
                <h3 className="font-semibold text-lg text-foreground">Experience</h3>
                <Button onClick={addItem} size="sm" variant="outline" className="h-8">
                    <Plus className="w-4 h-4" /> Add Position
                </Button>
            </div>

            <div className="space-y-4">
                {experience.length === 0 && (
                    <EmptyState
                        icon={Briefcase}
                        title="No experience added"
                        description="Add your work history to showcase your background."
                        className="py-12 border-2 border-dashed border-border rounded-lg"
                    />
                )}

                <Reorder.Group axis="y" values={experience} onReorder={handleReorder} className="space-y-4">
                    {experience.map((item, index) => (
                        <ExperienceItem
                            key={item.id}
                            item={item}
                            index={index}
                            updateItem={updateItem}
                            removeItem={removeItem}
                        />
                    ))}
                </Reorder.Group>
            </div>
        </div>
    );
});

ExperienceForm.displayName = 'ExperienceForm';

