import { memo, useCallback } from 'react';
import { useAwards, useSetDraft } from '../../../hooks/useResumeStore';
import { Button } from '@/design-system/components/Button';
import { RichTextEditor } from '../RichTextEditor';
import { Input } from '@/design-system/components/Input';
import { Label } from '@/design-system/components/Label';
import { Plus, Trash2, GripVertical, Award } from 'lucide-react';
import EmptyState from '@/design-system/components/EmptyState';
import { Reorder, useDragControls } from 'framer-motion';
import type { ResumeAward } from '../../../types/schema';

interface AwardItemProps {
    item: ResumeAward;
    index: number;
    updateItem: (index: number, key: string, val: any) => void;
    removeItem: (index: number) => void;
}

const AwardItem = memo(({ item, index, updateItem, removeItem }: AwardItemProps) => {
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
                        <Label>Award / Certificate Name</Label>
                        <Input
                            value={item.title}
                            onChange={e => updateItem(index, 'title', e.target.value)}
                            placeholder="e.g. AWS Certified Solutions Architect"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Issuer / Organization</Label>
                        <Input
                            value={item.issuer}
                            onChange={e => updateItem(index, 'issuer', e.target.value)}
                            placeholder="e.g. Amazon Web Services"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Date Received</Label>
                        <Input
                            value={item.date}
                            onChange={e => updateItem(index, 'date', e.target.value)}
                            placeholder="e.g. June 2024"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <RichTextEditor
                        value={item.description || ''}
                        onChange={(val: string) => updateItem(index, 'description', val)}
                        placeholder="Brief details..."
                    />
                </div>
            </div>
        </Reorder.Item>
    );
});

AwardItem.displayName = 'AwardItem';

export const AwardsForm = memo(() => {
    // Use granular selectors
    const awards = useAwards() || [];
    const setDraft = useSetDraft();

    const updateItem = useCallback((index: number, key: string, val: any) => {
        setDraft(prev => {
            const newItems = [...(prev.content.awards || [])];
            newItems[index] = { ...newItems[index], [key]: val };
            return { ...prev, content: { ...prev.content, awards: newItems } };
        });
    }, [setDraft]);

    const addItem = useCallback(() => {
        setDraft(prev => ({
            ...prev,
            content: {
                ...prev.content,
                awards: [
                    ...(prev.content.awards || []),
                    {
                        id: crypto.randomUUID(),
                        title: '',
                        issuer: '',
                        date: '',
                        description: ''
                    }
                ]
            }
        }));
    }, [setDraft]);

    const removeItem = useCallback((index: number) => {
        setDraft(prev => {
            const newItems = [...(prev.content.awards || [])];
            newItems.splice(index, 1);
            return { ...prev, content: { ...prev.content, awards: newItems } };
        });
    }, [setDraft]);

    const handleReorder = useCallback((newOrder: ResumeAward[]) => {
        setDraft(prev => ({ ...prev, content: { ...prev.content, awards: newOrder } }));
    }, [setDraft]);

    return (
        <div className="space-y-6 p-1">
            <div className="flex justify-between items-center border-b border-border pb-2">
                <h3 className="font-semibold text-lg text-foreground">Awards & Certifications</h3>
                <Button onClick={addItem} size="sm" variant="outline" className="h-8">
                    <Plus className="w-4 h-4" /> Add
                </Button>
            </div>

            <div className="space-y-4">
                <Reorder.Group axis="y" values={awards} onReorder={handleReorder} className="space-y-4">
                    {awards.map((item, index) => (
                        <AwardItem
                            key={item.id}
                            item={item}
                            index={index}
                            updateItem={updateItem}
                            removeItem={removeItem}
                        />
                    ))}
                </Reorder.Group>
                {awards.length === 0 && (
                    <EmptyState
                        icon={Award}
                        title="No awards or certifications"
                        description="Highlight your achievements and credentials."
                        className="py-12 border-2 border-dashed border-border rounded-lg"
                    />
                )}
            </div>
        </div>
    );
});

AwardsForm.displayName = 'AwardsForm';

