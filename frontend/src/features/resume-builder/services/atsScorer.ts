import type { ResumeData } from '../types/schema';

// Heuristics
const ACTION_VERBS = [
    'accelerated', 'achieved', 'added', 'awarded', 'changed', 'contributed', 'decreased',
    'delivered', 'eliminated', 'expanded', 'generated', 'improved', 'increased', 'launched',
    'led', 'maximized', 'minimized', 'optimized', 'produced', 'saved', 'solved',
    'streamlined', 'strengthened', 'supervised', 'won', 'architected', 'engineered',
    'developed', 'implemented', 'orchestrated'
];

const PRONOUNS = ['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours'];
const WEAK_PHRASES = ['responsible for', 'duties included', 'helped', 'worked on', 'assisted with'];

export interface AtsFeedback {
    score: number;
    criticalIssues: string[];
    warnings: string[];
    goodPoints: string[];
}

export const analyzeResume = (data: ResumeData): AtsFeedback => {
    let score = 100;
    const critical: string[] = [];
    const warnings: string[] = [];
    const good: string[] = [];

    const { content } = data;

    // 1. Structure & Contact (20 pts)
    if (!content.profile.name) { score -= 20; critical.push("Name is missing"); }
    if (!content.profile.email) { score -= 10; critical.push("Email is missing"); }
    if (!content.profile.phone) { score -= 5; warnings.push("Phone number is recommended"); }
    if (!content.profile.linkedin) { score -= 5; warnings.push("LinkedIn profile is missing"); }
    if (!content.profile.location) { score -= 5; warnings.push("Location is missing"); }

    // 2. Sections checks (20 pts)
    if (!content.summary) { score -= 5; warnings.push("Professional Summary is recommended"); }
    if (content.experience.length === 0) { score -= 20; critical.push("No experience listed"); }
    if (content.education.length === 0) { score -= 10; critical.push("No education listed"); }
    if (content.skills.length === 0) { score -= 10; critical.push("No skills listed"); }
    if (content.skills.length > 0 && content.skills.length < 5) { score -= 5; warnings.push("List at least 5 relevant skills"); }

    // 3. Content Analysis (60 pts)
    // Check bullets
    let totalBullets = 0;
    let quantBullets = 0;
    let weakBullets = 0;
    let actionVerbCount = 0;
    let pronounCount = 0;

    content.experience.forEach(exp => {
        if (!exp.description) return;

        // Simple split by newline or bullet char
        const bullets = exp.description.split(/\n|\•/).map(s => s.trim()).filter(s => s.length > 5);
        totalBullets += bullets.length;

        bullets.forEach(bullet => {
            const lower = bullet.toLowerCase();

            // Check for quantifiers (digits)
            if (/\d+/.test(lower)) quantBullets++;

            // Check pronouns
            const hasPronoun = PRONOUNS.some(p => new RegExp(`\\b${p}\\b`).test(lower));
            if (hasPronoun) pronounCount++;

            // Check Action Verbs
            const hasAction = ACTION_VERBS.some(v => new RegExp(`\\b${v}\\b`).test(lower));
            if (hasAction) actionVerbCount++;

            // Check Weak phrases
            const hasWeak = WEAK_PHRASES.some(w => lower.includes(w));
            if (hasWeak) weakBullets++;
        });
    });

    if (totalBullets > 0) {
        if (quantBullets / totalBullets < 0.3) {
            score -= 10;
            warnings.push("Quantify more results (use numbers/metrics in >30% of bullets)");
        } else {
            good.push("Good use of quantified metrics");
        }

        if (pronounCount > 0) {
            score -= 5 * pronounCount; // heavy penalty
            warnings.push(`Found ${pronounCount} uses of personal pronouns (I, me, we). Remove them.`);
        }

        if (weakBullets > 0) {
            score -= 5;
            warnings.push(`Avoid passive phrases like "Responsible for". Use action verbs.`);
        }

        if (actionVerbCount / totalBullets < 0.5) {
            score -= 10;
            warnings.push("Start sentences with strong action verbs");
        } else {
            good.push("Strong use of action verbs");
        }
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        criticalIssues: critical,
        warnings,
        goodPoints: good
    };
};
