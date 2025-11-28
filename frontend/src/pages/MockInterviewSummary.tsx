import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Clock, ArrowRight, Home, RefreshCw } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

const MockInterviewSummary: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  useEffect(() => {
    fetch(`http://localhost:3000/interview-sessions/${sessionId}`)
      .then(res => res.json())
      .then((data: SessionSummary) => {
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

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  if (!summary) return <div className="flex items-center justify-center h-screen bg-black text-white"><Loader2 className="animate-spin" /></div>;

  const passedCount = summary.questions.filter(q => q.outcome === 'PASSED').length;
  const totalCount = summary.questions.length;
  const score = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center justify-center font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-6">
            <div className="inline-block p-6 rounded-full bg-card border border-border mb-4 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-5xl font-bold text-primary tracking-tighter">
                    {score}%
                </span>
            </div>
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Interview Complete</h1>
                <p className="text-muted-foreground text-lg">
                    {score === 100 ? "Perfect score! You're ready for the real thing. 🚀" :
                    score >= 50 ? "Good job! Keep practicing to improve speed and accuracy." :
                    "Keep going! Review the problems and try again."}
                </p>
            </div>
        </div>

        {/* Results Grid */}
        <div className="grid gap-4">
            {summary.questions.map((q, idx) => {
                const timeSpent = q.startTime && q.endTime
                    ? Math.floor((new Date(q.endTime).getTime() - new Date(q.startTime).getTime()) / 1000)
                    : 0;

                return (
                    <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-card border border-border rounded-xl p-6 flex items-center justify-between hover:border-primary/20 transition-colors shadow-sm"
                    >
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "p-3 rounded-full border",
                                q.outcome === 'PASSED'
                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                            )}>
                                {q.outcome === 'PASSED' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">{q.problem.title}</h3>
                                <div className="flex gap-2 mt-1.5">
                                    <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium border border-white/5">{q.problem.difficulty}</span>
                                    {q.autoSubmitted && <span className="text-xs px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Auto-Submitted</span>}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1.5 justify-end">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono text-sm">{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</span>
                            </div>
                            <div className={cn(
                                "text-sm font-medium",
                                q.outcome === 'PASSED' ? "text-green-500" : "text-red-500"
                            )}>
                                {q.outcome === 'PASSED' ? 'All tests passed' : 'Tests failed'}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-8">
            <button
                onClick={() => navigate('/')}
                className="px-8 py-3.5 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-all flex items-center gap-2 border border-white/5"
            >
                <Home className="w-4 h-4" /> Back to Dashboard
            </button>
            <button
                onClick={() => navigate('/mock-interview')}
                className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
                <RefreshCw className="w-4 h-4" /> Start New Interview
            </button>
        </div>

      </motion.div>
    </div>
  );
};

export default MockInterviewSummary;
