import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Clock, Home, RefreshCw, Trophy, Activity, Timer } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/config';

interface QuestionResult {
    id: string;
    problem: { title: string; difficulty: string };
    status: string;
    outcome: string;
    startTime: string;
    endTime: string;
    autoSubmitted: boolean;
}

interface SessionSummary {
    id: string;
    status: string;
    questions: QuestionResult[];
    startTime: string;
    endTime: string;
    createdAt: string; // Add createdAt as fallback for startTime
}

const MockInterviewSummary: React.FC = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [summary, setSummary] = useState<SessionSummary | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/interview-sessions/${sessionId}`, { credentials: 'include' })
            .then(res => res.json())
            .then((response) => {
                // Backend wraps response in a "data" object via TransformInterceptor
                const data: SessionSummary = response.data || response;
                setSummary(data);

                // Trigger confetti if all passed
                const allPassed = data.questions.every(q => q.outcome === 'PASSED');
                if (allPassed) {
                    triggerConfetti();
                }
            })
            .catch(err => console.error(err));
    }, [sessionId]);

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    if (!summary) return <div className="flex items-center justify-center h-screen bg-background text-foreground"><Loader2 className="animate-spin" /></div>;

    const passedCount = summary.questions.filter(q => q.outcome === 'PASSED').length;
    const totalCount = summary.questions.length;
    const score = Math.round((passedCount / totalCount) * 100);

    const formatDuration = (start?: string, end?: string) => {
        if (!start || !end) return '0m 0s';
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        if (isNaN(startTime) || isNaN(endTime)) return '0m 0s';

        const diff = Math.max(0, Math.floor((endTime - startTime) / 1000));
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}m ${secs}s`;
    };

    const totalDuration = formatDuration(summary.startTime || summary.createdAt, summary.endTime);

    // Calculate average time
    const totalSeconds = summary.questions.reduce((acc, q) => {
        if (!q.startTime || !q.endTime) return acc;
        return acc + Math.max(0, Math.floor((new Date(q.endTime).getTime() - new Date(q.startTime).getTime()) / 1000));
    }, 0);
    const avgSeconds = totalCount > 0 ? Math.floor(totalSeconds / totalCount) : 0;
    const avgTime = `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans p-8 flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-5xl w-full space-y-8"
            >
                {/* Header */}
                <div className="text-center space-y-4 mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(62,207,142,0.2)]">
                        <Trophy className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Interview Complete</h1>
                    <p className="text-muted-foreground text-lg">
                        {score === 100 ? "Perfect score! You're ready for the real thing. 🚀" :
                            score >= 50 ? "Good job! Keep practicing to improve speed and accuracy." :
                                "Keep going! Review the problems and try again."}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Score Card */}
                    <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Score</div>
                                <div className="text-4xl font-bold tracking-tight text-foreground">{score}%</div>
                            </div>
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                            <span className={cn("font-medium", score >= 70 ? "text-green-500" : "text-yellow-500")}>
                                {passedCount}/{totalCount} Passed
                            </span>
                        </div>
                    </div>

                    {/* Total Time Card */}
                    <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Total Time</div>
                                <div className="text-4xl font-bold tracking-tight text-foreground">{totalDuration}</div>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                            <span className="text-blue-500 font-medium">Session Duration</span>
                        </div>
                    </div>

                    {/* Avg Time Card */}
                    <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Avg. Time</div>
                                <div className="text-4xl font-bold tracking-tight text-foreground">{avgTime}</div>
                            </div>
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <Timer className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                            <span className="text-purple-500 font-medium">Per Question</span>
                        </div>
                    </div>
                </div>

                {/* Results List */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-6">Question Breakdown</h3>
                    <div className="space-y-4">
                        {summary.questions.map((q, idx) => {
                            const duration = formatDuration(q.startTime, q.endTime);

                            return (
                                <motion.div
                                    key={q.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "p-2 rounded-full",
                                            q.outcome === 'PASSED' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                        )}>
                                            {q.outcome === 'PASSED' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-foreground">{q.problem.title}</h4>
                                                {q.autoSubmitted && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-wide font-semibold">
                                                        Auto
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "text-xs font-medium",
                                                    q.problem.difficulty === 'Easy' && "text-green-500",
                                                    q.problem.difficulty === 'Medium' && "text-yellow-500",
                                                    q.problem.difficulty === 'Hard' && "text-red-500"
                                                )}>
                                                    {q.problem.difficulty}
                                                </span>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-xs text-muted-foreground font-mono">{duration}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "text-sm font-medium",
                                        q.outcome === 'PASSED' ? "text-green-500" : "text-red-500"
                                    )}>
                                        {q.outcome === 'PASSED' ? 'Passed' : 'Failed'}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4 pt-4">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-all flex items-center gap-2 border border-white/5 hover:border-white/10 text-sm"
                    >
                        <Home className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/mock-interview')}
                        className="group relative px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Start New Interview
                        </span>
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default MockInterviewSummary;
