import { useResumeStore } from '../../hooks/useResumeStore';
import { BadgeCheck, BrainCircuit, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkContentForViolations } from '../../utils/resume-guidelines';
import { useMemo } from 'react';

interface CoachPanelProps {
    onToggleBlur: () => void;
    isBlurred: boolean;
}

export const CoachPanel = ({ onToggleBlur, isBlurred }: CoachPanelProps) => {
    const data = useResumeStore(state => state.draft);

    const checkResult = useMemo(() => {
        const allViolations: string[] = [];

        let scoreContact = 100;
        let scoreSummary = 100;
        let scoreExperience = 100;
        let scoreEducation = 100;
        let scoreSkills = 100;

        // 1. Check Contact Info (Weight: 15%)
        if (!data.content.profile.email || !data.content.profile.phone || !data.content.profile.location) {
            scoreContact = 0;
            allViolations.push("Missing Contact Info (Email, Phone, or Location)");
        }

        // 2. Check Summary (Weight: 15%)
        if (data.content.summary) {
            const res = checkContentForViolations(data.content.summary);
            scoreSummary = res.score;
            if (res.violations.length > 0) allViolations.push(...res.violations.map(v => `Summary: ${v}`));
        } else {
            scoreSummary = 0;
            allViolations.push("Summary is missing");
        }

        // 3. Check Experience (Weight: 40%) - MOST CRITICAL
        if (data.content.experience.length === 0) {
            scoreExperience = 0;
            allViolations.push("No Experience defined. This is critical.");
        } else {
            let totalExpScore = 0;
            data.content.experience.forEach((exp, idx) => {
                const res = checkContentForViolations(exp.description);
                totalExpScore += res.score;

                // Show violations for the first few items
                res.violations.slice(0, 2).forEach(v => {
                    allViolations.push(`Role ${idx + 1} (${exp.company || 'Unknown'}): ${v}`);
                });
            });
            scoreExperience = totalExpScore / data.content.experience.length;
        }

        // 4. Check Education (Weight: 15%)
        if (data.content.education.length === 0) {
            scoreEducation = 0;
            allViolations.push("No Education defined.");
        }

        // 5. Check Skills (Weight: 15%)
        if (data.content.skills.length === 0) {
            scoreSkills = 0;
            allViolations.push("No Skills defined.");
        }

        // Weighted Total
        const totalScore =
            (scoreContact * 0.15) +
            (scoreSummary * 0.15) +
            (scoreExperience * 0.40) +
            (scoreEducation * 0.15) +
            (scoreSkills * 0.15);

        return { score: Math.round(totalScore), violations: allViolations };
    }, [data]);

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-500";
        if (score >= 70) return "text-yellow-500";
        return "text-red-500";
    }

    return (
        <div className="flex flex-col h-full bg-card">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <span className="text-sm font-semibold flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-primary" />
                    Coach
                </span>
                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">BETA</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">

                {/* 1. Scorecard */}
                <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                        <span className="uppercase text-[10px] tracking-wider text-muted-foreground font-bold">ATS Score</span>
                        <span className={cn("text-xs font-bold", getScoreColor(checkResult.score))}>{checkResult.score < 100 ? "Needs Improvement" : "Perfect"}</span>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex-1">
                            <span className={cn("text-4xl font-bold font-mono tracking-tight", getScoreColor(checkResult.score))}>
                                {checkResult.score}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">/ 100</span>
                        </div>
                        <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary flex items-center justify-center">
                            <BadgeCheck className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                </div>

                {/* 2. Violations / Insights */}
                <div className="space-y-3">
                    <span className="uppercase text-[10px] tracking-wider text-muted-foreground font-bold">Insights</span>

                    {checkResult.violations.length === 0 ? (
                        <div className="p-3 border border-green-500/20 bg-green-500/5 rounded-lg flex gap-3">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            <p className="text-xs text-green-600">Great job! No major issues detected.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {checkResult.violations.slice(0, 5).map((v, i) => (
                                <div key={i} className="p-2 border border-orange-500/20 bg-orange-500/5 rounded-md flex gap-2 items-start">
                                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">{v}</p>
                                </div>
                            ))}
                            {checkResult.violations.length > 5 && (
                                <p className="text-[10px] text-muted-foreground text-center">
                                    + {checkResult.violations.length - 5} more issues
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Tools */}
                <div className="space-y-3 pt-4 border-t border-border">
                    <span className="uppercase text-[10px] tracking-wider text-muted-foreground font-bold">Tools</span>

                    <button
                        onClick={onToggleBlur}
                        className={cn(
                            "w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all shadow-sm",
                            isBlurred
                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                : "bg-background border-border hover:border-primary/50 text-foreground"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span className="font-medium">7.4s Recruiter Scan</span>
                        </div>
                        <div className={cn("w-2 h-2 rounded-full", isBlurred ? "bg-white animate-pulse" : "bg-muted-foreground/30")} />
                    </button>
                    <p className="text-[10px] text-muted-foreground px-1">
                        Use this to test if your key headers and metrics stand out in a blur test.
                    </p>
                </div>

            </div>
        </div>
    );
};
