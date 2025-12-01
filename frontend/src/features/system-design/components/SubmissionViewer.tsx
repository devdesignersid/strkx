import React from 'react';
import { ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface Submission {
    id: string;
    status: 'completed' | 'in_progress';
    submittedAt?: string;
    createdAt?: string;
    score?: number;
    feedback?: string;
    diagramSnapshot?: string; // URL or base64
    notes?: string;
}

interface SubmissionViewerProps {
    submission: Submission;
    onBack: () => void;
}

export const SubmissionViewer: React.FC<SubmissionViewerProps> = ({
    submission,
    onBack,
}) => {
    // Safe date parsing
    let formattedDate = 'Recently';
    let formattedTime = 'Recently';

    try {
        const dateStr = submission.submittedAt || submission.createdAt || '';
        if (dateStr) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString();
                formattedTime = date.toLocaleTimeString();
            }
        }
    } catch {
        // Use default fallback
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="p-1 hover:bg-accent rounded-md transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-lg">Submission Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                    <div className="flex items-center gap-2 font-medium capitalize">
                        {submission.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                            <XCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        {submission.status.replace('_', ' ')}
                    </div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="text-sm text-muted-foreground mb-1">Submitted</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formattedDate} at {formattedTime}</span>
                        </div>
                    </div>
                </div>
            </div>

            {submission.score !== undefined && (
                <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="text-sm text-muted-foreground mb-2">AI Score</div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-primary">{submission.score}</span>
                        <span className="text-muted-foreground mb-1">/ 100</span>
                    </div>
                    {submission.feedback && (
                        <div className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
                            {submission.feedback}
                        </div>
                    )}
                </div>
            )}

            {/* Placeholder for snapshot review */}
            <div className="space-y-2">
                <h4 className="font-medium text-sm">Diagram Snapshot</h4>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border">
                    <p className="text-muted-foreground text-sm">Snapshot Preview</p>
                </div>
            </div>
        </div>
    );
};
