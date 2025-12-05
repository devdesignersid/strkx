
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, FileJson, Package, Code, Database, CheckCircle, Loader2, Settings2 } from 'lucide-react';
import { Button, Label, Checkbox } from '@/design-system/components';
import { dataPortService } from '@/services/api/data-port.service';
import { problemsService } from '@/services/api/problems.service';
import { systemDesignApi } from '@/services/api/system-design.service';
import { listsService } from '@/services/api/lists.service';
import type { ExportOptions } from '@/services/api/data-port.service';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { ItemSelectionModal } from './ItemSelectionModal';

interface CheckboxItemProps {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    icon?: React.ReactNode;
    onCustomize?: () => void;
    selectionCount?: number;
}

function CheckboxItem({ id, label, description, checked, onChange, icon, onCustomize, selectionCount = 0 }: CheckboxItemProps) {
    return (
        <div className={cn(
            "flex flex-col p-3 rounded-lg border transition-all duration-200 cursor-pointer group",
            checked
                ? "border-primary/50 bg-primary/5 shadow-sm"
                : "border-border/50 bg-card hover:bg-secondary/40 hover:border-primary/20 hover:shadow-sm"
        )}>
            <div className="flex items-start gap-3">
                <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={onChange}
                    className="mt-1"
                />

                <div className="flex-1 min-w-0">
                    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                        {icon && <span className="text-muted-foreground">{icon}</span>}
                        {label}
                    </label>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
            </div>

            {checked && onCustomize && (
                <div className="ml-7 mt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCustomize}
                        className="h-7 text-xs gap-1.5 border-dashed border-border hover:border-solid hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
                    >
                        <Settings2 className="w-3 h-3" />
                        {selectionCount > 0 ? `${selectionCount} selected` : 'Select specific items...'}
                    </Button>
                </div>
            )}
        </div>
    );
}

export function ExportSection() {
    const [options, setOptions] = useState<ExportOptions>({
        includeCodingProblems: true,
        includeSystemDesignProblems: true,
        includeLists: true,
        includeTestCases: true,
        includeSubmissions: false,
        includeSolutions: true,
        problemIds: [],
        systemDesignProblemIds: [],
        listIds: [],
    });

    const [modals, setModals] = useState({
        coding: false,
        systemDesign: false,
        lists: false,
    });

    const exportMutation = useMutation({
        mutationFn: () => dataPortService.exportData(options),
        onSuccess: (blob) => {
            dataPortService.downloadFile(blob);
            toast.success('Export completed successfully!');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to export data');
        },
    });

    const updateOption = (key: keyof ExportOptions, value: any) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const hasAnySelected =
        options.includeCodingProblems ||
        options.includeSystemDesignProblems ||
        options.includeLists;

    return (
        <div className="space-y-5">
            {/* Entity Selection */}
            <div>
                <Label className="text-sm text-muted-foreground mb-3 block">
                    Select what to export
                </Label>
                <div className="grid gap-2">
                    <CheckboxItem
                        id="export-coding"
                        label="Coding Problems"
                        description="Algorithm and data structure problems"
                        checked={options.includeCodingProblems || false}
                        onChange={(checked) => updateOption('includeCodingProblems', checked)}
                        icon={<Code className="w-4 h-4" />}
                        onCustomize={() => setModals(prev => ({ ...prev, coding: true }))}
                        selectionCount={options.problemIds?.length}
                    />
                    <CheckboxItem
                        id="export-system-design"
                        label="System Design Problems"
                        description="Architecture and design problems"
                        checked={options.includeSystemDesignProblems || false}
                        onChange={(checked) => updateOption('includeSystemDesignProblems', checked)}
                        icon={<Database className="w-4 h-4" />}
                        onCustomize={() => setModals(prev => ({ ...prev, systemDesign: true }))}
                        selectionCount={options.systemDesignProblemIds?.length}
                    />
                    <CheckboxItem
                        id="export-lists"
                        label="Lists"
                        description="Problem collections and study lists"
                        checked={options.includeLists || false}
                        onChange={(checked) => updateOption('includeLists', checked)}
                        icon={<Package className="w-4 h-4" />}
                        onCustomize={() => setModals(prev => ({ ...prev, lists: true }))}
                        selectionCount={options.listIds?.length}
                    />
                </div>
            </div>

            {/* Optional Data */}
            <div>
                <Label className="text-sm text-muted-foreground mb-3 block">
                    Include optional data
                </Label>
                <div className="grid gap-2">
                    <CheckboxItem
                        id="export-testcases"
                        label="Test Cases"
                        description="Input/output test cases for coding problems"
                        checked={options.includeTestCases || false}
                        onChange={(checked) => updateOption('includeTestCases', checked)}
                        icon={<FileJson className="w-4 h-4" />}
                    />
                    <CheckboxItem
                        id="export-solutions"
                        label="Marked Solutions"
                        description="Submissions you've marked as solutions"
                        checked={options.includeSolutions || false}
                        onChange={(checked) => updateOption('includeSolutions', checked)}
                        icon={<CheckCircle className="w-4 h-4" />}
                    />
                    <CheckboxItem
                        id="export-submissions"
                        label="All Submissions"
                        description="Complete submission history (may increase file size)"
                        checked={options.includeSubmissions || false}
                        onChange={(checked) => updateOption('includeSubmissions', checked)}
                        icon={<FileJson className="w-4 h-4" />}
                    />
                </div>
            </div>

            {/* Export Button */}
            <div className="pt-2">
                <Button
                    onClick={() => exportMutation.mutate()}
                    disabled={exportMutation.isPending || !hasAnySelected}
                    className="gap-2"
                >
                    {exportMutation.isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Export to JSON
                        </>
                    )}
                </Button>
                {!hasAnySelected && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Select at least one category to export
                    </p>
                )}
            </div>

            {/* Modals */}
            <ItemSelectionModal
                isOpen={modals.coding}
                onClose={() => setModals(prev => ({ ...prev, coding: false }))}
                title="Select Coding Problems"
                selectedIds={options.problemIds || []}
                onSelectionChange={(ids) => updateOption('problemIds', ids)}
                queryKey={['problems']}
                queryFn={async ({ pageParam = 1 }) => {
                    const res = await problemsService.findAll({ limit: 100, page: pageParam });
                    // Robust unwrapping for NestJS wrapped responses (res.data) and paginated responses (res.items)
                    const payload = res.data || res;
                    const items = payload.problems || payload.items || payload;
                    return Array.isArray(items) ? items : [];
                }}
                limit={100}
                itemMapper={(p) => ({
                    id: p.id,
                    label: p.title,
                    description: `${p.difficulty} • ${p.type}`,
                    tags: p.tags,
                })}
            />

            <ItemSelectionModal
                isOpen={modals.systemDesign}
                onClose={() => setModals(prev => ({ ...prev, systemDesign: false }))}
                title="Select System Design Problems"
                selectedIds={options.systemDesignProblemIds || []}
                onSelectionChange={(ids) => updateOption('systemDesignProblemIds', ids)}
                queryKey={['systemDesign']}
                queryFn={async ({ pageParam = 1 }) => {
                    if (pageParam > 1) return [];
                    return systemDesignApi.getAllProblems();
                }}
                limit={1000} // Set high limit since it's not paginated
                itemMapper={(p) => ({
                    id: p.id,
                    label: p.title,
                    description: `${p.difficulty} • ${p.defaultDuration}min`,
                    tags: p.tags,
                })}
            />

            <ItemSelectionModal
                isOpen={modals.lists}
                onClose={() => setModals(prev => ({ ...prev, lists: false }))}
                title="Select Lists"
                selectedIds={options.listIds || []}
                onSelectionChange={(ids) => updateOption('listIds', ids)}
                queryKey={['lists']}
                queryFn={async ({ pageParam = 1 }) => {
                    const res = await listsService.findAll({ limit: 100, page: pageParam });
                    const payload = res.data || res;
                    const items = payload.items || payload;
                    return Array.isArray(items) ? items : [];
                }}
                limit={100}
                itemMapper={(l) => ({
                    id: l.id,
                    label: l.name,
                    description: l.description,
                })}
            />
        </div>
    );
}
