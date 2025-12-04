import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { motion } from 'framer-motion';
import { Code2, CheckCircle2, XCircle, Star, Clock, Zap, TrendingUp, BrainCircuit, PanelLeftClose, Trash2 } from 'lucide-react';
import { LoadingThunder } from '@/design-system/components';
import type { Problem, Submission, Solution } from '@/types/problem';
import { EmptyState, Button } from '@/design-system/components';
import { fadeIn } from '@/design-system/animations';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/components';
import { Modal } from '@/design-system/components';

interface ProblemDescriptionProps {
  problem: Problem;
  submissions: Submission[];
  solutions: Solution[];
  aiAnalysis: any;
  isAnalyzing: boolean;
  isAIEnabled: boolean;
  onAnalyze: () => void;
  onLoadSubmission: (submission: Submission) => void;
  onMarkAsSolution: (submissionId: string, currentStatus: boolean, currentName: string | null) => void;
  onDeleteSubmission: (submissionId: string) => void;
  onLoadSolution: (code: string) => void;
  onCollapse: () => void;
  hiddenTabs?: string[];
}

export function ProblemDescription({
  problem,
  submissions,
  solutions,
  aiAnalysis,
  isAnalyzing,
  isAIEnabled,
  onAnalyze,
  onLoadSubmission,
  onMarkAsSolution,
  onDeleteSubmission,
  onLoadSolution,
  onCollapse,
  hiddenTabs = []
}: ProblemDescriptionProps) {
  const [submissionToDelete, setSubmissionToDelete] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-card">
      <Tabs defaultValue="description" className="flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-border px-2 pt-2 shrink-0">
          <div className="flex items-center overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent p-0 h-auto gap-1">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2">
                Description
              </TabsTrigger>
              {!hiddenTabs.includes('submissions') && (
                <TabsTrigger value="submissions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2">
                  Submissions
                </TabsTrigger>
              )}
              {!hiddenTabs.includes('solutions') && (
                <TabsTrigger value="solutions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2">
                  Solutions
                </TabsTrigger>
              )}
              {isAIEnabled && !hiddenTabs.includes('ai_analysis') && (
                <TabsTrigger value="ai_analysis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 py-2">
                  AI Analysis
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCollapse}
            className="h-8 w-8 p-0 ml-2 shrink-0"
            title="Collapse Description"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none prose-pre:bg-black/30 prose-pre:border prose-pre:border-border prose-headings:text-foreground/90 prose-p:text-muted-foreground prose-a:text-primary prose-code:text-primary/90 prose-code:text-[13px] prose-code:font-medium">
          <TabsContent value="description" className="mt-0">
            <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit">
              <h1 className="text-2xl font-bold text-foreground mb-4">{problem.title}</h1>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{problem.description || 'No description available.'}</ReactMarkdown>
            </motion.div>
          </TabsContent>

          <TabsContent value="submissions" className="mt-0">
            <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-2 -m-6 p-4">
              {submissions.length === 0 ? (
                <EmptyState
                  icon={Code2}
                  title="No submissions yet"
                  description="Run your code to see your history here."
                  className="py-12"
                />
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => onLoadSubmission(sub)}
                    className="p-3 rounded-md bg-card border border-border hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {sub.status === 'ACCEPTED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                        )}
                        <span className={`text-xs font-medium ${sub.status === 'ACCEPTED' ? 'text-green-500' : 'text-destructive'}`}>
                          {sub.status === 'ACCEPTED' ? 'Accepted' : 'Wrong Answer'}
                        </span>
                        {sub.isSolution && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                        {sub.isSolution && sub.solutionName && (
                          <span className="text-xs text-amber-400 ml-1">• {sub.solutionName}</span>
                        )}
                      </div>
                      {sub.status === 'ACCEPTED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsSolution(sub.id, sub.isSolution, sub.solutionName);
                          }}
                          className="h-6 text-[10px] px-2 py-0.5 bg-white/5 hover:bg-white/10 shrink-0"
                        >
                          {sub.isSolution ? 'Unmark' : 'Save as Solution'}
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(sub.createdAt).toLocaleTimeString()}
                      </div>

                      <div className="flex items-center gap-3">
                        {(sub.executionTime != null || sub.memoryUsed != null) && (
                          <>
                            {sub.executionTime != null && (
                              <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-400" />
                                <span>{sub.executionTime.toFixed(1)}ms</span>
                                {sub.timePercentile != null && sub.timePercentile < 50 && (
                                  <span className="text-green-400">↑{100 - sub.timePercentile}%</span>
                                )}
                              </div>
                            )}
                            {sub.memoryUsed != null && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-blue-400" />
                                <span>{(sub.memoryUsed / 1024).toFixed(1)}KB</span>
                              </div>
                            )}
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubmissionToDelete(sub.id);
                          }}
                          className="h-6 w-6 p-0 hover:text-destructive hover:bg-destructive/10"
                          title="Delete Submission"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="solutions" className="mt-0">
            <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-2 -m-6 p-4">
              {solutions.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="No solutions yet"
                  description="Mark accepted submissions as solutions to save them here."
                  className="py-12"
                />
              ) : (
                solutions.map((sol) => (
                  <div
                    key={sol.id}
                    onClick={() => onLoadSolution(sol.code)}
                    className="p-3 rounded-md bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 hover:from-amber-500/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="text-xs font-semibold text-amber-400">
                          {sol.solutionName || 'Solution'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(sol.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    {(sol.executionTime != null || sol.memoryUsed != null) && (
                      <div className="flex items-center gap-3 text-[10px]">
                        {sol.executionTime != null && (
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-foreground">{sol.executionTime.toFixed(1)}ms</span>
                          </div>
                        )}
                        {sol.memoryUsed != null && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-blue-400" />
                            <span className="text-foreground">{(sol.memoryUsed / 1024).toFixed(1)}KB</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="ai_analysis" className="mt-0">
            <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-6">
              {!aiAnalysis && !isAnalyzing ? (
                <EmptyState
                  icon={BrainCircuit}
                  title="AI Solution Analysis"
                  description="Get detailed feedback on your solution's time complexity, space complexity, and code quality."
                  action={{
                    label: "Analyze My Code",
                    onClick: onAnalyze
                  }}
                  className="py-12"
                />
              ) : isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <LoadingThunder size="lg" className="text-purple-400" />
                  <p className="text-muted-foreground">Analyzing your solution...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Analysis Results</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAnalyze}
                      disabled={isAnalyzing}
                      className="gap-2 text-purple-400 bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      Re-Analyze
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-card border border-border">
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Time Complexity</h4>
                      <p className="text-lg font-semibold text-foreground">{aiAnalysis.timeComplexity}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-card border border-border">
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Space Complexity</h4>
                      <p className="text-lg font-semibold text-foreground">{aiAnalysis.spaceComplexity}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-card border border-border">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Code Quality Score</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-destructive via-yellow-500 to-green-500"
                          style={{ width: `${aiAnalysis.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-foreground">{aiAnalysis.score}/100</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Suggestions</h4>
                    <ul className="space-y-2">
                      {aiAnalysis.suggestions?.map((suggestion: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>

      <Modal
        isOpen={!!submissionToDelete}
        onClose={() => setSubmissionToDelete(null)}
        title="Delete Submission"
        description="Are you sure you want to delete this submission? This action cannot be undone."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setSubmissionToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (submissionToDelete) {
                  onDeleteSubmission(submissionToDelete);
                  setSubmissionToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
