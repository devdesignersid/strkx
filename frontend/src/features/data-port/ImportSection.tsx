import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileJson, AlertCircle, CheckCircle2, Loader2, X, RefreshCw } from 'lucide-react';
import { Button } from '@/design-system/components';
import { dataPortService } from '@/services/api/data-port.service';
import type { ImportPreview, ImportResult, ImportOptions } from '@/services/api/data-port.service';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ImportState {
    file: File | null;
    preview: ImportPreview | null;
    result: ImportResult | null;
    rawData: unknown | null;
    isPreviewLoading: boolean;
    isImportLoading: boolean;
}

export function ImportSection() {
    const queryClient = useQueryClient();
    const [state, setState] = useState<ImportState>({
        file: null,
        preview: null,
        result: null,
        rawData: null,
        isPreviewLoading: false,
        isImportLoading: false,
    });

    const reset = useCallback(() => {
        setState({
            file: null,
            preview: null,
            result: null,
            rawData: null,
            isPreviewLoading: false,
            isImportLoading: false,
        });
    }, []);

    const handleFileSelect = useCallback(async (file: File) => {
        setState(prev => ({ ...prev, file, preview: null, result: null, isPreviewLoading: true }));

        try {
            // Read the file to get raw data for potential duplicate resolution
            const content = await file.text();
            const rawData = JSON.parse(content);

            const preview = await dataPortService.previewImport(file);
            setState(prev => ({ ...prev, preview, rawData, isPreviewLoading: false }));
        } catch (error: any) {
            toast.error('Failed to parse JSON file');
            setState(prev => ({ ...prev, isPreviewLoading: false }));
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/json') {
            handleFileSelect(file);
        } else {
            toast.error('Please drop a valid JSON file');
        }
    }, [handleFileSelect]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const importMutation = useMutation({
        mutationFn: (options: ImportOptions) =>
            dataPortService.importFromFile(state.file!, options),
        onSuccess: (result) => {
            setState(prev => ({ ...prev, result, isImportLoading: false }));

            if (result.success && result.duplicates.length === 0) {
                toast.success(`Successfully imported ${result.importedCount.codingProblems} coding problems, ${result.importedCount.systemDesignProblems} system design problems, and ${result.importedCount.lists} lists`);

                // Invalidate queries to refresh data
                queryClient.invalidateQueries({ queryKey: ['problems'] });
                queryClient.invalidateQueries({ queryKey: ['systemDesign'] });
                queryClient.invalidateQueries({ queryKey: ['lists'] });
            } else if (result.duplicates.length > 0) {
                toast.info('Some items already exist. Choose how to handle them below.');
            } else if (result.errors.length > 0) {
                toast.warning(`Import completed with ${result.errors.length} errors`);
            }
        },
        onError: (error: any) => {
            setState(prev => ({ ...prev, isImportLoading: false }));
            toast.error(error?.response?.data?.message || 'Failed to import data');
        },
    });

    const resolveDuplicatesMutation = useMutation({
        mutationFn: (action: 'skip' | 'overwrite') => {
            const resolutions = state.result!.duplicates.map(dup => ({
                itemType: dup.itemType,
                slug: dup.incomingSlug,
                action,
            }));
            return dataPortService.resolveImportDuplicates(state.rawData, resolutions);
        },
        onSuccess: (result) => {
            setState(prev => ({ ...prev, result }));

            if (result.success) {
                toast.success('Import completed successfully!');
                queryClient.invalidateQueries({ queryKey: ['problems'] });
                queryClient.invalidateQueries({ queryKey: ['systemDesign'] });
                queryClient.invalidateQueries({ queryKey: ['lists'] });
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to resolve duplicates');
        },
    });

    const handleImport = () => {
        setState(prev => ({ ...prev, isImportLoading: true }));
        importMutation.mutate({ duplicateMode: 'ask' });
    };

    return (
        <div className="space-y-5">
            {/* File Drop Zone */}
            {!state.file && (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                        "hover:border-primary/50 hover:bg-primary/5",
                        "border-border bg-secondary/20"
                    )}
                >
                    <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleInputChange}
                        className="hidden"
                        id="import-file-input"
                    />
                    <label
                        htmlFor="import-file-input"
                        className="cursor-pointer flex flex-col items-center gap-3"
                    >
                        <div className="p-3 rounded-full bg-primary/10">
                            <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">
                                Drop a JSON file here or <span className="text-primary">browse</span>
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Supports exports from this application
                            </p>
                        </div>
                    </label>
                </div>
            )}

            {/* File Selected - Show Preview/Loading */}
            <AnimatePresence mode="wait">
                {state.file && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* File Info */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                            <div className="flex items-center gap-3">
                                <FileJson className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="font-medium text-foreground text-sm">{state.file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(state.file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={reset}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Loading Preview */}
                        {state.isPreviewLoading && (
                            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Analyzing file...</span>
                            </div>
                        )}

                        {/* Preview Results */}
                        {state.preview && !state.result && (
                            <PreviewCard
                                preview={state.preview}
                                onImport={handleImport}
                                isImporting={state.isImportLoading || importMutation.isPending}
                            />
                        )}

                        {/* Import Results */}
                        {state.result && (
                            <ResultCard
                                result={state.result}
                                onResolveDuplicates={(action) => resolveDuplicatesMutation.mutate(action)}
                                isResolving={resolveDuplicatesMutation.isPending}
                                onReset={reset}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PreviewCard({
    preview,
    onImport,
    isImporting
}: {
    preview: ImportPreview;
    onImport: () => void;
    isImporting: boolean;
}) {
    const { counts, isValid, errors, warnings, version } = preview;

    // Debug logging
    console.log('Preview Data in Card:', preview);

    const codingProblemsCount = counts?.codingProblems || 0;
    const systemDesignProblemsCount = counts?.systemDesignProblems || 0;
    const listsCount = counts?.lists || 0;

    const totalItems = codingProblemsCount + systemDesignProblemsCount + listsCount;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <StatCard label="Coding Problems" value={codingProblemsCount} />
                <StatCard label="System Design" value={systemDesignProblemsCount} />
                <StatCard label="Lists" value={listsCount} />
            </div>

            {/* Warnings */}
            {warnings?.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            {warnings.map((warning, i) => (
                                <p key={i} className="text-yellow-700 dark:text-yellow-300">{warning}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Validation Errors */}
            {!isValid && errors?.length > 0 && (
                <ErrorDisplay errors={errors.slice(0, 5)} totalErrors={errors.length} />
            )}

            {/* Version Info */}
            <p className="text-xs text-muted-foreground">
                Export version: {version}
            </p>

            {/* Import Button */}
            <Button
                onClick={onImport}
                disabled={!isValid || totalItems === 0 || isImporting}
                className="w-full gap-2"
            >
                {isImporting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                    </>
                ) : (
                    <>
                        <Upload className="w-4 h-4" />
                        Import {totalItems} items
                    </>
                )}
            </Button>
        </div>
    );
}

function ResultCard({
    result,
    onResolveDuplicates,
    isResolving,
    onReset,
}: {
    result: ImportResult;
    onResolveDuplicates: (action: 'skip' | 'overwrite') => void;
    isResolving: boolean;
    onReset: () => void;
}) {
    const { importedCount, skippedCount, overwrittenCount, errors, duplicates, success } = result;
    const totalImported = importedCount.codingProblems + importedCount.systemDesignProblems + importedCount.lists;

    // Show duplicate resolution UI
    if (duplicates.length > 0) {
        return (
            <div className="space-y-4">
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="font-medium text-foreground">
                                {duplicates.length} duplicate{duplicates.length > 1 ? 's' : ''} found
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                The following items already exist in your account:
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                        {duplicates.map((dup, i) => (
                            <div key={i} className="text-sm p-2 rounded bg-background/50 flex items-center gap-2">
                                <span className="text-muted-foreground capitalize">{dup.itemType.replace('Problem', '')}:</span>
                                <span className="font-medium text-foreground">{dup.incomingTitle}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => onResolveDuplicates('skip')}
                        disabled={isResolving}
                        className="flex-1 gap-2"
                    >
                        {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Skip Duplicates
                    </Button>
                    <Button
                        onClick={() => onResolveDuplicates('overwrite')}
                        disabled={isResolving}
                        className="flex-1 gap-2"
                    >
                        {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Overwrite All
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Success/Error Banner */}
            <div className={cn(
                "p-4 rounded-lg border flex items-start gap-3",
                success
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
            )}>
                {success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                    <h4 className={cn(
                        "font-medium",
                        success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                    )}>
                        {success ? 'Import Successful!' : 'Import Completed with Errors'}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        Imported: {totalImported} items
                        {skippedCount > 0 && ` • Skipped: ${skippedCount}`}
                        {overwrittenCount > 0 && ` • Overwritten: ${overwrittenCount}`}
                    </p>
                </div>
            </div>

            {/* Detailed Counts */}
            <div className="grid grid-cols-3 gap-3">
                <StatCard label="Coding Problems" value={importedCount.codingProblems} />
                <StatCard label="System Design" value={importedCount.systemDesignProblems} />
                <StatCard label="Lists" value={importedCount.lists} />
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <ErrorDisplay errors={errors.slice(0, 5)} totalErrors={errors.length} />
            )}

            {/* Reset Button */}
            <Button variant="secondary" onClick={onReset} className="w-full">
                Import Another File
            </Button>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function ErrorDisplay({
    errors,
    totalErrors
}: {
    errors: Array<{ message: string; field: string; path: string[] }>;
    totalErrors: number;
}) {
    return (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="font-medium text-red-700 dark:text-red-300 text-sm">
                    {totalErrors} validation error{totalErrors > 1 ? 's' : ''}
                </span>
            </div>
            <div className="space-y-1 text-sm">
                {errors.map((error, i) => (
                    <div key={i} className="text-red-600 dark:text-red-400">
                        <span className="font-mono text-xs bg-red-500/20 px-1 rounded">
                            {error.path.join(' → ')}
                        </span>
                        <span className="ml-2">{error.message}</span>
                    </div>
                ))}
                {totalErrors > 5 && (
                    <p className="text-muted-foreground">
                        ...and {totalErrors - 5} more errors
                    </p>
                )}
            </div>
        </div>
    );
}
