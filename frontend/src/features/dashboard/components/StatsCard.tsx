import { memo } from 'react';
import { Clock, Trophy, Zap, Target, Flame, PenTool, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useStudyTimer } from '@/context/StudyTimerContext';
import { Card } from '@/design-system/components';
import { staggerContainer } from '@/design-system/animations';

export const StatsCard = memo(({ stats }: { stats: any }) => {
    const { isEnabled } = useStudyTimer();

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8",
                isEnabled ? "lg:grid-cols-4" : "lg:grid-cols-3"
            )}
        >
            {/* Study Time Card */}
            {isEnabled && (
                <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Focus Time</div>
                            <div className="text-4xl font-bold tracking-tight text-foreground">{stats.studyTime || '0m'}</div>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Timer className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                        <span className="text-blue-500 font-medium">Today</span>
                    </div>
                </Card>
            )}

            {/* Total Hours Card */}
            <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Total Hours</div>
                        <div className="text-4xl font-bold tracking-tight text-foreground">{stats.totalHours || 0}</div>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                    <span className="text-blue-500 font-medium">Lifetime</span>
                </div>
            </Card>

            {/* Solved Card */}
            <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Total Solved</div>
                        <div className="text-4xl font-bold tracking-tight text-foreground">{stats.solved}</div>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Trophy className="w-5 h-5" />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                    <span className={cn("font-medium flex items-center gap-0.5", stats.weeklyChange >= 0 ? "text-green-500" : "text-red-500")}>
                        {stats.weeklyChange > 0 ? '+' : ''}{stats.weeklyChange}% <span className="text-muted-foreground">vs last week</span>
                    </span>
                </div>
            </Card>

            {/* Easy Card */}
            <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-green-500/50 transition-all duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Easy</div>
                        <div className="text-4xl font-bold tracking-tight text-foreground">{stats.easy}</div>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                        <Zap className="w-5 h-5" />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                    <span className="text-green-500 font-medium">Great Start</span>
                </div>
            </Card>

            {/* Medium Card */}
            <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-yellow-500/50 transition-all duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Medium</div>
                        <div className="text-4xl font-bold tracking-tight text-foreground">{stats.medium}</div>
                    </div>
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                        <Target className="w-5 h-5" />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                    <span className="text-yellow-500 font-medium">Keep Going</span>
                </div>
            </Card>

            {/* Hard Card */}
            <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-red-500/50 transition-all duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">Hard</div>
                        <div className="text-4xl font-bold tracking-tight text-foreground">{stats.hard}</div>
                    </div>
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                        <Flame className="w-5 h-5" />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                    <span className="text-red-500 font-medium">Mastery</span>
                </div>
            </Card>

            {/* System Design Card */}
            <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1">System Design</div>
                        <div className="text-4xl font-bold tracking-tight text-foreground">{stats.systemDesignSolved || 0}</div>
                    </div>
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                        <PenTool className="w-5 h-5" />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                    <span className="text-purple-500 font-medium">Architect</span>
                </div>
            </Card>
        </motion.div>
    );
});

