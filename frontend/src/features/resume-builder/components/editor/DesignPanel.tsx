import { memo, useCallback, useState } from 'react';
import { useDesign, useSetDraft } from '../../hooks/useResumeStore';
import { FontPicker } from './FontPicker';
import { Label } from '@/design-system/components/Label';
import { Input } from '@/design-system/components/Input';
import { Button } from '@/design-system/components/Button';
import { cn } from '@/lib/utils';
import { LayoutTemplate, Sidebar, Type, Palette, Ruler, ChevronDown } from 'lucide-react';

// Collapsible Section Component
interface SectionProps {
    title: string;
    icon: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

const Section = memo(({ title, icon, defaultOpen = true, children }: SectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-border/60 rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
            <Button
                variant="ghost"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 h-auto rounded-none hover:bg-secondary/50"
                disableMotion
            >
                <div className="flex items-center gap-3">
                    <span className="text-primary">{icon}</span>
                    <span className="text-sm font-semibold text-foreground">{title}</span>
                </div>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </Button>
            <div className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="p-4 pt-2 space-y-4 border-t border-border/40">
                    {children}
                </div>
            </div>
        </div>
    );
});

Section.displayName = 'Section';

// Color Picker Component
interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

const ColorPicker = memo(({ label, value, onChange }: ColorPickerProps) => (
    <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</Label>
        <div className="flex gap-2 items-center">
            <label className="relative w-10 h-10 rounded-lg cursor-pointer border-2 border-border/60 shadow-sm hover:border-primary/50 transition-all hover:shadow-md">
                <span className="absolute inset-1 rounded-md shadow-inner" style={{ backgroundColor: value }} />
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
            </label>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="font-mono text-xs uppercase h-9"
                maxLength={7}
            />
        </div>
    </div>
));

ColorPicker.displayName = 'ColorPicker';

// Slider Component
interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    onChange: (value: number) => void;
}

const Slider = memo(({ label, value, min, max, step, unit, onChange }: SliderProps) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</Label>
            <span className="text-xs font-mono text-foreground bg-secondary/60 px-2 py-1 rounded-md border border-border/40">
                {value}{unit}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            className="w-full h-2 bg-secondary/80 rounded-lg appearance-none cursor-pointer accent-primary"
            onChange={(e) => onChange(parseFloat(e.target.value))}
        />
    </div>
));

Slider.displayName = 'Slider';

// Layout Option Component
interface LayoutOptionProps {
    isSelected: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

const LayoutOption = memo(({ isSelected, icon, label, onClick }: LayoutOptionProps) => (
    <Button
        variant={isSelected ? "soft" : "outline"}
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center h-auto py-5 px-4 gap-2",
            isSelected
                ? "border-primary/40 bg-primary/10 shadow-sm shadow-primary/10"
                : "border-border/60 hover:border-primary/30 hover:bg-secondary/50"
        )}
        disableMotion
    >
        <span className={cn(isSelected ? "text-primary" : "text-muted-foreground")}>
            {icon}
        </span>
        <span className={cn(
            "text-xs font-medium",
            isSelected ? "text-primary" : "text-muted-foreground"
        )}>
            {label}
        </span>
    </Button>
));

LayoutOption.displayName = 'LayoutOption';

export const DesignPanel = memo(() => {
    // Use granular selectors
    const design = useDesign();
    const setDraft = useSetDraft();

    const updateDesign = useCallback((key: keyof typeof design, value: any) => {
        setDraft(draft => ({
            ...draft,
            design: { ...draft.design, [key]: value }
        }));
    }, [setDraft]);

    return (
        <div className="space-y-4">
            {/* Layout Section */}
            <Section title="Layout" icon={<LayoutTemplate className="w-4 h-4" />}>
                <div className="grid grid-cols-2 gap-3">
                    <LayoutOption
                        isSelected={design.layout === 'single'}
                        icon={<LayoutTemplate className="w-5 h-5" />}
                        label="Single Column"
                        onClick={() => updateDesign('layout', 'single')}
                    />
                    <LayoutOption
                        isSelected={design.layout === 'sidebar'}
                        icon={<Sidebar className="w-5 h-5" />}
                        label="Sidebar"
                        onClick={() => updateDesign('layout', 'sidebar')}
                    />
                </div>
            </Section>

            {/* Typography Section */}
            <Section title="Typography" icon={<Type className="w-4 h-4" />}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Body Font</Label>
                        <FontPicker
                            value={design.fontBody}
                            onChange={(v) => updateDesign('fontBody', v)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Heading Font</Label>
                        <FontPicker
                            value={design.fontHeading || design.fontBody}
                            onChange={(v) => updateDesign('fontHeading', v)}
                        />
                    </div>

                    <Slider
                        label="Line Height"
                        value={design.lineHeight}
                        min={1}
                        max={2}
                        step={0.05}
                        unit="x"
                        onChange={(v) => updateDesign('lineHeight', v)}
                    />
                </div>
            </Section>

            {/* Colors Section */}
            <Section title="Colors" icon={<Palette className="w-4 h-4" />}>
                <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                        label="Heading"
                        value={design.headingColor || design.accentColor}
                        onChange={(v) => updateDesign('headingColor', v)}
                    />
                    <ColorPicker
                        label="Body Text"
                        value={design.bodyColor || '#374151'}
                        onChange={(v) => updateDesign('bodyColor', v)}
                    />
                    <div className="col-span-2">
                        <ColorPicker
                            label="Accent (Links & Dates)"
                            value={design.accentColor || '#4a4a4a'}
                            onChange={(v) => updateDesign('accentColor', v)}
                        />
                    </div>
                </div>
            </Section>

            {/* Spacing Section */}
            <Section title="Spacing" icon={<Ruler className="w-4 h-4" />} defaultOpen={false}>
                <Slider
                    label="Page Margins"
                    value={design.margin}
                    min={18}
                    max={72}
                    step={6}
                    unit="pt"
                    onChange={(v) => updateDesign('margin', v)}
                />
            </Section>
        </div>
    );
});

DesignPanel.displayName = 'DesignPanel';
