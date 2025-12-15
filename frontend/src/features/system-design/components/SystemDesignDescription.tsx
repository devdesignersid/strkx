import { motion } from 'framer-motion';
import { PanelLeftClose, Star, Clock, PanelBottomOpen } from 'lucide-react';
import type { SystemDesignProblem } from '@/types/system-design';
import { fadeIn } from '@/design-system/animations';
import { Tabs, TabsList, TabsTrigger, TabsContent, Button, MarkdownRenderer } from '@/design-system/components';

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
    onDeleteSubmission?: (id: string) => void;
}

export function SystemDesignDescription({
    problem,
    submissions,
    solutions,
    aiAnalysis,
    isAIEnabled,
    isAnalyzing,
    onAnalyze,
    onLoadSubmission,
    onMarkAsSolution,
    onCollapse,
    isNotesCollapsed,
    onToggleNotes,
    onDeleteSubmission,
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
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleNotes}
                                className="h-7 w-7"
                                title="Expand Notes"
                            >
                                <PanelBottomOpen className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCollapse}
                            className="h-7 w-7"
                            title="Collapse Description"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-card">
                    <TabsContent value="description" className="mt-0 h-full p-6">
                        <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit">
                            <MarkdownRenderer content={problem.description || 'No description available.'} />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="submissions" className="mt-0 p-6">
                        <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-2">
                            <SubmissionsList
                                submissions={submissions}
                                onSelectSubmission={(id) => {
                                    const submission = submissions.find(s => s.id === id);
                                    if (submission) {
                                        onLoadSubmission(submission);
                                    }
                                }}
                                onMarkAsSolution={onMarkAsSolution}
                                onDeleteSubmission={onDeleteSubmission}
                            />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="solutions" className="mt-0 p-6">
                        <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-6">
                            {/* User Solutions */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Solutions</h3>
                                {submissions.filter(s => s.isSolution).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/10 rounded-lg border border-border/50">
                                        <Star className="w-8 h-8 text-muted-foreground/30 mb-2" />
                                        <p className="text-xs text-muted-foreground">
                                            Mark completed submissions as solutions to save them here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {submissions.filter(s => s.isSolution).map((submission) => {
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
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Official Solutions */}
                            {solutions && solutions.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pt-4 border-t border-border">Official Solutions</h3>
                                    <div className="space-y-2">
                                        {solutions.map((sol) => (
                                            <div
                                                key={sol.id}
                                                // TODO: Implement loading official solution (snapshot/json)
                                                // onClick={() => onLoadSolution(sol)} 
                                                className="p-3 rounded-md bg-card border border-border hover:border-primary/40 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {sol.title}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(sol.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {sol.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="ai_analysis" className="mt-0 p-6">
                        <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" className="">
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
