import { Plus, Trash2, ChevronDown } from 'lucide-react';

interface InputSignatureEditorProps {
    inputTypes: string[];
    returnType: string;
    onChange: (inputTypes: string[], returnType: string) => void;
}

const AVAILABLE_TYPES = [
    { label: 'Number', value: 'number' },
    { label: 'String', value: 'string' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Number Array', value: 'number[]' },
    { label: 'String Array', value: 'string[]' },
    { label: 'ListNode', value: 'ListNode' },
    { label: 'TreeNode', value: 'TreeNode' },
    { label: 'ListNode[]', value: 'ListNode[]' },
    { label: 'TreeNode[]', value: 'TreeNode[]' },
    { label: 'GraphNode', value: 'GraphNode' },
    { label: 'RandomListNode', value: 'RandomListNode' },
];

export function InputSignatureEditor({ inputTypes, returnType, onChange }: InputSignatureEditorProps) {
    const addInput = () => {
        onChange([...inputTypes, 'number'], returnType);
    };

    const removeInput = (index: number) => {
        const newTypes = [...inputTypes];
        newTypes.splice(index, 1);
        onChange(newTypes, returnType);
    };

    const updateInput = (index: number, value: string) => {
        const newTypes = [...inputTypes];
        newTypes[index] = value;
        onChange(newTypes, returnType);
    };

    return (
        <div className="space-y-4 bg-secondary/20 border border-white/5 rounded-md p-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Function Signature</label>
                <button
                    onClick={addInput}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Argument
                </button>
            </div>

            <div className="space-y-2">
                {inputTypes.map((type, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Arg {i + 1}:</span>
                        <div className="relative flex-1">
                            <select
                                value={type}
                                onChange={(e) => updateInput(i, e.target.value)}
                                className="w-full appearance-none bg-black/20 border border-white/5 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            >
                                {AVAILABLE_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <button
                            onClick={() => removeInput(i)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="pt-2 border-t border-white/5 mt-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">Returns:</span>
                    <div className="relative flex-1">
                        <select
                            value={returnType || 'void'}
                            onChange={(e) => onChange(inputTypes, e.target.value)}
                            className="w-full appearance-none bg-black/20 border border-white/5 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                        >
                            <option value="void">Void</option>
                            {AVAILABLE_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {/* Spacer to align with delete button */}
                    <div className="w-7" />
                </div>
            </div>
        </div>
    );
}
