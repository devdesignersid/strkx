/**
 * AI Resume Analyzer Panel
 * Displays AI-powered resume analysis with findings and recommendations
 */

import { memo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/design-system/components/Button';
import {
    X,
    AlertTriangle,
    CheckCircle2,
    FileText,
    Palette,
    Shield,
    Lightbulb,
    Loader2
} from 'lucide-react';
import type { ResumeAnalysisResult } from '../../types/schema';

interface ResumeAnalyzerProps {
    result: ResumeAnalysisResult | null;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onAnalyze: () => void;
}

// Finding Card Component
const FindingCard = memo(({
    title,
    icon: Icon,
    findings,
    improvements,
    accentColor
}: {
    title: string;
    icon: React.ElementType;
    findings: string[];
    improvements: string[];
    accentColor: string;
}) => (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className={`flex items-center gap-2 px-4 py-3 border-b border-border ${accentColor}`}>
            <Icon className="w-4 h-4" />
            <h3 className="font-semibold text-sm">{title}</h3>
            <span className="ml-auto text-xs opacity-70">
                {findings.length} finding{findings.length !== 1 ? 's' : ''}
            </span>
        </div>
        <div className="p-4 space-y-4">
            {/* Findings */}
            {findings.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Issues Found</p>
                    <ul className="space-y-2">
                        {findings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-foreground/90">{finding}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Improvements */}
            {improvements.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recommendations</p>
                    <ul className="space-y-2">
                        {improvements.map((imp, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                                <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                <span className="text-foreground/90">{imp}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {findings.length === 0 && improvements.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>No issues found</span>
                </div>
            )}
        </div>
    </div>
));
FindingCard.displayName = 'FindingCard';

// Priority Issues Section
const PriorityIssues = memo(({ issues }: { issues: string[] }) => {
    if (issues.length === 0) return null;

    return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-foreground">Priority Issues</h3>
            </div>
            <ul className="space-y-2">
                {issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                        </span>
                        <span className="text-foreground/90">{issue}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
});
PriorityIssues.displayName = 'PriorityIssues';

export const ResumeAnalyzer = memo(({
    result,
    isLoading,
    error,
    onClose,
    onAnalyze
}: ResumeAnalyzerProps) => {
    const content = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">AI Resume Analyzer</h2>
                            <p className="text-sm text-muted-foreground">
                                {result ? 'Analysis complete' : isLoading ? 'Analyzing...' : 'Ready to analyze'}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                            <p className="text-sm text-muted-foreground">Analyzing your resume...</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">This may take a few seconds</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                            <p className="text-sm text-destructive font-medium">{error}</p>
                            <Button onClick={onAnalyze} variant="outline" size="sm" className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!result && !isLoading && !error && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Ready to Analyze</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                                Get AI-powered insights on your resume content, design, and ATS compatibility.
                            </p>
                            <Button onClick={onAnalyze} className="gap-2">
                                <Shield className="w-4 h-4" />
                                Analyze Resume
                            </Button>
                        </div>
                    )}

                    {/* Results */}
                    {result && !isLoading && (
                        <div className="space-y-4">
                            {/* Priority Issues */}
                            <PriorityIssues issues={result.priorityIssues} />

                            {/* Finding Cards */}
                            <FindingCard
                                title="Content Analysis"
                                icon={FileText}
                                findings={result.contentFindings}
                                improvements={result.recommendedImprovements.content}
                                accentColor="bg-blue-500/10 text-blue-600"
                            />

                            <FindingCard
                                title="Design & Layout"
                                icon={Palette}
                                findings={result.designFindings}
                                improvements={result.recommendedImprovements.design}
                                accentColor="bg-purple-500/10 text-purple-600"
                            />

                            <FindingCard
                                title="ATS Compatibility"
                                icon={Shield}
                                findings={result.atsFindings}
                                improvements={result.recommendedImprovements.ats}
                                accentColor="bg-green-500/10 text-green-600"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {result && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/30 shrink-0">
                        <p className="text-xs text-muted-foreground">
                            Analysis based on resume best practices and ATS guidelines
                        </p>
                        <Button onClick={onAnalyze} variant="outline" size="sm" className="gap-2">
                            <Shield className="w-3.5 h-3.5" />
                            Re-analyze
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
});

ResumeAnalyzer.displayName = 'ResumeAnalyzer';
