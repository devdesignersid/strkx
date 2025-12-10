/**
 * Version History Panel
 * Modal showing all saved versions with restore functionality
 */

import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/design-system/components/Button';
import {
    X,
    History,
    RotateCcw,
    Loader2,
    Clock,
    CheckCircle2,
    Trash2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { ResumeVersionSummary } from '@/services/api/resume.service';

interface VersionHistoryPanelProps {
    versions: ResumeVersionSummary[];
    isLoading: boolean;
    isRestoring: boolean;
    isDeleting: boolean;
    currentVersionNumber: number;
    onClose: () => void;
    onRestore: (versionNumber: number) => Promise<boolean>;
    onDelete: () => Promise<boolean>;
}

const VersionItem = memo(({
    version,
    isCurrent,
    isLatest,
    isRestoring,
    isDeleting,
    onRestore,
    onDelete
}: {
    version: ResumeVersionSummary;
    isCurrent: boolean;
    isLatest: boolean;
    isRestoring: boolean;
    isDeleting: boolean;
    onRestore: (versionNumber: number) => Promise<boolean>;
    onDelete: () => Promise<boolean>;
}) => {
    const [restoring, setRestoring] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleRestore = async () => {
        setRestoring(true);
        await onRestore(version.versionNumber);
        setRestoring(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        await onDelete();
        setDeleting(false);
    };

    return (
        <div className={`flex items-center justify-between p-4 rounded-lg border ${isCurrent
            ? 'border-primary/30 bg-primary/5'
            : 'border-border bg-card hover:bg-muted/50'
            } transition-colors`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCurrent ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                    {isCurrent ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                            Version {version.versionNumber}
                        </span>
                        {isCurrent && (
                            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                Current
                            </span>
                        )}
                        {isLatest && (
                            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                Latest
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                        {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {!isCurrent && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestore}
                        disabled={isRestoring || restoring || isDeleting}
                        className="gap-2"
                    >
                        {restoring ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        Restore
                    </Button>
                )}
                {isLatest && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting || deleting || isRestoring}
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        {deleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Delete
                    </Button>
                )}
            </div>
        </div>
    );
});
VersionItem.displayName = 'VersionItem';

export const VersionHistoryPanel = memo(({
    versions,
    isLoading,
    isRestoring,
    isDeleting,
    currentVersionNumber,
    onClose,
    onRestore,
    onDelete,
}: VersionHistoryPanelProps) => {
    const latestVersionNumber = versions.length > 0 ? versions[0].versionNumber : 0;

    const content = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <History className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Version History</h2>
                            <p className="text-sm text-muted-foreground">
                                {versions.length} saved {versions.length === 1 ? 'version' : 'versions'}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                            <p className="text-sm text-muted-foreground">Loading versions...</p>
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                <History className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-foreground mb-2">No versions saved</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                Click "Save" in the header to create your first version.
                            </p>
                        </div>
                    ) : (
                        versions.map((version) => (
                            <VersionItem
                                key={version.id}
                                version={version}
                                isCurrent={version.versionNumber === currentVersionNumber}
                                isLatest={version.versionNumber === latestVersionNumber}
                                isRestoring={isRestoring}
                                isDeleting={isDeleting}
                                onRestore={onRestore}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border bg-muted/30 text-center shrink-0">
                    <p className="text-xs text-muted-foreground">
                        Only the latest version can be deleted (stack behavior).
                    </p>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
});

VersionHistoryPanel.displayName = 'VersionHistoryPanel';

