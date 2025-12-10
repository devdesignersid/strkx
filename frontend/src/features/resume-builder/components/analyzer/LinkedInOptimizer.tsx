/**
 * LinkedIn Profile Optimizer Panel
 * Displays AI-generated optimized LinkedIn content with copy functionality
 */

import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/design-system/components/Button';
import {
    X,
    Linkedin,
    Copy,
    Check,
    Loader2,
    AlertTriangle,
    Briefcase,
    User,
    Sparkles
} from 'lucide-react';
import type { LinkedInProfileResult } from '../../types/schema';
import { toast } from 'sonner';

interface LinkedInOptimizerProps {
    result: LinkedInProfileResult | null;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onOptimize: () => void;
}

// Copy button with feedback
const CopyButton = memo(({ text, label }: { text: string; label: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`${label} copied to clipboard`);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
    );
});
CopyButton.displayName = 'CopyButton';

// Section Card
const SectionCard = memo(({
    title,
    icon: Icon,
    children,
    copyText,
    copyLabel
}: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    copyText?: string;
    copyLabel?: string;
}) => (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            </div>
            {copyText && copyLabel && <CopyButton text={copyText} label={copyLabel} />}
        </div>
        <div className="p-4">{children}</div>
    </div>
));
SectionCard.displayName = 'SectionCard';

// Work History Item
const WorkHistoryItem = memo(({ job }: { job: LinkedInProfileResult['workHistory'][0] }) => {
    const fullText = `${job.jobTitle}\n${job.company}\n${job.location}\n${job.dates}\n\n${job.bullets.map(b => `• ${b}`).join('\n')}`;

    return (
        <div className="border border-border rounded-lg p-4 bg-muted/20">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <p className="font-semibold text-foreground">{job.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                    <p className="text-xs text-muted-foreground">{job.location} • {job.dates}</p>
                </div>
                <CopyButton text={fullText} label="Job entry" />
            </div>
            <ul className="mt-3 space-y-1.5">
                {job.bullets.map((bullet, idx) => (
                    <li key={idx} className="text-sm text-foreground/90 flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{bullet}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
});
WorkHistoryItem.displayName = 'WorkHistoryItem';

export const LinkedInOptimizer = memo(({
    result,
    isLoading,
    error,
    onClose,
    onOptimize
}: LinkedInOptimizerProps) => {
    const content = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
                            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">LinkedIn Optimizer</h2>
                            <p className="text-sm text-muted-foreground">
                                {result ? 'Profile generated' : isLoading ? 'Generating...' : 'Ready to optimize'}
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
                            <Loader2 className="w-10 h-10 text-[#0A66C2] animate-spin mb-4" />
                            <p className="text-sm text-muted-foreground">Optimizing your LinkedIn profile...</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">This may take a few seconds</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                            <p className="text-sm text-destructive font-medium">{error}</p>
                            <Button onClick={onOptimize} variant="outline" size="sm" className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!result && !isLoading && !error && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-[#0A66C2]/10 flex items-center justify-center mx-auto mb-4">
                                <Linkedin className="w-8 h-8 text-[#0A66C2]" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Optimize for LinkedIn</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                                Generate a recruiter-optimized LinkedIn headline, about section, and work history from your resume.
                            </p>
                            <Button onClick={onOptimize} className="gap-2 bg-[#0A66C2] hover:bg-[#004182]">
                                <Sparkles className="w-4 h-4" />
                                Generate LinkedIn Profile
                            </Button>
                        </div>
                    )}

                    {/* Results */}
                    {result && !isLoading && (
                        <div className="space-y-4">
                            {/* Headline */}
                            <SectionCard
                                title="Headline"
                                icon={Sparkles}
                                copyText={result.headline}
                                copyLabel="Headline"
                            >
                                <p className="text-foreground font-medium">{result.headline}</p>
                            </SectionCard>

                            {/* About */}
                            <SectionCard
                                title="About"
                                icon={User}
                                copyText={`${result.about.summary}\n\nSkills: ${result.about.skills.join(' • ')}`}
                                copyLabel="About section"
                            >
                                <p className="text-foreground/90 text-sm mb-4">{result.about.summary}</p>
                                <div className="pt-3 border-t border-border">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.about.skills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Work History */}
                            {result.workHistory.length > 0 && (
                                <SectionCard title="Work History" icon={Briefcase}>
                                    <div className="space-y-3">
                                        {result.workHistory.map((job, idx) => (
                                            <WorkHistoryItem key={idx} job={job} />
                                        ))}
                                    </div>
                                </SectionCard>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {result && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/30 shrink-0">
                        <p className="text-xs text-muted-foreground">
                            Click the copy icons to copy sections to clipboard
                        </p>
                        <Button onClick={onOptimize} variant="outline" size="sm" className="gap-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            Regenerate
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
});

LinkedInOptimizer.displayName = 'LinkedInOptimizer';
