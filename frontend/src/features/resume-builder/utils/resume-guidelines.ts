export const RESUME_GUIDELINES = {
    WEAK_VERBS: [
        'assisted', 'worked on', 'utilized', 'responsible for', 'helped', 'participated', 'supported'
    ],
    FLUFF_WORDS: [
        'go-getter', 'hard worker', 'detail-oriented', 'thinks outside the box', 'team player', 'motivated', 'dynamic', 'enthusiastic', 'excellent communication skills'
    ],
    PRONOUNS: [
        ' i ', ' me ', ' my ', ' we ', ' our ', ' mine ', ' us ' // Spaces to avoid partial matches
    ],
    HIGH_IMPACT_VERBS: [
        'Achieved', 'Earned', 'Increased', 'Decreased', 'Modernized', 'Resolved', 'Launched', 'Built', 'Generated', 'Optimized', 'Spearheaded'
    ],
    AI_SYSTEM_PROMPT: `
    You are an expert Resume Writer adhering to stricter standards than typical advice. 
    You MUST follow these MANDATORY RULES:
    1. NO Personal Pronouns (I, me, my, we). Start strictly with Action Verbs.
    2. NO Fluff words (go-getter, hard worker, team player). Focus on hard skills and outcomes.
    3. NO Weak verbs (assisted, worked on, utilized, responsible for). Use Impact Verbs (Achieved, Built, Optimized).
    4. QUANTIFY EVERYTHING. If a number isn't provided, suggest a placeholder like [X%] or [X] users.
    5. IMPACT OVER RESPONSIBILITY. Structure as: "Action Verb + Noun + Metric + Outcome".
    6. CONCISE. Remove all filler words.
    
    Rewrite the input to strictly follow these rules.
    `
};

export const checkContentForViolations = (text: string) => {
    if (!text) return { score: 0, violations: [] };

    const lower = text.toLowerCase();
    const violations: string[] = [];
    let score = 100;

    // Check Pronouns
    RESUME_GUIDELINES.PRONOUNS.forEach(word => {
        if (lower.includes(word)) {
            violations.push(`Found personal pronoun: "${word.trim()}"`);
            score -= 5;
        }
    });

    // Check Weak Verbs
    RESUME_GUIDELINES.WEAK_VERBS.forEach(word => {
        if (lower.includes(word)) {
            violations.push(`Found weak verb: "${word}" (Try: ${RESUME_GUIDELINES.HIGH_IMPACT_VERBS.slice(0, 3).join(', ')})`);
            score -= 3;
        }
    });

    // Check Fluff
    RESUME_GUIDELINES.FLUFF_WORDS.forEach(word => {
        if (lower.includes(word)) {
            violations.push(`Found fluff word: "${word}"`);
            score -= 4;
        }
    });

    // Check Metrics (Mandatory for ALL descriptions)
    if (!/\d+|%|\$|one|two|three/i.test(text)) {
        violations.push("No metrics/numbers found. You MUST quantify impact (e.g., 'Increased by 20%').");
        score -= 15;
    }

    // Check Length (Too Short)
    if (text.length < 50) {
        violations.push("Description is too short. Expand on your impact.");
        score -= 15;
    }

    return { score: Math.max(0, score), violations };
};
