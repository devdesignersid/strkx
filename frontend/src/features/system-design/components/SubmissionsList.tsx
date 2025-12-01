import React from 'react';
import { CheckCircle2, Clock, FileText, Star } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface Submission {
    id: string;
    status: 'completed' | 'in_progress';
    submittedAt?: string;
    createdAt?: string;
    score?: number;
    feedback?: string;
    isSolution?: boolean;
    solutionName?: string;
}

interface SubmissionsListProps {
    submissions: Submission[];
    onSelectSubmission: (id: string) => void;
    onMarkAsSolution?: (id: string, currentStatus: boolean, currentName: string | null) => void;
}

export const SubmissionsList: React.FC<SubmissionsListProps> = ({
    submissions,
    onSelectSubmission,
    onMarkAsSolution,
}) => {
    if (submissions.length === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="No submissions yet"
                description="Submit your design to see your history here."
                className="py-12"
            />
        );
    }

    return (
        <div className="space-y-2">
            {submissions.map((submission) => {
                const dateStr = submission.submittedAt || submission.createdAt || '';
                let formattedDateTime = 'Recently';

                try {
                    if (dateStr) {
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                            formattedDateTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                        }
                    }
                } catch {
                    // Fallback to 'Recently'
                }

                return (
                    <div
                        key={submission.id}
                        onClick={() => onSelectSubmission(submission.id)}
                        className="p-3 rounded-md bg-card border border-border hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                {submission.status === 'completed' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                ) : (
                                    <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                                )}
                                <span className={`text-xs font-medium ${submission.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {submission.status === 'completed' ? 'Completed' : 'In Progress'}
                                </span>
                                {submission.isSolution && (
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                )}
                                {submission.isSolution && submission.solutionName && (
                                    <span className="text-xs text-amber-400 ml-1">• {submission.solutionName}</span>
                                )}
                            </div>
                            {onMarkAsSolution && submission.status === 'completed' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMarkAsSolution(submission.id, submission.isSolution || false, submission.solutionName || null);
                                    }}
                                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                                >
                                    {submission.isSolution ? 'Unmark' : 'Save as Solution'}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formattedDateTime}
                            </div>

                            {submission.score != null && (
                                <div className="flex items-center gap-1">
                                    <span className={submission.score >= 70 ? 'text-green-500' : 'text-yellow-500'}>
                                        {submission.score}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
