import { BrainCircuit, Loader2, CheckCircle2, AlertTriangle, TrendingUp, Shield, Eye } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import { exportToBlob } from '@excalidraw/excalidraw';

interface AiAnalysis {
    score: number;
    scalability?: string;
    reliability?: string;
    bottlenecks?: string;
    completeness?: string;
    feedback?: string;
    suggestions?: string[];
    snapshot?: {
        elements: any[];
        appState: any;
    };
}

interface AiAnalysisPanelProps {
    analysis: AiAnalysis | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
}

export const AiAnalysisPanel: React.FC<AiAnalysisPanelProps> = ({
    analysis,
    isAnalyzing,
    onAnalyze,
}) => {
    const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

    useEffect(() => {
        const generateSnapshot = async () => {
            if (analysis?.snapshot && analysis.snapshot.elements.length > 0) {
                try {
                    const blob = await exportToBlob({
                        elements: analysis.snapshot.elements,
                        appState: {
                            ...analysis.snapshot.appState,
                            exportWithDarkMode: true,
                            exportBackground: false, // Transparent background
                        },
                        files: null,
                        mimeType: 'image/png',
                        quality: 0.8,
                        exportPadding: 20,
                    });
                    const url = URL.createObjectURL(blob);
                    setSnapshotUrl(url);
                } catch (error) {
                    console.error('Failed to generate snapshot:', error);
                }
            } else {
                setSnapshotUrl(null);
            }
        };

        generateSnapshot();

        return () => {
            if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
        };
    }, [analysis]);

    if (!analysis && !isAnalyzing) {
        return (
            <EmptyState
                icon={BrainCircuit}
                title="AI Design Analysis"
                description="Get detailed feedback on your system design, scalability, and architectural choices."
                action={{
                    label: "Analyze My Design",
                    onClick: onAnalyze
                }}
                className="py-12"
            />
        );
    }

    if (isAnalyzing) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                <p className="text-muted-foreground">Analyzing your design...</p>
            </div>
        );
    }

    if (!analysis) return null;

    return (
        <div className="space-y-6">
            {/* Header with Re-analyze button */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Analysis Results</h3>
                <button
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                    {isAnalyzing ? 'Analyzing...' : 'Re-analyze Design'}
                </button>
            </div>

            {/* Snapshot Preview */}
            {snapshotUrl && (
                <div className="rounded-lg overflow-hidden border border-border bg-[#1e1e1e] p-2">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Analyzed Snapshot</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/50">
                            {analysis.snapshot?.elements.length || 0} elements
                        </span>
                    </div>
                    <div className="w-full h-[300px] flex items-center justify-center overflow-hidden bg-[#1e1e1e]">
                        <img
                            src={snapshotUrl}
                            alt="System Design Snapshot"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
            )}

            {/* Score Card */}
            <div className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Design Quality Score</h4>
                    <span className="text-lg font-bold text-foreground">{analysis.score}/100</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-1000 ease-out"
                        style={{ width: `${analysis.score}%` }}
                    />
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.scalability && (
                    <div className="p-4 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <h4 className="text-xs font-medium text-muted-foreground">Scalability</h4>
                        </div>
                        <p className="text-sm text-foreground">{analysis.scalability}</p>
                    </div>
                )}
                {analysis.reliability && (
                    <div className="p-4 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-green-400" />
                            <h4 className="text-xs font-medium text-muted-foreground">Reliability</h4>
                        </div>
                        <p className="text-sm text-foreground">{analysis.reliability}</p>
                    </div>
                )}
                {analysis.bottlenecks && (
                    <div className="p-4 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <h4 className="text-xs font-medium text-muted-foreground">Bottlenecks</h4>
                        </div>
                        <p className="text-sm text-foreground">{analysis.bottlenecks}</p>
                    </div>
                )}
                {analysis.completeness && (
                    <div className="p-4 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-purple-400" />
                            <h4 className="text-xs font-medium text-muted-foreground">Completeness</h4>
                        </div>
                        <p className="text-sm text-foreground">{analysis.completeness}</p>
                    </div>
                )}
            </div>

            {/* Detailed Feedback */}
            {analysis.feedback && (
                <div className="p-4 rounded-lg bg-card border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3">Detailed Feedback</h4>
                    <div className="prose prose-invert prose-sm max-w-none prose-p:text-muted-foreground prose-headings:text-foreground/90">
                        <ReactMarkdown>{analysis.feedback.replace(/\\n/g, '\n')}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Suggestions for Improvement</h4>
                    <ul className="space-y-2">
                        {analysis.suggestions.map((suggestion: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
