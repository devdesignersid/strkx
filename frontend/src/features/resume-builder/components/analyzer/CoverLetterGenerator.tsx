/**
 * Cover Letter Generator Panel
 * Generates personalized cover letters from resume + job description
 */

import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/design-system/components/Button';
import {
    X,
    FileEdit,
    Copy,
    Check,
    Loader2,
    AlertTriangle,
    Sparkles,
    Heart
} from 'lucide-react';
import type { CoverLetterResult } from '../../types/schema';
import { toast } from 'sonner';

interface CoverLetterGeneratorProps {
    result: CoverLetterResult | null;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onGenerate: (jobDescription: string) => void;
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

// Format full cover letter for copying
const formatFullCoverLetter = (cl: CoverLetterResult['coverLetter']): string => {
    return `${cl.greeting}

${cl.opening}

${cl.excitement}

${cl.connectionStory}

${cl.professionalAlignment}

${cl.closing}

${cl.signature}`;
};

export const CoverLetterGenerator = memo(({
    result,
    isLoading,
    error,
    onClose,
    onGenerate
}: CoverLetterGeneratorProps) => {
    const [jobDescription, setJobDescription] = useState('');

    const handleGenerate = () => {
        if (jobDescription.trim()) {
            onGenerate(jobDescription);
        }
    };

    const content = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Cover Letter Generator</h2>
                            <p className="text-sm text-muted-foreground">
                                {result ? 'Letter generated' : isLoading ? 'Generating...' : 'Paste job description to start'}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Job Description Input - always show unless loading/result */}
                    {!result && !isLoading && (
                        <div className="space-y-3">
                            <label className="block">
                                <span className="text-sm font-medium text-foreground">Job Description / Company Info</span>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Paste the job posting or describe the role and company
                                </p>
                            </label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here...

Include details like:
• Company name and mission
• Role requirements
• Key responsibilities
• What they're looking for"
                                className="w-full h-48 px-4 py-3 bg-muted/50 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                            <Button
                                onClick={handleGenerate}
                                disabled={!jobDescription.trim()}
                                className="w-full gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Cover Letter
                            </Button>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
                            <p className="text-sm text-muted-foreground">Crafting your connection story...</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">This may take a few seconds</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                            <p className="text-sm text-destructive font-medium">{error}</p>
                            <Button onClick={() => onGenerate(jobDescription)} variant="outline" size="sm" className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Results */}
                    {result && !isLoading && (
                        <div className="space-y-4">
                            {/* Copy All Button */}
                            <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                                <span className="text-sm font-medium text-foreground">Full Cover Letter</span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(formatFullCoverLetter(result.coverLetter));
                                        toast.success('Full cover letter copied!');
                                    }}
                                    className="gap-2"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy All
                                </Button>
                            </div>

                            {/* Cover Letter Preview */}
                            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                                {/* Greeting */}
                                <div className="flex items-start justify-between">
                                    <p className="text-foreground font-medium">{result.coverLetter.greeting}</p>
                                    <CopyButton text={result.coverLetter.greeting} label="Greeting" />
                                </div>

                                {/* Opening */}
                                <div className="border-l-2 border-rose-500/50 pl-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-rose-500 uppercase tracking-wide mb-1">Opening Hook</p>
                                            <p className="text-foreground/90 text-sm">{result.coverLetter.opening}</p>
                                        </div>
                                        <CopyButton text={result.coverLetter.opening} label="Opening" />
                                    </div>
                                </div>

                                {/* Excitement */}
                                <div className="border-l-2 border-amber-500/50 pl-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-amber-500 uppercase tracking-wide mb-1">What Excites You</p>
                                            <p className="text-foreground/90 text-sm">{result.coverLetter.excitement}</p>
                                        </div>
                                        <CopyButton text={result.coverLetter.excitement} label="Excitement" />
                                    </div>
                                </div>

                                {/* Connection Story */}
                                <div className="border-l-2 border-purple-500/50 pl-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-purple-500 uppercase tracking-wide mb-1">Your Connection Story</p>
                                            <p className="text-foreground/90 text-sm">{result.coverLetter.connectionStory}</p>
                                        </div>
                                        <CopyButton text={result.coverLetter.connectionStory} label="Connection story" />
                                    </div>
                                </div>

                                {/* Professional Alignment */}
                                <div className="border-l-2 border-blue-500/50 pl-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-blue-500 uppercase tracking-wide mb-1">Professional Alignment</p>
                                            <p className="text-foreground/90 text-sm">{result.coverLetter.professionalAlignment}</p>
                                        </div>
                                        <CopyButton text={result.coverLetter.professionalAlignment} label="Alignment" />
                                    </div>
                                </div>

                                {/* Closing */}
                                <div className="border-l-2 border-green-500/50 pl-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-green-500 uppercase tracking-wide mb-1">Closing</p>
                                            <p className="text-foreground/90 text-sm">{result.coverLetter.closing}</p>
                                        </div>
                                        <CopyButton text={result.coverLetter.closing} label="Closing" />
                                    </div>
                                </div>

                                {/* Signature */}
                                <div className="pt-2">
                                    <p className="text-foreground font-medium">{result.coverLetter.signature}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {result && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/30 shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setJobDescription('');
                            }}
                            className="gap-2 text-muted-foreground"
                        >
                            <FileEdit className="w-3.5 h-3.5" />
                            New Letter
                        </Button>
                        <Button
                            onClick={() => onGenerate(jobDescription)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
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

CoverLetterGenerator.displayName = 'CoverLetterGenerator';
