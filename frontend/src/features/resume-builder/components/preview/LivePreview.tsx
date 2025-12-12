import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { useMemo, memo } from 'react';
import { useDraft } from '../../hooks/useResumeStore';
import { usePDFFonts } from '../../hooks/usePDFFonts';
import { ResumeDocument } from './ResumeDocument';
import { LoadingThunder } from '@/design-system/components';
import { Button } from '@/design-system/components/Button';
import { RefreshCw, AlertTriangle, FileText, Download } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { ResumeData, ResumeExperience, ResumeEducation, SkillCategory } from '../../types/schema';

// Memoize the PDF document to prevent unnecessary re-renders
const MemoizedResumeDocument = memo(ResumeDocument);

// Check if resume has minimal content to render a meaningful preview
const hasMinimalContent = (draft: ResumeData): boolean => {
    const { content } = draft;
    const hasProfile = Boolean(content.profile.name?.trim() || content.profile.email?.trim());
    const hasSummary = Boolean(content.summary?.trim());
    const hasExperience = content.experience?.length > 0 && content.experience.some((e: ResumeExperience) => e.company || e.position);
    const hasEducation = content.education?.length > 0 && content.education.some((e: ResumeEducation) => e.institution || e.degree);
    const hasSkills = content.skillCategories?.length > 0 && content.skillCategories.some((c: SkillCategory) => c.skills.length > 0);

    return hasProfile || hasSummary || hasExperience || hasEducation || hasSkills;
};

// Generate filename: "Firstname_Lastname_resume.pdf" or "resume.pdf" if no name
const generateFileName = (name: string): string => {
    if (!name?.trim()) return 'resume.pdf';
    return `${name.trim().replace(/\s+/g, '_')}_resume.pdf`;
};

export const LivePreview = () => {
    // Use granular selector
    const draft = useDraft();
    const debouncedData = useDebounce(draft, 1200); // 1.2s debounce for smoother typing

    // Check if we're currently debouncing (stale data)
    const isStale = draft !== debouncedData;

    // Check if resume is effectively empty
    const isEmpty = !hasMinimalContent(debouncedData);

    // Register both body and heading fonts
    const { isLoaded: bodyLoaded, error: bodyError, retry: retryBody } = usePDFFonts(debouncedData.design.fontBody);
    const { isLoaded: headingLoaded, error: headingError, retry: retryHeading } = usePDFFonts(debouncedData.design.fontHeading);

    const isLoaded = bodyLoaded && headingLoaded;
    const error = bodyError || headingError;

    // Memoize dataKey to prevent string creation on every render
    const dataKey = useMemo(() => JSON.stringify(debouncedData), [debouncedData]);

    // Generate filename from profile name
    const fileName = useMemo(() => generateFileName(debouncedData.content.profile.name), [debouncedData.content.profile.name]);

    const handleRetry = () => {
        if (bodyError) retryBody?.();
        if (headingError) retryHeading?.();
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full p-8">
                <div className="bg-card border border-destructive/20 rounded-xl p-8 max-w-md text-center shadow-lg">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <p className="font-semibold text-foreground mb-2">Failed to load fonts</p>
                    <p className="text-sm text-muted-foreground mb-6">
                        Please check your internet connection or try a different font.
                    </p>
                    <Button onClick={handleRetry} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full">
                <LoadingThunder size="lg" className="text-primary mb-4" />
                <p className="text-muted-foreground text-sm font-medium animate-pulse">Preparing Resume Preview...</p>
            </div>
        );
    }

    // Empty state - show prompt to add content
    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full p-8">
                <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center shadow-lg">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground text-lg mb-2">Start Building Your Resume</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        Add your profile, experience, and skills using the Content tab to see your resume come to life.
                    </p>
                    <div className="text-xs text-muted-foreground/70 bg-muted/50 rounded-lg p-3">
                        💡 <span className="font-medium">Tip:</span> Start with your name and a brief professional summary.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center relative">
            {/* Stale indicator */}
            {isStale && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-muted/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-muted-foreground">Updating...</span>
                </div>
            )}

            {/* Custom Download Button - uses proper filename */}
            <div className="absolute top-4 left-4 z-10">
                <PDFDownloadLink
                    key={dataKey} // Force remount on data change to prevent reconciler crash
                    document={<MemoizedResumeDocument data={debouncedData} />}
                    fileName={fileName}
                >
                    {({ loading }) => (
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={loading}
                            className="gap-2 shadow-md bg-card hover:bg-muted"
                        >
                            <Download className="w-4 h-4" />
                            {loading ? 'Preparing...' : 'Download PDF'}
                        </Button>
                    )}
                </PDFDownloadLink>
            </div>

            <PDFViewer
                key={dataKey}
                className="w-full h-full shadow-2xl rounded-sm border border-border/50"
                showToolbar={false}
                style={{ borderRadius: '8px' }}
            >
                <MemoizedResumeDocument data={debouncedData} />
            </PDFViewer>
        </div>
    );
};
