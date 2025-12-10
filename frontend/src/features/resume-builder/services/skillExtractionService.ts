/**
 * Skill Extraction Service
 * Uses AI to extract hard skills from Work Experience content
 */

import { aiService } from '@/lib/ai/aiService';
import { PROMPTS } from '@/lib/ai/prompts';
import type { ResumeExperience, SkillCategory } from '../types/schema';

export interface ExtractedSkills {
    Languages: string[];
    Frameworks: string[];
    Tools: string[];
    Cloud: string[];
    Databases: string[];
    DevOps: string[];
    Other: string[];
}

export interface SkillExtractionResult {
    skills: ExtractedSkills;
}

/**
 * Compress work experience into minimal text for efficient token usage
 */
function compressExperience(experiences: ResumeExperience[]): string {
    if (!experiences || experiences.length === 0) {
        return '';
    }

    return experiences.map(exp => {
        const parts: string[] = [];
        if (exp.position) parts.push(exp.position);
        if (exp.company) parts.push(`at ${exp.company}`);
        if (exp.description) {
            // Clean up description, remove excessive whitespace
            const cleanDesc = exp.description
                .replace(/\s+/g, ' ')
                .trim();
            parts.push(cleanDesc);
        }
        return parts.join(' - ');
    }).join('\n\n');
}

/**
 * Parse AI response into structured skills
 */
function parseSkillResponse(response: string): ExtractedSkills {
    // Try to extract JSON from response
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    try {
        const parsed = JSON.parse(jsonStr) as SkillExtractionResult;

        // Validate structure
        if (!parsed.skills || typeof parsed.skills !== 'object') {
            throw new Error('Invalid response structure: missing skills object');
        }

        // Return with defaults for missing categories
        return {
            Languages: Array.isArray(parsed.skills.Languages) ? parsed.skills.Languages : [],
            Frameworks: Array.isArray(parsed.skills.Frameworks) ? parsed.skills.Frameworks : [],
            Tools: Array.isArray(parsed.skills.Tools) ? parsed.skills.Tools : [],
            Cloud: Array.isArray(parsed.skills.Cloud) ? parsed.skills.Cloud : [],
            Databases: Array.isArray(parsed.skills.Databases) ? parsed.skills.Databases : [],
            DevOps: Array.isArray(parsed.skills.DevOps) ? parsed.skills.DevOps : [],
            Other: Array.isArray(parsed.skills.Other) ? parsed.skills.Other : [],
        };
    } catch (e) {
        console.error('[SkillExtraction] Failed to parse response:', e);
        throw new Error('Failed to parse AI response');
    }
}

/**
 * Convert extracted skills to SkillCategory[] format for the resume store
 */
export function skillsToCategories(skills: ExtractedSkills): SkillCategory[] {
    const categories: SkillCategory[] = [];

    // Only include non-empty categories
    const categoryMap: [keyof ExtractedSkills, string][] = [
        ['Languages', 'Languages'],
        ['Frameworks', 'Frameworks'],
        ['Tools', 'Tools'],
        ['Cloud', 'Cloud'],
        ['Databases', 'Databases'],
        ['DevOps', 'DevOps'],
        ['Other', 'Other'],
    ];

    for (const [key, name] of categoryMap) {
        if (skills[key].length > 0) {
            categories.push({
                id: crypto.randomUUID(),
                name,
                skills: skills[key],
            });
        }
    }

    return categories;
}

export const SkillExtractionService = {
    /**
     * Extract skills from work experience using AI
     */
    async extract(experiences: ResumeExperience[]): Promise<ExtractedSkills> {
        // Validate we have AI configured
        if (!aiService.isEnabled() || !aiService.isConfigured()) {
            throw new Error('AI service not configured. Please configure AI in Settings.');
        }

        // Validate we have experience to analyze
        const compressed = compressExperience(experiences);
        if (!compressed.trim()) {
            throw new Error('No work experience to analyze. Add experience entries first.');
        }

        // Build prompt
        const prompt = PROMPTS.SKILL_EXTRACTION.replace('{workExperience}', compressed);

        // Call AI
        const response = await aiService.generateCompletion(prompt);

        // Parse and return
        return parseSkillResponse(response);
    },
};
