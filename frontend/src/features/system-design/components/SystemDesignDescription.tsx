import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { motion } from 'framer-motion';
import { PanelLeftClose, Star, Clock, PanelBottomOpen } from 'lucide-react';
import type { SystemDesignProblem } from '@/types/system-design';
import { fadeIn } from '@/components/ui/DesignSystem';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

import { SubmissionsList } from './SubmissionsList';
import { AiAnalysisPanel } from './AiAnalysisPanel';

interface SystemDesignDescriptionProps {
    problem: SystemDesignProblem;
    submissions: any[];
    solutions: any[];
    aiAnalysis: any;
    isAIEnabled: boolean;
    isAnalyzing: boolean;
    onAnalyze: () => void;
    onLoadSubmission: (submission: any) => void;
    onMarkAsSolution?: (id: string, currentStatus: boolean, currentName: string | null) => void;
    onCollapse: () => void;
    isNotesCollapsed?: boolean;
    onToggleNotes?: () => void;
}

export function SystemDesignDescription({
    problem,
    submissions,
    aiAnalysis,
    isAIEnabled,
    isAnalyzing,
    onAnalyze,
    onLoadSubmission,
    onMarkAsSolution,
    onCollapse,
    isNotesCollapsed,
    onToggleNotes,
}: SystemDesignDescriptionProps) {
    return (
        <div className="flex flex-col h-full bg-card">
            <Tabs defaultValue="description" className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-white/5 px-2 pt-2 shrink-0">
                    <div className="flex items-center overflow-x-auto no-scrollbar">
                        <TabsList className="bg-transparent p-0 h-auto gap-1">
                            <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2">
                                Description
                            </TabsTrigger>
                            <TabsTrigger value="submissions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2">
                                Submissions
                            </TabsTrigger>
                            <TabsTrigger value="solutions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2">
                                Solutions
                            </TabsTrigger>
                            {isAIEnabled && (
                                <TabsTrigger value="ai_analysis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2">
                                    AI Analysis
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        {isNotesCollapsed && onToggleNotes && (
                            <button
                                onClick={onToggleNotes}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
                                title="Expand Notes"
                            >
                                <PanelBottomOpen className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={onCollapse}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
                            title="Collapse Description"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 prose-headings:text-foreground/90 prose-p:text-muted-foreground prose-a:text-primary prose-code:text-primary/90 prose-code:text-[13px] prose-code:font-medium">
                    <TabsContent value="description" className="mt-0">
                        <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{problem.description || 'No description available.'}</ReactMarkdown>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="submissions" className="mt-0">
                        <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-2 -m-6 p-4">
                            <SubmissionsList
                                submissions={submissions}
                                onSelectSubmission={(id) => {
                                    const submission = submissions.find(s => s.id === id);
                                    if (submission) {
                                        onLoadSubmission(submission);
                                    }
                                }}
                                onMarkAsSolution={onMarkAsSolution}
                            />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="solutions" className="mt-0">
                        <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-2 -m-6 p-4">
                            {submissions.filter(s => s.isSolution).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Star className="w-12 h-12 text-amber-400/20 mb-3" />
                                    <h3 className="text-sm font-medium text-foreground mb-1">No solutions yet</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Mark completed submissions as solutions to save them here.
                                    </p>
                                </div>
                            ) : (
                                submissions.filter(s => s.isSolution).map((submission) => {
                                    const dateStr = submission.submittedAt || submission.createdAt || '';
                                    let formattedTime = 'Recently';

                                    try {
                                        if (dateStr) {
                                            const date = new Date(dateStr);
                                            if (!isNaN(date.getTime())) {
                                                formattedTime = date.toLocaleTimeString();
                                            }
                                        }
                                    } catch {
                                        // Fallback
                                    }

                                    return (
                                        <div
                                            key={submission.id}
                                            onClick={() => {
                                                const sub = submissions.find(s => s.id === submission.id);
                                                if (sub) {
                                                    onLoadSubmission(sub);
                                                }
                                            }}
                                            className="p-3 rounded-md bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 hover:from-amber-500/10 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                                                    <span className="text-xs font-semibold text-amber-400">
                                                        {submission.solutionName || 'Solution'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    {formattedTime}
                                                </div>
                                            </div>

                                            {submission.score != null && (
                                                <div className="flex items-center gap-3 text-[10px]">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-foreground">{submission.score}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="ai_analysis" className="mt-0">
                        <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" className="-m-6 p-4">
                            <AiAnalysisPanel
                                analysis={aiAnalysis}
                                isAnalyzing={isAnalyzing}
                                onAnalyze={onAnalyze}
                            />
                        </motion.div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
